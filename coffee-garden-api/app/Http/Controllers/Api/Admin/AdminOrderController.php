<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class AdminOrderController extends Controller
{
    /**
     * Inventory table name theo migrate bạn gửi
     */
    private const INVENTORY_TABLE = 'product_inventories';

    /**
     * GET /api/admin/orders
     */
    public function index(Request $request)
    {
        $perPage = (int)($request->query('per_page', 20));
        $perPage = max(1, min(100, $perPage));

        $q = Order::query()
            ->with(['user', 'items.product', 'items.size'])
            ->latest();

        if ($request->filled('user_id')) {
            $q->where('user_id', (int)$request->query('user_id'));
        }

        if ($request->filled('status')) {
            $q->where('status', (int)$request->query('status'));
        }

        if ($request->filled('payment_status')) {
            $q->where('payment_status', $request->query('payment_status'));
        }

        if ($request->filled('payment_method')) {
            $q->where('payment_method', $request->query('payment_method'));
        }

        if ($request->filled('from')) {
            $q->whereDate('created_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $q->whereDate('created_at', '<=', $request->query('to'));
        }

        if ($request->filled('q')) {
            $keyword = trim((string)$request->query('q'));
            $q->where(function ($sub) use ($keyword) {
                $sub->where('name', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('order_code', 'like', "%{$keyword}%");
            });
        }

        return response()->json([
            'status' => true,
            'data'   => $q->paginate($perPage),
        ]);
    }

    /**
     * GET /api/admin/orders/{id}
     */
    public function show($id)
    {
        $order = Order::with(['user', 'items.product', 'items.size'])
            ->findOrFail($id);

        return response()->json([
            'status' => true,
            'data'   => $order,
        ]);
    }

    /**
     * POST /api/admin/orders
     * Admin tạo order thủ công.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'        => ['nullable', 'integer', 'exists:users,id'],
            'name'           => ['required', 'string', 'max:255'],
            'phone'          => ['required', 'string', 'max:20'],
            'email'          => ['nullable', 'email', 'max:255'],
            'address'        => ['nullable', 'string', 'max:255'],
            'note'           => ['nullable', 'string', 'max:2000'],

            'payment_method' => ['required', Rule::in(['vnpay', 'cod'])],
            'payment_status' => ['required', Rule::in(['pending', 'success', 'failed'])],

            // 1 pending | 2 paid | 3 canceled
            'status'         => ['required', 'integer', Rule::in([1, 2, 3])],

            'items'                          => ['required', 'array', 'min:1'],
            'items.*.product_id'             => ['required', 'integer', 'exists:products,id'],
            'items.*.qty'                    => ['required', 'integer', 'min:1', 'max:999'],

            // legacy sizes (nếu còn)
            'items.*.size_id'                => ['nullable', 'integer', 'exists:sizes,id'],

            // canonical cấu hình (giống cart)
            'items.*.attribute_value_ids'    => ['nullable', 'array'],
            'items.*.attribute_value_ids.*'  => ['integer'],

            'items.*.options'                => ['nullable', 'array'],
            'items.*.toppings'               => ['nullable', 'array'],
            'items.*.attribute_values'       => ['nullable', 'array'],

            'items.*.unit_price'             => ['nullable', 'numeric', 'min:0'],
        ]);

        // Đồng bộ business status khi đã paid
        if ((string)$validated['payment_status'] === 'success') {
            $validated['status'] = 2;
        }

        $order = DB::transaction(function () use ($validated) {

            $itemsPayload = [];

            $subtotal = 0.0;
            $extrasTotal = 0.0;
            $grandTotal = 0.0;

            foreach ($validated['items'] as $i) {
                /** @var Product $product */
                $product = Product::with(['inventory'])
                    ->where('id', (int)$i['product_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int)($product->status ?? 1) !== 1) {
                    throw new \RuntimeException("Product not available: {$product->id}");
                }

                $qty = (int)$i['qty'];

                // chặn vượt kho (nếu hệ thống có kho)
                $availableStock = $this->getProductStock($product, true); // ?int
                if ($availableStock !== null && $qty > $availableStock) {
                    throw new \RuntimeException("Not enough stock: {$product->name}");
                }

                // unit_price: ưu tiên admin override, không thì lấy giá hiệu lực
                $unitPrice = (array_key_exists('unit_price', $i) && $i['unit_price'] !== null)
                    ? (float)$i['unit_price']
                    : (float)$this->effectiveProductPrice($product);

                if ($unitPrice < 0) {
                    throw new \RuntimeException("Invalid unit price for product_id={$product->id}");
                }

                // size extra (legacy sizes)
                $sizeExtra = 0.0;
                $sizeName = null;
                $sizeId = !empty($i['size_id']) ? (int)$i['size_id'] : null;

                if ($sizeId) {
                    $size = Size::find($sizeId);
                    if ($size) {
                        $sizeExtra = (float)($size->price_extra ?? $size->price ?? 0);
                        $sizeName = (string)($size->name ?? null);
                    }
                }

                $toppings = $i['toppings'] ?? null;
                $attributeValues = $i['attribute_values'] ?? null;

                $extras = $sizeExtra
                    + $this->sumPriceExtra($toppings)
                    + $this->sumPriceExtra($attributeValues);

                $lineTotal = $qty * ($unitPrice + $extras);

                $subtotal += $qty * $unitPrice;
                $extrasTotal += $qty * $extras;
                $grandTotal += $lineTotal;

                $productName  = (string)($product->name ?? '');
                $productSlug  = (string)($product->slug ?? '');
                $productThumb = $product->thumbnail ?? null;

                $attributeValueIds = $i['attribute_value_ids'] ?? null;

                $lineKey = $this->makeLineKey([
                    'product_id' => (int)$product->id,
                    'options' => $i['options'] ?? null,
                    'attribute_value_ids' => $attributeValueIds ? array_values($attributeValueIds) : null,
                ]);

                $itemsPayload[] = [
                    'product_id'          => (int)$product->id,
                    'product_name'        => $productName,
                    'product_slug'        => $productSlug ?: null,
                    'product_thumbnail'   => $productThumb,

                    'size_id'             => $sizeId,
                    'size_name'           => $sizeName,
                    'size_price_extra'    => $this->money2($sizeExtra),

                    'qty'                 => $qty,

                    'options'             => $i['options'] ?? null,
                    'toppings'            => $toppings,
                    'attribute_values'    => $attributeValues,

                    'attribute_value_ids' => $attributeValueIds ? array_values($attributeValueIds) : null,

                    'line_key'            => $lineKey,

                    'unit_price'          => $this->money2($unitPrice),
                    'extras_total'        => $this->money2($extras),
                    'line_total'          => $this->money2($lineTotal),
                ];
            }

            $orderCode = $this->generateOrderCode();

            /** @var Order $order */
            $order = Order::create([
                'user_id'        => $validated['user_id'] ?? null,
                'order_code'     => $orderCode,

                'name'           => $validated['name'],
                'phone'          => $validated['phone'],
                'email'          => $validated['email'] ?? null,
                'address'        => $validated['address'] ?? null,
                'note'           => $validated['note'] ?? null,

                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'],
                'status'         => (int)$validated['status'],

                'subtotal'       => $this->money2($subtotal),
                'extras_total'   => $this->money2($extrasTotal),
                'total_price'    => $this->money2($grandTotal),

                'paid_at'        => ((string)$validated['payment_status'] === 'success') ? now() : null,
            ]);

            foreach ($itemsPayload as $payload) {
                $order->items()->create($payload);
            }

            // Nếu order đã success ngay khi tạo => trừ kho ngay
            if ((string)$order->payment_status === 'success') {
                $this->reduceStockForOrderLocked($order->id);
                $this->setPaidAtIfExists($order->id);
            }

            return $order->load(['items.product', 'items.size', 'user']);
        });

        return response()->json([
            'status'  => true,
            'message' => 'Created',
            'data'    => $order,
        ], 201);
    }

    /**
     * PATCH /api/admin/orders/{id}
     * Transition: not-success -> success => reduce stock
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'           => ['nullable', 'string', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:20'],
            'email'          => ['nullable', 'email', 'max:255'],
            'address'        => ['nullable', 'string', 'max:255'],
            'note'           => ['nullable', 'string', 'max:2000'],

            'payment_method' => ['nullable', Rule::in(['vnpay', 'cod'])],
            'payment_status' => ['nullable', Rule::in(['pending', 'success', 'failed'])],
            'status'         => ['nullable', 'integer', Rule::in([1, 2, 3])],
        ]);

        // Chặn downgrade payment_status success -> pending/failed để tránh trừ kho lặp khi đổi qua lại.
        // Nếu bạn muốn hỗ trợ hoàn kho, cần implement cơ chế restock riêng.
        $current = Order::findOrFail($id);
        if ((string)$current->payment_status === 'success'
            && array_key_exists('payment_status', $validated)
            && (string)$validated['payment_status'] !== 'success'
        ) {
            return response()->json([
                'status'  => false,
                'message' => 'Cannot change payment_status from success to non-success (no restock logic implemented).',
            ], 422);
        }

        $order = DB::transaction(function () use ($id, $validated) {
            /** @var Order $order */
            $order = Order::with('items')->where('id', $id)->lockForUpdate()->firstOrFail();

            $oldPaymentStatus = (string)$order->payment_status;

            foreach (['name','phone','email','address','note','payment_method','payment_status','status'] as $f) {
                if (array_key_exists($f, $validated)) {
                    $order->{$f} = $validated[$f];
                }
            }

            // Nếu chuyển success => set paid_at + đồng bộ status=2
            if ($oldPaymentStatus !== 'success'
                && array_key_exists('payment_status', $validated)
                && (string)$validated['payment_status'] === 'success'
            ) {
                $order->paid_at = now();
                $order->status = 2;
            }

            $order->save();

            // Transition: not-success -> success => reduce stock
            if ($oldPaymentStatus !== 'success' && (string)$order->payment_status === 'success') {
                $this->reduceStockForOrderLocked($order->id);
                $this->setPaidAtIfExists($order->id);
            }

            return $order->load(['items.product', 'items.size', 'user']);
        });

        return response()->json([
            'status'  => true,
            'message' => 'Updated',
            'data'    => $order,
        ]);
    }

    /**
     * DELETE /api/admin/orders/{id}
     */
    public function destroy($id)
    {
        $order = Order::findOrFail($id);

        if ((string)$order->payment_status === 'success') {
            return response()->json([
                'status'  => false,
                'message' => 'Cannot delete a paid order',
            ], 422);
        }

        $order->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Deleted',
        ]);
    }

    /**
     * =========================
     * Helpers
     * =========================
     */

    private function generateOrderCode(): string
    {
        $date = now()->format('Ymd');
        for ($i = 0; $i < 5; $i++) {
            $code = 'OD' . $date . '-' . Str::upper(Str::random(8));
            if (!Order::where('order_code', $code)->exists()) {
                return $code;
            }
        }
        return 'OD' . $date . '-' . Str::upper(Str::random(12));
    }

    private function reduceStockForOrderLocked(int $orderId): void
    {
        /** @var Order $order */
        $order = Order::with('items')->where('id', $orderId)->lockForUpdate()->firstOrFail();

        foreach ($order->items as $item) {
            if (!$item->product_id) continue;

            /** @var Product|null $product */
            $product = Product::with('inventory')
                ->where('id', $item->product_id)
                ->lockForUpdate()
                ->first();

            if (!$product) continue;

            $qty = (int)$item->qty;

            // ưu tiên product_inventories
            if (Schema::hasTable(self::INVENTORY_TABLE)) {
                $inv = DB::table(self::INVENTORY_TABLE)
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->first();

                if ($inv) {
                    $stock = (int)($inv->stock ?? 0);

                    if ($stock < $qty) {
                        $this->appendNoteIfExists($order->id, "[StockError] Not enough stock product_id={$product->id}");
                        continue;
                    }

                    $update = ['stock' => $stock - $qty];
                    if (Schema::hasColumn(self::INVENTORY_TABLE, 'updated_at')) {
                        $update['updated_at'] = now();
                    }

                    DB::table(self::INVENTORY_TABLE)
                        ->where('product_id', $product->id)
                        ->update($update);

                    continue;
                }
            }

            // fallback: products.stock (nếu bạn vẫn dùng cột này)
            if (Schema::hasColumn('products', 'stock')) {
                $stock = (int)($product->stock ?? 0);

                if ($stock < $qty) {
                    $this->appendNoteIfExists($order->id, "[StockError] Not enough stock product_id={$product->id}");
                    continue;
                }

                $product->stock = $stock - $qty;
                $product->save();
            }
        }
    }

    /**
     * Trả về:
     * - int: nếu có kho (product_inventories hoặc products.stock)
     * - null: nếu không có kho
     */
    private function getProductStock(Product $product, bool $lockForUpdate = false): ?int
    {
        // ưu tiên product_inventories
        if (Schema::hasTable(self::INVENTORY_TABLE)) {
            $q = DB::table(self::INVENTORY_TABLE)->where('product_id', $product->id);
            if ($lockForUpdate) $q->lockForUpdate();

            $inv = $q->first();
            if ($inv) return max(0, (int)($inv->stock ?? 0));
        }

        // fallback: products.stock
        if (Schema::hasColumn('products', 'stock')) {
            return max(0, (int)($product->stock ?? 0));
        }

        return null;
    }

    private function appendNoteIfExists(int $orderId, string $line): void
    {
        if (!Schema::hasColumn('orders', 'note')) return;

        $order = Order::find($orderId);
        if (!$order) return;

        $order->note = trim(((string)($order->note ?? '')) . "\n" . $line);
        $order->save();
    }

    private function setPaidAtIfExists(int $orderId): void
    {
        if (!Schema::hasColumn('orders', 'paid_at')) return;

        Order::where('id', $orderId)->update([
            'paid_at' => now(),
        ]);
    }

    private function sumPriceExtra($arr): float
    {
        if (!is_array($arr)) return 0.0;

        $sum = 0.0;
        foreach ($arr as $item) {
            if (!is_array($item)) continue;
            $price = (float)($item['price_extra'] ?? 0);
            $qty   = (int)($item['qty'] ?? 1);
            $sum  += $price * $qty;
        }
        return $sum;
    }

    private function effectiveProductPrice(Product $product): float
    {
        if (isset($product->final_price) && (float)$product->final_price > 0) {
            return (float)$product->final_price;
        }

        if (isset($product->price_base)) {
            return (float)$product->price_base;
        }

        if (isset($product->price_sale) && (float)$product->price_sale > 0) {
            return (float)$product->price_sale;
        }

        return 0.0;
    }

    private function money2($value): string
    {
        return number_format((float)$value, 2, '.', '');
    }

    private function makeLineKey(array $data): string
    {
        $normalized = $this->normalize($data);
        return hash('sha256', json_encode($normalized, JSON_UNESCAPED_UNICODE));
    }

    private function normalize($value)
    {
        if (is_array($value)) {
            if ($this->isAssoc($value)) {
                ksort($value);
                foreach ($value as $k => $v) {
                    $value[$k] = $this->normalize($v);
                }
                return $value;
            }

            $value = array_map([$this, 'normalize'], $value);
            usort($value, function ($a, $b) {
                return strcmp(json_encode($a), json_encode($b));
            });
            return $value;
        }

        return $value;
    }

    private function isAssoc(array $arr): bool
    {
        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}
