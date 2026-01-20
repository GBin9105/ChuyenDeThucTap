<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use App\Services\VNPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderPaidMail;


class VNPayController extends Controller
{
    /**
     * POST /api/payment/vnpay
     * (auth:sanctum)
     *
     * Tạo Order pending (vnpay) + snapshot items từ cart,
     * rồi tạo payment_url VNPay.
     *
     * NOTE: KHÔNG clear cart ở đây. Cart chỉ clear khi VNPay success (IPN/Return).
     */
    public function createPayment(Request $request, VNPayService $vnpay)
    {
        $payload = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],

            // optional
            'order_info' => ['nullable', 'string', 'max:255'],
            'order_type' => ['nullable', 'string', 'max:100'],
            'locale' => ['nullable', 'string', 'max:5'],
            'bank_code' => ['nullable', 'string', 'max:20'],
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            // 1) tạo order pending (vnpay) + snapshot items
            $order = DB::transaction(function () use ($user, $payload) {
                $cartRows = Cart::where('user_id', $user->id)
                    ->lockForUpdate()
                    ->orderBy('id')
                    ->get();

                if ($cartRows->isEmpty()) {
                    throw new \RuntimeException('Giỏ hàng trống.');
                }

                $subtotal = 0.0;
                $extrasTotal = 0.0;
                $grandTotal = 0.0;

                $detailsPayload = [];

                foreach ($cartRows as $row) {
                    $product = Product::with(['inventory', 'galleryMainImage'])
                        ->where('id', (int) $row->product_id)
                        ->lockForUpdate()
                        ->first();

                    if (!$product) {
                        throw new \RuntimeException("Product not found (product_id={$row->product_id})");
                    }
                    if (isset($product->status) && (int) $product->status !== 1) {
                        throw new \RuntimeException("Product not available (product_id={$row->product_id})");
                    }

                    $qty = (int) ($row->qty ?? 1);
                    if ($qty <= 0) {
                        throw new \RuntimeException("Invalid quantity (cart_id={$row->id})");
                    }

                    // Stock check (giữ giống OrderController)
                    $inventoryStock = null;
                    if (Schema::hasTable('product_inventories')) {
                        $inv = DB::table('product_inventories')
                            ->where('product_id', (int) $product->id)
                            ->lockForUpdate()
                            ->first();
                        if ($inv)
                            $inventoryStock = (int) ($inv->stock ?? 0);
                    }

                    $stock = null;
                    if ($inventoryStock !== null) {
                        $stock = $inventoryStock;
                    } elseif ($product->inventory) {
                        $stock = (int) ($product->inventory->stock ?? 0);
                    } elseif (Schema::hasColumn('products', 'stock')) {
                        $stock = (int) ($product->stock ?? 0);
                    }

                    if ($stock !== null && $qty > $stock) {
                        throw new \RuntimeException("Not enough stock: {$product->name}");
                    }

                    $unit = (float) ($row->unit_price ?? 0);
                    $extras = (float) ($row->extras_total ?? 0);
                    $lineTotal = (float) ($row->line_total ?? ($qty * ($unit + $extras)));

                    $subtotal += $qty * $unit;
                    $extrasTotal += $qty * $extras;
                    $grandTotal += $lineTotal;

                    $thumb = null;
                    if ($product?->galleryMainImage?->image)
                        $thumb = $product->galleryMainImage->image;
                    if (!$thumb && isset($product->thumbnail))
                        $thumb = $product->thumbnail;

                    $detailsPayload[] = [
                        'product_id' => (int) $product->id,
                        'product_name' => (string) ($product->name ?? ''),
                        'product_slug' => (string) ($product->slug ?? ''),
                        'product_thumbnail' => $thumb,

                        'size_id' => null,
                        'size_name' => $row->size_name ?? null,
                        'size_price_extra' => (string) ($row->size_price_extra ?? '0.00'),

                        'attribute_value_ids' => $this->asArray($row->attribute_value_ids),

                        'qty' => $qty,
                        'options' => $this->asArray($row->options),
                        'toppings' => $this->asArray($row->toppings),
                        'attribute_values' => $this->asArray($row->attribute_values),

                        'line_key' => (string) ($row->line_key ?? ''),

                        'unit_price' => (string) ($row->unit_price ?? '0.00'),
                        'extras_total' => (string) ($row->extras_total ?? '0.00'),
                        'line_total' => (string) ($row->line_total ?? $this->money2($lineTotal)),
                    ];
                }

                if ($grandTotal <= 0) {
                    throw new \RuntimeException('Số tiền không hợp lệ.');
                }

                $order = new Order();
                $order->user_id = (int) $user->id;
                $order->order_code = $this->generateOrderCode();

                $order->name = $payload['name'] ?? ($user->name ?? '');
                $order->phone = $payload['phone'] ?? ($user->phone ?? '');
                $order->email = $payload['email'] ?? null;
                $order->address = $payload['address'] ?? null;
                $order->note = $payload['note'] ?? null;

                $order->payment_method = 'vnpay';
                $order->payment_status = Order::PAYMENT_PENDING;
                $order->status = Order::STATUS_PENDING;

                $order->subtotal = $this->money2($subtotal);
                $order->extras_total = $this->money2($extrasTotal);
                $order->total_price = $this->money2($grandTotal);

                $order->paid_at = null;
                $order->vnp_TxnRef = null;

                $order->save();

                foreach ($detailsPayload as $p) {
                    $order->items()->create($p);
                }

                return $order->load(['items.product', 'items.size']);
            });

