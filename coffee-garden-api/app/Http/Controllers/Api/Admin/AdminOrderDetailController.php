<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminOrderDetailController extends Controller
{
    /**
     * Inventory table theo migrate bạn gửi
     */
    private const INVENTORY_TABLE = 'product_inventories';

    /**
     * GET /api/admin/orders/{orderId}/items
     */
    public function index($orderId)
    {
        $order = Order::with(['items.product', 'items.size'])->findOrFail($orderId);

        return response()->json([
            'status' => true,
            'data' => [
                'order' => $order,
                'items' => $order->items,
            ],
        ]);
    }

    /**
     * GET /api/admin/orders/{orderId}/items/{id}
     */
    public function show($orderId, $id)
    {
        $order = Order::findOrFail($orderId);

        $item = OrderDetail::where('order_id', $order->id)
            ->where('id', $id)
            ->with(['product', 'size'])
            ->firstOrFail();

        return response()->json([
            'status' => true,
            'data'   => $item,
        ]);
    }

    /**
     * POST /api/admin/orders/{orderId}/items
     */
    public function store(Request $request, $orderId)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'qty'        => ['required', 'integer', 'min:1', 'max:999'],

            'size_id'    => ['nullable', 'integer', 'exists:sizes,id'],

            'attribute_value_ids'   => ['nullable', 'array'],
            'attribute_value_ids.*' => ['integer'],

            'unit_price' => ['nullable', 'numeric', 'min:0'],

            'toppings'         => ['nullable', 'array'],
            'options'          => ['nullable', 'array'],
            'attribute_values' => ['nullable', 'array'],
        ]);

        $item = DB::transaction(function () use ($orderId, $validated) {
            /** @var Order $order */
            $order = Order::where('id', (int)$orderId)->lockForUpdate()->firstOrFail();

            /** @var Product $product */
            $product = Product::with('inventory')
                ->where('id', (int)$validated['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (isset($product->status) && (int)$product->status !== 1) {
                throw new \RuntimeException("Product not available: {$product->id}");
            }

            $qty = (int)$validated['qty'];

            // Check stock trước khi tạo (nếu có hệ thống kho)
            $this->assertStockEnoughLocked($product->id, $qty);

            $unitPrice = (array_key_exists('unit_price', $validated) && $validated['unit_price'] !== null)
                ? (float)$validated['unit_price']
                : (float)$this->effectiveProductPrice($product);

            // size legacy
            $sizeExtra = 0.0;
            $sizeName  = null;
            $sizeId    = !empty($validated['size_id']) ? (int)$validated['size_id'] : null;

            if ($sizeId) {
                $size = Size::find($sizeId);
                if ($size) {
                    $sizeExtra = (float)($size->price_extra ?? $size->price ?? 0);
                    $sizeName  = (string)($size->name ?? null);
                }
            }

            $toppings         = $validated['toppings'] ?? null;
            $attributeValues  = $validated['attribute_values'] ?? null;
            $attributeValueIds = !empty($validated['attribute_value_ids'])
                ? array_values($validated['attribute_value_ids'])
                : null;

            $extras = $sizeExtra
                + $this->sumPriceExtra($toppings)
                + $this->sumPriceExtra($attributeValues);

            $lineTotal = $qty * ($unitPrice + $extras);

            // line_key giống cart/admin order
            $lineKey = $this->makeLineKey([
                'product_id' => (int)$product->id,
                'options' => $validated['options'] ?? null,
                'attribute_value_ids' => $attributeValueIds,
            ]);

            $data = [
                'order_id'   => $order->id,
                'product_id' => $product->id,

                'product_name'      => (string)($product->name ?? ''),
                'product_slug'      => !empty($product->slug) ? (string)$product->slug : null,
                'product_thumbnail' => $product->thumbnail ?? null,

                'size_id'          => $sizeId,
                'size_name'        => $sizeName,
                'size_price_extra' => $this->money2($sizeExtra),

                'attribute_value_ids' => $attributeValueIds,

                'qty' => $qty,

                'options'          => $validated['options'] ?? null,
                'toppings'         => $toppings,
                'attribute_values' => $attributeValues,

                'line_key' => $lineKey,

                'unit_price'   => $this->money2($unitPrice),
                'extras_total' => $this->money2($extras),
                'line_total'   => $this->money2($lineTotal),
            ];

            /** @var OrderDetail $created */
            $created = OrderDetail::create($data);

            // Nếu order đã paid => trừ kho ngay khi add item
            if ((string)$order->payment_status === 'success') {
                $this->adjustStockLocked($product->id, -$qty);
            }

            $this->recalcOrderTotalsLocked($order->id);

            return $created->load(['product', 'size']);
        });

        return response()->json([
            'status'  => true,
            'message' => 'Created',
            'data'    => $item,
        ], 201);
    }

    /**
     * PATCH/PUT /api/admin/orders/{orderId}/items/{id}
     */
    public function update(Request $request, $orderId, $id)
    {
        $validated = $request->validate([
            'size_id'    => ['nullable', 'integer', 'exists:sizes,id'],
            'qty'        => ['nullable', 'integer', 'min:1', 'max:999'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],

            'attribute_value_ids'   => ['nullable', 'array'],
            'attribute_value_ids.*' => ['integer'],

            'toppings'         => ['nullable', 'array'],
            'options'          => ['nullable', 'array'],
            'attribute_values' => ['nullable', 'array'],
        ]);

        $item = DB::transaction(function () use ($orderId, $id, $validated) {
            /** @var Order $order */
            $order = Order::where('id', (int)$orderId)->lockForUpdate()->firstOrFail();

            /** @var OrderDetail $item */
            $item = OrderDetail::where('order_id', $order->id)
                ->where('id', (int)$id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldQty = (int)$item->qty;

            // update size
            if (array_key_exists('size_id', $validated)) {
                $sizeId = $validated['size_id'] !== null ? (int)$validated['size_id'] : null;
                $item->size_id = $sizeId;

                $sizeExtra = 0.0;
                $sizeName  = null;

                if ($sizeId) {
                    $size = Size::find($sizeId);
                    if ($size) {
                        $sizeExtra = (float)($size->price_extra ?? $size->price ?? 0);
                        $sizeName  = (string)($size->name ?? null);
                    }
                }

                $item->size_name = $sizeName;
                $item->size_price_extra = $this->money2($sizeExtra);
            }

            // update qty
            if (array_key_exists('qty', $validated) && $validated['qty'] !== null) {
                $item->qty = (int)$validated['qty'];
            }

            // update unit_price
            if (array_key_exists('unit_price', $validated) && $validated['unit_price'] !== null) {
                $item->unit_price = $this->money2((float)$validated['unit_price']);
            }

            // update config snapshots
            if (array_key_exists('toppings', $validated)) {
                $item->toppings = $validated['toppings'];
            }
            if (array_key_exists('options', $validated)) {
                $item->options = $validated['options'];
            }
            if (array_key_exists('attribute_values', $validated)) {
                $item->attribute_values = $validated['attribute_values'];
            }
            if (array_key_exists('attribute_value_ids', $validated)) {
                $item->attribute_value_ids = $validated['attribute_value_ids']
                    ? array_values($validated['attribute_value_ids'])
                    : null;
            }

            // Nếu order đã paid => xử lý kho theo delta qty
            $newQty = (int)$item->qty;
            $delta  = $newQty - $oldQty;

            if ((string)$order->payment_status === 'success' && $delta !== 0) {
                if ((int)$item->product_id > 0) {
                    if ($delta > 0) {
                        $this->assertStockEnoughLocked((int)$item->product_id, $delta);
                        $this->adjustStockLocked((int)$item->product_id, -$delta);
                    } else {
                        // delta < 0 => hoàn kho
                        $this->adjustStockLocked((int)$item->product_id, abs($delta));
                    }
                }
            }

            // recompute extras_total + line_total
            $sizeExtra = (float)($item->size_price_extra ?? 0);
            $extras = $sizeExtra
                + $this->sumPriceExtra($item->toppings)
                + $this->sumPriceExtra($item->attribute_values);

            $qty       = (int)$item->qty;
            $unitPrice = (float)$item->unit_price;

            $item->extras_total = $this->money2($extras);
            $item->line_total   = $this->money2($qty * ($unitPrice + $extras));

            // refresh line_key nếu options / attribute_value_ids bị thay đổi
            // (size_id không nằm trong line_key vì size hiện được encode trong attribute_value_ids)
            $item->line_key = $this->makeLineKey([
                'product_id' => (int)($item->product_id ?? 0),
                'options' => $item->options,
                'attribute_value_ids' => $item->attribute_value_ids,
            ]);

            $item->save();

            $this->recalcOrderTotalsLocked($order->id);

            return $item->load(['product', 'size']);
        });

        return response()->json([
            'status'  => true,
            'message' => 'Updated',
            'data'    => $item,
        ]);
    }

    /**
     * DELETE /api/admin/orders/{orderId}/items/{id}
     */
    public function destroy($orderId, $id)
    {
        DB::transaction(function () use ($orderId, $id) {
            /** @var Order $order */
            $order = Order::where('id', (int)$orderId)->lockForUpdate()->firstOrFail();

            /** @var OrderDetail $item */
            $item = OrderDetail::where('order_id', $order->id)
                ->where('id', (int)$id)
                ->lockForUpdate()
                ->firstOrFail();

            $qty = (int)$item->qty;
            $pid = (int)$item->product_id;

            $item->delete();

            // Nếu order đã paid => hoàn kho khi xóa item
            if ((string)$order->payment_status === 'success' && $pid > 0 && $qty > 0) {
                $this->adjustStockLocked($pid, $qty);
            }

            $this->recalcOrderTotalsLocked($order->id);
        });

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

    private function recalcOrderTotalsLocked(int $orderId): void
    {
        $subtotal = (float)OrderDetail::where('order_id', $orderId)
            ->selectRaw('COALESCE(SUM(qty * unit_price),0) as s')
            ->value('s');

        $extrasTotal = (float)OrderDetail::where('order_id', $orderId)
            ->selectRaw('COALESCE(SUM(qty * extras_total),0) as s')
            ->value('s');

        $grand = (float)OrderDetail::where('order_id', $orderId)
            ->selectRaw('COALESCE(SUM(line_total),0) as s')
            ->value('s');

        Order::where('id', $orderId)->update([
            'subtotal'     => $this->money2($subtotal),
            'extras_total' => $this->money2($extrasTotal),
            'total_price'  => $this->money2($grand),
        ]);
    }

    private function sumPriceExtra($arr): float
    {
        if (is_string($arr)) {
            $arr = json_decode($arr, true);
        }
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

    /**
     * Nếu hệ thống có kho (product_inventories hoặc products.stock) thì enforce.
     * Nếu không có kho => không chặn.
     */
    private function assertStockEnoughLocked(int $productId, int $needQty): void
    {
        if ($needQty <= 0) return;

        // ưu tiên product_inventories
        if (Schema::hasTable(self::INVENTORY_TABLE)) {
            $inv = DB::table(self::INVENTORY_TABLE)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($inv) {
                $stock = (int)($inv->stock ?? 0);
                if ($stock < $needQty) {
                    throw new \RuntimeException("Not enough stock (" . self::INVENTORY_TABLE . ") product_id={$productId}");
                }
                return;
            }
        }

        // fallback products.stock
        if (Schema::hasColumn('products', 'stock')) {
            $p = Product::where('id', $productId)->lockForUpdate()->first();
            $stock = (int)($p->stock ?? 0);
            if ($stock < $needQty) {
                throw new \RuntimeException("Not enough stock (products.stock) product_id={$productId}");
            }
            return;
        }
    }

    /**
     * Adjust stock:
     * - delta < 0: trừ kho
     * - delta > 0: hoàn kho
     */
    private function adjustStockLocked(int $productId, int $delta): void
    {
        if ($delta === 0) return;

        // ưu tiên product_inventories
        if (Schema::hasTable(self::INVENTORY_TABLE)) {
            $inv = DB::table(self::INVENTORY_TABLE)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($inv) {
                $stock = (int)($inv->stock ?? 0);
                $newStock = $stock + $delta;

                // không cho âm: nếu âm => throw để rollback (tránh data sai)
                if ($newStock < 0) {
                    throw new \RuntimeException("Stock underflow (" . self::INVENTORY_TABLE . ") product_id={$productId}");
                }

                $update = ['stock' => $newStock];
                if (Schema::hasColumn(self::INVENTORY_TABLE, 'updated_at')) {
                    $update['updated_at'] = now();
                }

                DB::table(self::INVENTORY_TABLE)
                    ->where('product_id', $productId)
                    ->update($update);

                return;
            }
        }

        // fallback products.stock
        if (Schema::hasColumn('products', 'stock')) {
            $p = Product::where('id', $productId)->lockForUpdate()->first();
            if (!$p) return;

            $stock = (int)($p->stock ?? 0);
            $newStock = $stock + $delta;

            if ($newStock < 0) {
                throw new \RuntimeException("Stock underflow (products.stock) product_id={$productId}");
            }

            $p->stock = $newStock;
            $p->save();
        }
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
