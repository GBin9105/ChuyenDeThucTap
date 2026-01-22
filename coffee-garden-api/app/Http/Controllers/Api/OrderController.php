<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderCreatedMail;
use App\Mail\OrderPaidMail;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderDetail;
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
     */
    public function index()
    {
        $userId = (int) Auth::id();

        $orders = Order::query()
            ->where('user_id', $userId)
            ->with($this->orderRelations())
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $orders,
        ]);
    }

    /**
     * GET /api/orders/{id}
     */
    public function show($id)
    {
        $userId = (int) Auth::id();

        $order = Order::query()
            ->where('id', (int) $id)
            ->where('user_id', $userId)
            ->with($this->orderRelations())
            ->firstOrFail();

        return response()->json([
            'status' => true,
            'data'   => $order,
        ]);
    }

    /**
     * POST /api/orders
     * COD only
     */
    public function store(Request $request)
    {
        $userId = (int) Auth::id();
        $user   = $request->user();

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

        if (!Cart::where('user_id', $userId)->exists()) {
            return response()->json([
                'status'  => false,
                'message' => 'Cart is empty',
            ], 422);
        }

        $recipientEmail = $validated['email'] ?? ($user?->email ?? null);
        $relations      = $this->orderRelations();
        $hasInvDeducted = $this->hasInventoryDeductedAtColumn();

        try {
            $order = DB::transaction(function () use ($userId, $validated, $recipientEmail, $relations, $hasInvDeducted) {
                $cartRows = Cart::where('user_id', $userId)
                    ->lockForUpdate()
                    ->orderBy('id')
                    ->get();

                if ($cartRows->isEmpty()) {
                    throw new \RuntimeException('Cart is empty');
                }

                $subtotal    = 0.0;
                $extrasTotal = 0.0;
                $grandTotal  = 0.0;

                $detailsPayload = [];
                $cartIds        = [];

                // để quyết định encode JSON theo casts của OrderDetail model
                $detailModel = new OrderDetail();

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

                    // stock check (không trừ kho ở đây)
                    $inventoryStock = null;
                    if (Schema::hasTable('product_inventories')) {
                        $inv = DB::table('product_inventories')
                            ->where('product_id', (int) $product->id)
                            ->lockForUpdate()
                            ->first();
                        if ($inv) $inventoryStock = (int) ($inv->stock ?? 0);
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

                    $unit      = (float) ($row->unit_price ?? 0);
                    $extras    = (float) ($row->extras_total ?? 0);
                    $lineTotal = (float) ($row->line_total ?? ($qty * ($unit + $extras)));

                    $subtotal    += $qty * $unit;
                    $extrasTotal += $qty * $extras;
                    $grandTotal  += $lineTotal;

                    $thumb = null;
                    if ($product?->galleryMainImage?->image) $thumb = $product->galleryMainImage->image;
                    if (!$thumb && isset($product->thumbnail)) $thumb = $product->thumbnail;

                    // JSON fields: encode theo casts của OrderDetail (tránh 500 do Array->string)
                    $attributeValueIds = $this->asArray($row->attribute_value_ids);
                    $options           = $this->asArray($row->options);
                    $toppings          = $this->asArray($row->toppings);
                    $attributeValues   = $this->asArray($row->attribute_values);

                    $detailsPayload[] = [
                        'product_id'        => (int) $product->id,
                        'product_name'      => (string) ($product->name ?? ''),
                        'product_slug'      => (string) ($product->slug ?? ''),
                        'product_thumbnail' => $thumb,

                        'size_id'          => null,
                        'size_name'        => $row->size_name ?? null,
                        'size_price_extra' => (string) ($row->size_price_extra ?? '0.00'),

                        'attribute_value_ids' => $this->jsonValueFor($detailModel, 'attribute_value_ids', $attributeValueIds),

                        'qty' => $qty,

                        'options'          => $this->jsonValueFor($detailModel, 'options', $options),
                        'toppings'         => $this->jsonValueFor($detailModel, 'toppings', $toppings),
                        'attribute_values' => $this->jsonValueFor($detailModel, 'attribute_values', $attributeValues),

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
                $order->user_id     = $userId;
                $order->order_code  = $this->generateOrderCode();

                $order->name    = $validated['name'];
                $order->phone   = $validated['phone'];
                $order->email   = $recipientEmail;
                $order->address = $validated['address'] ?? null;
                $order->note    = $validated['note'] ?? null;

                $order->payment_method = 'cod';
                $order->payment_status = Order::PAYMENT_PENDING;
                $order->status         = Order::STATUS_PENDING;

                $order->subtotal    = $this->money2($subtotal);
                $order->extras_total = $this->money2($extrasTotal);
                $order->total_price = $this->money2($grandTotal);

                $order->paid_at   = null;
                $order->vnp_TxnRef = null;

                // ✅ tránh 500 nếu DB chưa có cột
                if ($hasInvDeducted) {
                    $order->inventory_deducted_at = null;
                }

                $order->save();

                foreach ($detailsPayload as $payload) {
                    $order->items()->create($payload);
                }

                Cart::where('user_id', $userId)->whereIn('id', $cartIds)->delete();

                // ✅ mail không được làm vỡ request
                if (!empty($recipientEmail)) {
                    $email   = (string) $recipientEmail;
                    $orderId = (int) $order->id;

                    DB::afterCommit(function () use ($email, $orderId, $relations) {
                        try {
                            $freshOrder = Order::with($relations)->find($orderId);
                            if ($freshOrder) {
                                Mail::to($email)->send(new OrderCreatedMail($freshOrder));
                            }
                        } catch (\Throwable $e) {
                            // swallow mail errors
                        }
                    });
                }

                return $order->load($relations);
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
            // ✅ local thì trả message để debug không cần log
            if (app()->environment('local')) {
                return response()->json([
                    'status'  => false,
                    'message' => $e->getMessage(),
                    'file'    => $e->getFile(),
                    'line'    => $e->getLine(),
                ], 500);
            }

            return response()->json([
                'status'  => false,
                'message' => 'Server error',
            ], 500);
        }
    }

    /**
     * PATCH /api/orders/{id}/received
     * COD: user xác nhận đã nhận -> trừ kho + set paid + gửi mail
     */
    public function markReceived(Request $request, $id)
    {
        $userId        = (int) Auth::id();
        $relations     = $this->orderRelations();
        $hasInvDeducted = $this->hasInventoryDeductedAtColumn();

        try {
            $order = DB::transaction(function () use ($id, $userId, $relations, $hasInvDeducted) {
                $order = Order::query()
                    ->where('id', (int) $id)
                    ->where('user_id', $userId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((string) $order->payment_method !== 'cod') {
                    throw new \RuntimeException('Đơn này không phải COD.');
                }

                if ((int) $order->status === Order::STATUS_CANCELED) {
                    throw new \RuntimeException('Đơn đã bị hủy.');
                }

                // idempotent
                if ($order->payment_status === Order::PAYMENT_SUCCESS && (int) $order->status === Order::STATUS_PAID) {
                    return $order->load($relations);
                }

                if ((int) $order->status !== Order::STATUS_PENDING) {
                    throw new \RuntimeException('Chỉ đơn Pending mới có thể xác nhận đã nhận.');
                }

                // ✅ trừ kho 1 lần
                $this->deductInventoryOnce($order, $hasInvDeducted);

                $order->payment_status = Order::PAYMENT_SUCCESS;
                $order->status         = Order::STATUS_PAID;
                $order->paid_at        = now();
                $order->save();

                return $order->load($relations);
            });

            // ✅ gửi mail sau commit, và không được làm vỡ response
            if (!empty($order->email)) {
                $email   = (string) $order->email;
                $orderId = (int) $order->id;

                DB::afterCommit(function () use ($email, $orderId, $relations) {
                    try {
                        $freshOrder = Order::with($relations)->find($orderId);
                        if ($freshOrder) {
                            Mail::to($email)->send(new OrderPaidMail($freshOrder));
                        }
                    } catch (\Throwable $e) {
                        // swallow mail errors
                    }
                });
            }

            return response()->json([
                'status'  => true,
                'message' => 'Xác nhận đã nhận hàng thành công.',
                'data'    => $order,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * PATCH /api/orders/{id}/cancel
     * COD: user hủy khi pending và chưa trừ kho
     */
    public function cancel(Request $request, $id)
    {
        $userId = (int) Auth::id();
        $hasInvDeducted = $this->hasInventoryDeductedAtColumn();

        try {
            $order = DB::transaction(function () use ($id, $userId, $hasInvDeducted) {
                $order = Order::query()
                    ->where('id', (int) $id)
                    ->where('user_id', $userId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((string) $order->payment_method !== 'cod') {
                    throw new \RuntimeException('Chỉ đơn COD mới cho phép hủy ở client.');
                }

                if ((int) $order->status === Order::STATUS_CANCELED) {
                    return $order; // idempotent
                }

                if ((int) $order->status !== Order::STATUS_PENDING) {
                    throw new \RuntimeException('Chỉ đơn Pending mới có thể hủy.');
                }

                // ✅ chỉ check khi DB có cột, tránh hiểu nhầm
                if ($hasInvDeducted && !empty($order->inventory_deducted_at)) {
                    throw new \RuntimeException('Đơn đã được xử lý kho, không thể hủy.');
                }

                $order->status         = Order::STATUS_CANCELED;
                $order->payment_status = Order::PAYMENT_FAILED;
                $order->save();

                return $order;
            });

            return response()->json([
                'status'  => true,
                'message' => 'Hủy đơn thành công.',
                'data'    => $order,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Trừ kho 1 lần duy nhất
     */
    private function deductInventoryOnce(Order $order, bool $hasInvDeductedAt): void
    {
        // nếu có cột thì dùng chống double
        if ($hasInvDeductedAt && !empty($order->inventory_deducted_at)) {
            return;
        }

        $rows = OrderDetail::query()
            ->select('product_id', DB::raw('SUM(qty) as qty_sum'))
            ->where('order_id', (int) $order->id)
            ->whereNotNull('product_id')
            ->groupBy('product_id')
            ->get();

        if ($rows->isEmpty()) {
            throw new \RuntimeException('Order has no items.');
        }

        foreach ($rows as $r) {
            $productId = (int) $r->product_id;
            $need      = (int) $r->qty_sum;
            if ($need <= 0) continue;

            if (Schema::hasTable('product_inventories')) {
                $inv = DB::table('product_inventories')
                    ->where('product_id', $productId)
                    ->lockForUpdate()
                    ->first();

                if (!$inv) {
                    throw new \RuntimeException("Inventory not found for product_id={$productId}");
                }

                $before = (int) ($inv->stock ?? 0);
                if ($before < $need) {
                    throw new \RuntimeException("Not enough stock (product_id={$productId})");
                }

                DB::table('product_inventories')
                    ->where('product_id', $productId)
                    ->update(['stock' => $before - $need]);

                continue;
            }

            if (Schema::hasColumn('products', 'stock')) {
                $p = DB::table('products')->where('id', $productId)->lockForUpdate()->first();
                if (!$p) throw new \RuntimeException("Product not found for id={$productId}");

                $before = (int) ($p->stock ?? 0);
                if ($before < $need) {
                    throw new \RuntimeException("Not enough stock (product_id={$productId})");
                }

                DB::table('products')->where('id', $productId)->update(['stock' => $before - $need]);
                continue;
            }

            throw new \RuntimeException('No inventory place to deduct stock.');
        }

        // ✅ chỉ set khi DB có cột
        if ($hasInvDeductedAt) {
            $order->inventory_deducted_at = now();
            $order->save();
        }
    }

    private function orderRelations(): array
    {
        // luôn load items (snapshot đủ để FE hiển thị)
        $rels = ['items'];

        // chỉ load nested nếu OrderDetail có method relation
        if (method_exists(OrderDetail::class, 'product')) {
            $rels[] = 'items.product';
        }
        if (method_exists(OrderDetail::class, 'size')) {
            $rels[] = 'items.size';
        }

        return $rels;
    }

    private function hasInventoryDeductedAtColumn(): bool
    {
        try {
            return Schema::hasColumn('orders', 'inventory_deducted_at');
        } catch (\Throwable $e) {
            return false;
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

    /**
     * Trả về đúng kiểu cho field JSON:
     * - Nếu OrderDetail casts field là array/json => trả array
     * - Nếu không có cast => encode JSON string để tránh 500 Array->string
     */
    private function jsonValueFor(OrderDetail $model, string $field, $value)
    {
        if ($value === null) return null;

        $casts = $model->getCasts();
        $cast  = $casts[$field] ?? null;

        $jsonCasts = ['array', 'json', 'object', 'collection'];

        if (is_string($cast)) {
            // encrypted:array / encrypted:collection / ...
            $plain = strtolower($cast);
            if (str_starts_with($plain, 'encrypted:')) {
                $plain = str_replace('encrypted:', '', $plain);
            }
            if (in_array($plain, $jsonCasts, true)) {
                return $value; // giữ array cho Eloquent tự encode
            }
        }

        // không có cast => tự encode nếu là array/object
        if (is_array($value) || is_object($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        return $value;
    }
}
