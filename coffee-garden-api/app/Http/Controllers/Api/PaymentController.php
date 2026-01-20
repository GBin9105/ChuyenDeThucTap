<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\PaymentTransaction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct()
    {
        // create retry cần auth; return/ipn thì không
        $this->middleware('auth:sanctum')->only(['retryVnpay']);
    }

    /**
     * POST /api/payments/vnpay/retry
     * Body: order_id
     * => tạo attempt mới + trả payment_url
     */
    public function retryVnpay(Request $request)
    {
        $data = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
        ]);

        $order = Order::findOrFail($data['order_id']);
        abort_if($order->user_id !== auth()->id(), 403, 'Forbidden');

        if ($order->payment_method !== 'vnpay') {
            return response()->json(['message' => 'Order is not VNPay'], 422);
        }

        if ($order->payment_status === 'success') {
            return response()->json(['message' => 'Order already paid'], 422);
        }

        $paymentUrl = $this->createAttemptAndUrl($order);

        return response()->json([
            'order_id' => $order->id,
            'payment_url' => $paymentUrl,
        ]);
    }

    /**
     * GET /api/payments/vnpay/return
     * Chỉ dùng để redirect người dùng về FE, KHÔNG làm logic trừ kho ở đây.
     * :contentReference[oaicite:2]{index=2}
     */
    public function vnpayReturn(Request $request)
    {
        $verify = $this->verifyVnpayQuery($request->query());

        $frontend = env('FRONTEND_RETURN_URL', 'http://localhost:3000/payment-result');

        // chuyển sang FE để hiển thị
        $qs = http_build_query([
            'ok'      => $verify['is_verified'] ? 1 : 0,
            'success' => $verify['is_success'] ? 1 : 0,
            'txnRef'  => $verify['txn_ref'] ?? null,
            'code'    => $verify['response_code'] ?? null,
        ]);

        return redirect()->away($frontend . '?' . $qs);
    }

    /**
     * GET /api/payments/vnpay/ipn
     * VNPay server call => nơi cập nhật DB + trừ kho khi success.
     * :contentReference[oaicite:3]{index=3}
     */
    public function vnpayIpn(Request $request)
    {
        $query = $request->query();
        $verify = $this->verifyVnpayQuery($query);

        if (!$verify['is_verified']) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid signature']);
        }

        $txnRef = $verify['txn_ref'];
        $amount = (int)($query['vnp_Amount'] ?? 0);

        $tx = PaymentTransaction::where('vnp_TxnRef', $txnRef)->first();
        if (!$tx) {
            return response()->json(['RspCode' => '01', 'Message' => 'Order not found']);
        }

        // amount mismatch
        if ((int)$tx->vnp_Amount !== $amount) {
            return response()->json(['RspCode' => '04', 'Message' => 'Invalid amount']);
        }

        // idempotent
        if ($tx->status === 'success') {
            return response()->json(['RspCode' => '02', 'Message' => 'Order already confirmed']);
        }

        // Update tx fields
        $tx->vnp_TransactionNo     = $query['vnp_TransactionNo'] ?? null;
        $tx->vnp_ResponseCode      = $query['vnp_ResponseCode'] ?? null;
        $tx->vnp_TransactionStatus = $query['vnp_TransactionStatus'] ?? null;
        $tx->vnp_BankCode          = $query['vnp_BankCode'] ?? null;
        $tx->vnp_PayDate           = $query['vnp_PayDate'] ?? null;
        $tx->payload               = $query;
        $tx->vnp_SecureHash        = $query['vnp_SecureHash'] ?? null;
        $tx->is_verified           = true;

        $isSuccess = $verify['is_success'];

        if (!$isSuccess) {
            $tx->status = 'failed';
            $tx->save();

            // cập nhật trạng thái chung của order (cho phép retry)
            if ($tx->order_id) {
                $order = Order::find($tx->order_id);
                if ($order && $order->payment_status !== 'success') {
                    $order->payment_status = 'failed';
                    $order->save();
                }
            }

            return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
        }

        // SUCCESS: trừ kho + set order paid trong transaction
        DB::transaction(function () use ($tx) {
            $tx->status = 'success';
            $tx->save();

            $order = Order::with('items')->lockForUpdate()->find($tx->order_id);
            if (!$order) return;

            // idempotent order-level
            if ($order->payment_status === 'success') return;

            // trừ kho khi payment success (yêu cầu của bạn)
            foreach ($order->items as $item) {
                /** @var OrderDetail $item */
                if (!$item->product_id) continue;

                $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                if (!$product) continue;

                // nếu thiếu kho: demo -> không rollback thanh toán (vì VNPay đã success),
                // bạn nên xử lý manual/refund ở level business
                if ((int)$product->stock < (int)$item->qty) {
                    $order->note = trim(($order->note ?? '') . "\n[StockError] Not enough stock for product_id={$item->product_id}");
                    // vẫn mark paid để phản ánh payment; xử lý sau
                    continue;
                }

                $product->stock = (int)$product->stock - (int)$item->qty;
                $product->save();
            }

            $order->payment_status = 'success';
            $order->status = 2; // paid (theo mapping tinyint của bạn)
            $order->paid_at = now();
            $order->save();
        });

        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }

    /**
     * Internal: tạo attempt mới + trả payment url
     */
    private function createAttemptAndUrl(Order $order): string
    {
        $tmnCode    = config('services.vnpay.tmn_code');
        $hashSecret = config('services.vnpay.hash_secret');
        $vnpUrl     = config('services.vnpay.url');
        $returnUrl  = config('services.vnpay.return_url');

        if (!$tmnCode || !$hashSecret || !$vnpUrl || !$returnUrl) {
            throw new \RuntimeException('VNPay config missing');
        }

        $amount = (int) round(((float)$order->total_price) * 100);

        $txnRef = $order->order_code . '-' . Str::upper(Str::random(6));

        PaymentTransaction::create([
            'order_id'   => $order->id,
            'vnp_TxnRef' => $txnRef,
            'vnp_Amount' => $amount,
            'status'     => 'pending',
        ]);

        $ipAddr = request()->ip() ?? '127.0.0.1';

        $params = [
            'vnp_Version'   => '2.1.0',
            'vnp_Command'   => 'pay',
            'vnp_TmnCode'   => $tmnCode,
            'vnp_Amount'    => $amount,
            'vnp_CurrCode'  => 'VND',
            'vnp_TxnRef'    => $txnRef,
            'vnp_OrderInfo' => 'Thanh toan don hang: ' . $order->order_code,
            'vnp_OrderType' => 'other',
            'vnp_Locale'    => 'vn',
            'vnp_ReturnUrl' => $returnUrl,
            'vnp_IpAddr'    => $ipAddr,
            'vnp_CreateDate'=> now()->format('YmdHis'),
            'vnp_ExpireDate'=> now()->addMinutes(15)->format('YmdHis'),
        ];

        ksort($params);

        $hashData = [];
        foreach ($params as $k => $v) {
            $hashData[] = $k . '=' . urlencode((string)$v);
        }
        $hashDataStr = implode('&', $hashData);

        $secureHash = hash_hmac('sha512', $hashDataStr, $hashSecret);

        $query = [];
        foreach ($params as $k => $v) {
            $query[] = urlencode($k) . '=' . urlencode((string)$v);
        }
        $query[] = 'vnp_SecureHash=' . $secureHash;

        return $vnpUrl . '?' . implode('&', $query);
    }

    /**
     * Verify VNPay checksum + determine success
     * checksum: sort param names, exclude vnp_SecureHash :contentReference[oaicite:4]{index=4}
     */
    private function verifyVnpayQuery(array $query): array
    {
        $hashSecret = config('services.vnpay.hash_secret');

        $secureHash = $query['vnp_SecureHash'] ?? '';
        $txnRef     = $query['vnp_TxnRef'] ?? null;

        $input = $query;
        unset($input['vnp_SecureHash'], $input['vnp_SecureHashType']);

        ksort($input);

        $hashData = [];
        foreach ($input as $k => $v) {
            $hashData[] = $k . '=' . urlencode((string)$v);
        }
        $hashDataStr = implode('&', $hashData);

        $calculated = hash_hmac('sha512', $hashDataStr, $hashSecret);

        $isVerified = hash_equals($calculated, $secureHash);

        $responseCode = (string)($query['vnp_ResponseCode'] ?? '');
        $txnStatus    = (string)($query['vnp_TransactionStatus'] ?? '');

        // Theo docs: 00 là thành công :contentReference[oaicite:5]{index=5}
        $isSuccess = ($responseCode === '00' && $txnStatus === '00');

        return [
            'is_verified'     => $isVerified,
            'is_success'      => $isSuccess,
            'txn_ref'         => $txnRef,
            'response_code'   => $responseCode,
            'transaction_status' => $txnStatus,
        ];
    }
}
