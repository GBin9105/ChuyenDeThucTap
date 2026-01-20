<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderCreatedMail;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * GET /api/orders
     * List orders of current user
     */
    public function index()
    {
        $userId = (int) Auth::id();

        $orders = Order::query()
            ->where('user_id', $userId)
            ->with(['items.product', 'items.size'])
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $orders,
        ]);
    }

    /**
     * GET /api/orders/{id}
     * Show an order of current user
     */
    public function show($id)
    {
        $userId = (int) Auth::id();

        $order = Order::query()
            ->where('id', (int) $id)
            ->where('user_id', $userId)
            ->with(['items.product', 'items.size'])
            ->firstOrFail();

        return response()->json([
            'status' => true,
            'data'   => $order,
        ]);
    }

    /**
     * POST /api/orders
     * Checkout COD only
     */
    public function store(Request $request)
    {
        $userId = (int) Auth::id();
        $user = $request->user(); // để fallback email nếu FE không gửi

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'phone'          => ['required', 'string', 'max:50'],
            'email'          => ['nullable', 'email', 'max:255'],
            'address'        => ['nullable', 'string', 'max:255'],
            'note'           => ['nullable', 'string', 'max:2000'],
            'payment_method' => ['required', 'in:vnpay,cod'],
        ]);

        if (($validated['payment_method'] ?? '') === 'vnpay') {
            return response()->json([
                'status'  => false,
                'message' => 'VNPay checkout phải gọi POST /api/payment/vnpay (Order chỉ tạo khi VNPay success).',
            ], 422);
        }

        $hasCart = Cart::where('user_id', $userId)->exists();
        if (!$hasCart) {
            return response()->json([
                'status'  => false,
                'message' => 'Cart is empty',
            ], 422);
        }

        // Email người nhận: ưu tiên email nhập khi checkout, fallback email của user đăng nhập
        $recipientEmail = $validated['email'] ?? ($user?->email ?? null);

        try {
            $order = DB::transaction(function () use ($userId, $validated, $recipientEmail) {

                $cartRows = Cart::where('user_id', $userId)
                    ->lockForUpdate()
                    ->orderBy('id')
                    ->get();

                if ($cartRows->isEmpty()) {
                    throw new \RuntimeException('Cart is empty');
                }

                $subtotal = 0.0;
                $extrasTotal = 0.0;
                $grandTotal = 0.0;

                $detailsPayload = [];
                $cartIds = [];

                foreach ($cartRows as $row) {
                    $cartIds[] = (int) $row->id;

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

                    $inventoryStock = null;
                    if (Schema::hasTable('product_inventories')) {
                        $inv = DB::table('product_inventories')
                            ->where('product_id', (int) $product->id)
                            ->lockForUpdate()
                            ->first();
                        if ($inv) {
                            $inventoryStock = (int) ($inv->stock ?? 0);
                        }
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
                    if ($product?->galleryMainImage?->image) {
                        $thumb = $product->galleryMainImage->image;
                    }
                    if (!$thumb && isset($product->thumbnail)) {
                        $thumb = $product->thumbnail;
                    }

                    $detailsPayload[] = [
                        'product_id'        => (int) $product->id,
                        'product_name'      => (string) ($product->name ?? ''),
                        'product_slug'      => (string) ($product->slug ?? ''),
                        'product_thumbnail' => $thumb,

                        'size_id'           => null,
                        'size_name'         => $row->size_name ?? null,
                        'size_price_extra'  => (string) ($row->size_price_extra ?? '0.00'),

                        'attribute_value_ids' => $this->asArray($row->attribute_value_ids),

                        'qty'              => $qty,
                        'options'          => $this->asArray($row->options),
                        'toppings'         => $this->asArray($row->toppings),
                        'attribute_values' => $this->asArray($row->attribute_values),

                        'line_key' => (string) ($row->line_key ?? ''),

                        'unit_price'   => (string) ($row->unit_price ?? '0.00'),
                        'extras_total' => (string) ($row->extras_total ?? '0.00'),
                        'line_total'   => (string) ($row->line_total ?? $this->money2($lineTotal)),
                    ];
                }

                if ($grandTotal <= 0) {
                    throw new \RuntimeException('Invalid total amount');
                }

                $order = new Order();
                $order->user_id = $userId;
                $order->order_code = $this->generateOrderCode();

                $order->name = $validated['name'];
                $order->phone = $validated['phone'];

                // FIX: lưu email người nhận vào order để dùng gửi mail
                $order->email = $recipientEmail;

                $order->address = $validated['address'] ?? null;
                $order->note = $validated['note'] ?? null;

                $order->payment_method = 'cod';
                $order->payment_status = Order::PAYMENT_PENDING; // pending
                $order->status = Order::STATUS_PENDING;

                $order->subtotal = $this->money2($subtotal);
                $order->extras_total = $this->money2($extrasTotal);
                $order->total_price = $this->money2($grandTotal);

                $order->paid_at = null;
                $order->vnp_TxnRef = null;

                $order->save();

                foreach ($detailsPayload as $payload) {
                    $order->items()->create($payload);
                }

                // Clear cart
                Cart::where('user_id', $userId)->whereIn('id', $cartIds)->delete();

                /**
                 * GỬI MAIL SAU KHI COMMIT (để chắc DB đã lưu xong)
                 */
                if (!empty($recipientEmail)) {
                    $email = (string) $recipientEmail;
                    $orderId = (int) $order->id;

                    DB::afterCommit(function () use ($email, $orderId) {
                        $freshOrder = Order::with(['items.product', 'items.size'])->find($orderId);
                        if ($freshOrder) {
                            Mail::to($email)->send(new OrderCreatedMail($freshOrder));
                        }
                    });
                }

                return $order->load(['items.product', 'items.size']);
            });

            return response()->json([
                'status'  => true,
                'message' => 'COD order created',
                'data'    => $order,
            ], 201);

        } catch (\RuntimeException $e) {
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Server error',
            ], 500);
        }
    }

    private function generateOrderCode(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $code = 'ORD-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
            if (!Order::where('order_code', $code)->exists()) {
                return $code;
            }
        }
        return 'ORD-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(8));
    }

    private function money2($value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function asArray($value): ?array
    {
        if ($value === null) return null;
        if (is_array($value)) return $value;

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : null;
        }

        return null;
    }
}