            // 2) tạo payment_url (txn_ref lấy theo order_code để map ổn định)
            $data = [
                'amount' => (float) $order->total_price, // VND
                'txn_ref' => $order->order_code,          // map -> order
                'order_info' => $payload['order_info'] ?? ('Thanh toan ' . $order->order_code),
                'order_type' => $payload['order_type'] ?? config('vnpay.order_type', 'other'),
                'locale' => $payload['locale'] ?? config('vnpay.locale', 'vn'),
                'bank_code' => $payload['bank_code'] ?? null,
            ];

            $result = $vnpay->createPayment($data);

            if (($result['code'] ?? '') !== '00') {
                // tạo order nhưng tạo link fail -> mark failed (để audit)
                $order->payment_status = Order::PAYMENT_FAILED;
                $order->save();

                return response()->json($result, 400);
            }

            // VNPayService normalize txnRef => phải lưu đúng txnRef đã gửi đi
            $order->vnp_TxnRef = (string) ($result['vnp_TxnRef'] ?? $order->vnp_TxnRef);
            $order->save();

            return response()->json([
                'code' => '00',
                'message' => 'success',
                'payment_url' => $result['payment_url'],
                'vnp_TxnRef' => $order->vnp_TxnRef,
                'order_id' => $order->id,
                'order_code' => $order->order_code,
            ], 200);

        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('VNPAY CREATE ERROR', ['err' => $e->getMessage()]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * GET /api/payment/vnpay/return (public)
     * VNPay redirect browser về BE. Ở đây có thể finalize luôn (idempotent),
     * nhưng IPN vẫn là server-to-server nên cũng finalize ở IPN.
     */
    public function paymentReturn(Request $request, VNPayService $vnpay)
    {
        $verify = $vnpay->verify($request->query());

        // finalize (idempotent)
        if ($verify['is_verified'] && $verify['is_success']) {
            $this->finalizeSuccess(
                (string) ($verify['vnp_TxnRef'] ?? ''),
                (string) $request->query('vnp_Amount', ''),
                $request->query()
            );
        } elseif ($verify['is_verified'] && !$verify['is_success']) {
            $this->finalizeFailed(
                (string) ($verify['vnp_TxnRef'] ?? ''),
                $request->query()
            );
        }

        $frontendUrl = config('vnpay.frontend_return_url', 'http://localhost:3000/payment-result');

        $payload = [
            'verified' => $verify['is_verified'] ? '1' : '0',
            'success' => ($verify['is_verified'] && $verify['is_success']) ? '1' : '0',
            'txnRef' => (string) ($verify['vnp_TxnRef'] ?? ''),

            'vnp_ResponseCode' => (string) $request->query('vnp_ResponseCode', ''),
            'vnp_TransactionStatus' => (string) $request->query('vnp_TransactionStatus', ''),
            'vnp_Amount' => (string) $request->query('vnp_Amount', ''),
            'vnp_TransactionNo' => (string) $request->query('vnp_TransactionNo', ''),
            'message' => (!$verify['is_verified'])
                ? 'Invalid signature'
                : (($verify['is_success']) ? 'Payment success' : 'Payment failed'),
        ];

        return redirect()->away(rtrim($frontendUrl, '/') . '?' . http_build_query($payload));
    }

    /**
     * GET /api/payment/vnpay/ipn (public)
     * VNPay gọi server-to-server. Đây là nơi nên finalize chính.
     */
    public function ipn(Request $request, VNPayService $vnpay)
    {
        $verify = $vnpay->verify($request->query());

        if (!$verify['is_verified']) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid Checksum'], 200);
        }

        $txnRef = (string) ($verify['vnp_TxnRef'] ?? '');
        $amount = (string) $request->query('vnp_Amount', '');

        if ($verify['is_success']) {
            $ok = $this->finalizeSuccess($txnRef, $amount, $request->query());

            // luôn trả 00 nếu bạn đã xử lý hoặc đã xử lý trước đó (idempotent)
            return response()->json(['RspCode' => $ok ? '00' : '01', 'Message' => $ok ? 'Confirm Success' : 'Order not found / amount mismatch'], 200);
        }

        // payment failed
        $this->finalizeFailed($txnRef, $request->query());
        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success'], 200);
    }

    /**
     * SUCCESS: update order paid + clear cart theo order->user_id
     * Idempotent: nếu order đã success thì return true.
     */
    private function finalizeSuccess(string $txnRef, string $vnpAmount, array $rawQuery): bool
    {
        if ($txnRef === '')
            return false;

        try {
            return (bool) DB::transaction(function () use ($txnRef, $vnpAmount, $rawQuery) {
                /** @var Order|null $order */
                $order = Order::where('vnp_TxnRef', $txnRef)->lockForUpdate()->first();

                if (!$order) {
                    // fallback: nếu bạn dùng txnRef=order_code và normalize khác, có thể thử match order_code
                    $order = Order::where('order_code', $txnRef)->lockForUpdate()->first();
                }

                if (!$order)
                    return false;

                // đã paid rồi -> idempotent
                if ($order->payment_status === Order::PAYMENT_SUCCESS) {
                    return true;
                }

                // amount check (VNPay amount là VND*100)
                $expected = $this->toVnpAmount($order->total_price);
                $provided = (int) preg_replace('/\D+/', '', (string) $vnpAmount);

                if ($provided > 0 && $expected > 0 && $provided !== $expected) {
                    $order->payment_status = Order::PAYMENT_FAILED;
                    $order->save();
                    return false;
                }

                $order->payment_status = Order::PAYMENT_SUCCESS;
                $order->status = Order::STATUS_PAID;
                $order->paid_at = now();
                $order->save();

                // CLEAR CART Ở ĐÂY (đây là chỗ bạn đang thiếu)
                Cart::where('user_id', (int) $order->user_id)->delete();

                // gửi mail cho khách (chỉ gửi 1 lần, vì finalizeSuccess idempotent)
                if (!empty($order->email)) {
                    $email = $order->email;
                    $orderId = $order->id;

                    DB::afterCommit(function () use ($email, $orderId) {
                        $freshOrder = \App\Models\Order::with(['items.product', 'items.size'])->find($orderId);
                        if ($freshOrder) {
                            Mail::to($email)->send(new OrderPaidMail($freshOrder));
                        }
                    });
                }

                // (optional) ghi log debug
                if (config('vnpay.debug')) {
                    Log::info('VNPAY FINALIZE SUCCESS', [
                        'order_id' => $order->id,
                        'user_id' => $order->user_id,
                        'txnRef' => $txnRef,
                        'expected_vnp_amount' => $expected,
                        'provided_vnp_amount' => $provided,
                        'query' => $rawQuery,
                    ]);
                }

                return true;
            });
        } catch (\Throwable $e) {
            Log::error('VNPAY FINALIZE SUCCESS ERROR', ['err' => $e->getMessage(), 'txnRef' => $txnRef]);
            return false;
        }
    }

    /**
     * FAILED: update order failed (không clear cart).
     */
    private function finalizeFailed(string $txnRef, array $rawQuery): void
    {
        if ($txnRef === '')
            return;

        try {
            DB::transaction(function () use ($txnRef, $rawQuery) {
                $order = Order::where('vnp_TxnRef', $txnRef)->lockForUpdate()->first();
                if (!$order)
                    $order = Order::where('order_code', $txnRef)->lockForUpdate()->first();
                if (!$order)
                    return;

                if ($order->payment_status === Order::PAYMENT_SUCCESS) {
                    // đã success thì không downgrade
                    return;
                }

                $order->payment_status = Order::PAYMENT_FAILED;
                // giữ status pending để user có thể tạo payment mới nếu muốn
                $order->save();

                if (config('vnpay.debug')) {
                    Log::info('VNPAY FINALIZE FAILED', [
                        'order_id' => $order->id,
                        'txnRef' => $txnRef,
                        'query' => $rawQuery,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            Log::error('VNPAY FINALIZE FAILED ERROR', ['err' => $e->getMessage(), 'txnRef' => $txnRef]);
        }
    }

    private function generateOrderCode(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $code = 'ORD-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
            if (!Order::where('order_code', $code)->exists())
                return $code;
        }
        return 'ORD-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(8));
    }

    private function money2($value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function asArray($value): ?array
    {
        if ($value === null)
            return null;
        if (is_array($value))
            return $value;

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : null;
        }

        return null;
    }

    private function toVnpAmount($orderTotalPrice): int
    {
        // orderTotalPrice cast decimal:2 -> thường là string "44000.00"
        $n = (float) $orderTotalPrice;
        return (int) round($n * 100);
    }
}
