<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductAttribute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * GET /api/cart
     */
    public function index()
    {
        $userId = Auth::id();

        $lines = Cart::with([
                // size relation không còn cần, nhưng giữ cũng không sao nếu model còn
                // 'size',
                'product.inventory',
                'product.campaignItems.campaign',
                'product.images',
                'product.galleryMainImage',
            ])
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get();

        // Reprice + refresh snapshot theo Attribute hiện tại
        $totals = $this->repriceAndPersistLines($lines);

        // load lại lines sau khi có thể đã delete/clamp
        $lines = Cart::with([
                'product.inventory',
                'product.campaignItems.campaign',
                'product.images',
                'product.galleryMainImage',
            ])
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => true,
            'lines'  => $lines,
            'totals' => $totals,
        ]);
    }

    /**
     * POST /api/cart
     * Payload khuyến nghị:
     * - product_id, qty
     * - attribute_value_ids: [id, id, ...]
     * - options: object/array tuỳ bạn
     */
    public function store(Request $request)
    {
        $userId = Auth::id();

        $data = $request->validate([
            'product_id'          => ['required', 'integer', 'exists:products,id'],
            'qty'                 => ['required', 'integer', 'min:1', 'max:999'],
            'options'             => ['nullable'], // object hoặc array đều được, FE của bạn đang dùng any
            'attribute_value_ids' => ['nullable', 'array'],
            'attribute_value_ids.*' => ['integer', 'exists:attributes,id'],
        ]);

        $product = Product::with([
                'inventory',
                'campaignItems.campaign',
            ])->findOrFail($data['product_id']);

        if ((int)$product->status !== 1) {
            return response()->json(['status' => false, 'message' => 'Product is not available'], 422);
        }

        $availableStock = $this->productStock($product);
        if ($availableStock <= 0) {
            return response()->json(['status' => false, 'message' => 'Out of stock'], 422);
        }

        if ((int)$data['qty'] > $availableStock) {
            return response()->json(['status' => false, 'message' => 'Not enough stock'], 422);
        }

        // Build selections (validate by product_attributes active=1)
        $sel = $this->buildSelectionsForProduct(
            (int)$product->id,
            $data['attribute_value_ids'] ?? []
        );

        if ($sel['status'] === false) {
            return response()->json([
                'status'  => false,
                'message' => $sel['message'] ?? 'Invalid attributes',
            ], 422);
        }

        $normalizedIds = $sel['normalized_ids'] ?? [];

        // LineKey: product + options + attribute_value_ids(sorted)
        $payloadForKey = [
            'product_id'          => (int)$product->id,
            'options'             => $data['options'] ?? null,
            'attribute_value_ids' => $normalizedIds ?: null,
        ];
        $lineKey = $this->makeLineKey($payloadForKey);

        try {
            $line = DB::transaction(function () use ($userId, $product, $data, $sel, $normalizedIds, $lineKey) {

                $existing = Cart::where('user_id', $userId)
                    ->where('line_key', $lineKey)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $newQty = (int)$existing->qty + (int)$data['qty'];

                    $availableStock = $this->productStock($product);
                    if ($newQty > $availableStock) {
                        throw new \RuntimeException('Not enough stock');
                    }

                    $existing->qty = $newQty;
                    $existing->options = $data['options'] ?? null;
                    $existing->attribute_value_ids = $normalizedIds ?: null;

                    $this->applySelectionsToCart($existing, $sel);
                    $this->repriceOneLine($existing, $product);

                    $existing->save();
                    return $existing;
                }

                $cart = new Cart();
                $cart->user_id = $userId;
                $cart->product_id = $product->id;
                $cart->qty = (int)$data['qty'];

                $cart->options = $data['options'] ?? null;
                $cart->attribute_value_ids = $normalizedIds ?: null;
                $cart->line_key = $lineKey;

                $this->applySelectionsToCart($cart, $sel);
                $this->repriceOneLine($cart, $product);

                $cart->save();
                return $cart;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 422);
        }

        // trả lại cart mới nhất
        $lines = Cart::with([
                'product.inventory',
                'product.campaignItems.campaign',
                'product.images',
                'product.galleryMainImage',
            ])
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get();

        $totals = $this->repriceAndPersistLines($lines);

        return response()->json([
            'status'  => true,
            'message' => 'Added',
            'line'    => $line,
            'lines'   => $lines,
            'totals'  => $totals,
        ], 201);
    }

    /**
     * PATCH /api/cart/{cart}
     * - update qty/options/attribute_value_ids
     * - merge line nếu line_key thay đổi và đã tồn tại line_key mới
     */
    public function update(Request $request, Cart $cart)
    {
        $userId = Auth::id();
        if ((int)$cart->user_id !== (int)$userId) {
            return response()->json(['status' => false, 'message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'qty'                 => ['nullable', 'integer', 'min:1', 'max:999'],
            'options'             => ['nullable'],
            'attribute_value_ids' => ['nullable', 'array'],
            'attribute_value_ids.*' => ['integer', 'exists:attributes,id'],
        ]);

        $product = Product::with([
                'inventory',
                'campaignItems.campaign',
            ])->findOrFail($cart->product_id);

        if ((int)$product->status !== 1) {
            return response()->json(['status' => false, 'message' => 'Product is not available'], 422);
        }

        try {
            $updated = DB::transaction(function () use ($cart, $product, $data, $userId) {

                $cart = Cart::where('id', $cart->id)->lockForUpdate()->firstOrFail();

                // qty update
                if (array_key_exists('qty', $data) && $data['qty'] !== null) {
                    $cart->qty = (int)$data['qty'];
                }

                // options update (nếu FE gửi)
                if (array_key_exists('options', $data)) {
                    $cart->options = $data['options'];
                }

                // attribute ids update (nếu FE gửi)
                $attrTouched = array_key_exists('attribute_value_ids', $data);
                $normalizedIds = $cart->attribute_value_ids ?? [];

                $sel = null;
                if ($attrTouched) {
                    $sel = $this->buildSelectionsForProduct(
                        (int)$product->id,
                        $data['attribute_value_ids'] ?? []
                    );

                    if ($sel['status'] === false) {
                        throw new \RuntimeException($sel['message'] ?? 'Invalid attributes');
                    }

                    $normalizedIds = $sel['normalized_ids'] ?? [];
                    $cart->attribute_value_ids = $normalizedIds ?: null;

                    // refresh snapshots
                    $this->applySelectionsToCart($cart, $sel);
                }

                // stock check (mọi role đều chặn)
                $availableStock = $this->productStock($product);
                if ($availableStock <= 0) {
                    // hết hàng -> xoá line cho sạch
                    $cart->delete();
                    return null;
                }
                if ((int)$cart->qty > $availableStock) {
                    throw new \RuntimeException('Not enough stock');
                }

                // compute new line_key (nếu options/attrs đổi)
                $payloadForKey = [
                    'product_id'          => (int)$cart->product_id,
                    'options'             => $cart->options,
                    'attribute_value_ids' => $normalizedIds ?: null,
                ];
                $newKey = $this->makeLineKey($payloadForKey);

                if ($newKey !== $cart->line_key) {
                    $target = Cart::where('user_id', $userId)
                        ->where('line_key', $newKey)
                        ->lockForUpdate()
                        ->first();

                    if ($target) {
                        $target->qty = (int)$target->qty + (int)$cart->qty;

                        $availableStock = $this->productStock($product);
                        if ((int)$target->qty > $availableStock) {
                            throw new \RuntimeException('Not enough stock');
                        }

                        // target lấy payload mới nhất
                        $target->options = $cart->options;
                        $target->attribute_value_ids = $normalizedIds ?: null;

                        if ($sel) {
                            $this->applySelectionsToCart($target, $sel);
                        } else {
                            // nếu không touched attrs, vẫn cần đảm bảo snapshot đúng hiện tại
                            $sel2 = $this->buildSelectionsForProduct((int)$product->id, $normalizedIds);
                            if ($sel2['status'] === false) {
                                throw new \RuntimeException($sel2['message'] ?? 'Invalid attributes');
                            }
                            $this->applySelectionsToCart($target, $sel2);
                        }

                        $this->repriceOneLine($target, $product);
                        $target->save();

                        $cart->delete();
                        return $target;
                    }

                    $cart->line_key = $newKey;
                }

                // ensure snapshot vẫn đúng hiện tại ngay cả khi FE không gửi attrs
                if (!$sel) {
                    $sel2 = $this->buildSelectionsForProduct((int)$product->id, $normalizedIds);
                    if ($sel2['status'] === false) {
                        // attribute bị tắt / không còn thuộc product -> xoá line
                        $cart->delete();
                        return null;
                    }
                    $this->applySelectionsToCart($cart, $sel2);
                }

                $this->repriceOneLine($cart, $product);
                $cart->save();

                return $cart;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 422);
        }

        $lines = Cart::with([
                'product.inventory',
                'product.campaignItems.campaign',
                'product.images',
                'product.galleryMainImage',
            ])
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get();

        $totals = $this->repriceAndPersistLines($lines);

        return response()->json([
            'status'  => true,
            'message' => 'Updated',
            'line'    => $updated,
            'lines'   => $lines,
            'totals'  => $totals,
        ]);
    }

    /**
     * DELETE /api/cart/{cart}
     */
    public function destroy(Cart $cart)
    {
        $userId = Auth::id();
        if ((int)$cart->user_id !== (int)$userId) {
            return response()->json(['status' => false, 'message' => 'Forbidden'], 403);
        }

        $cart->delete();

        $lines = Cart::with([
                'product.inventory',
                'product.campaignItems.campaign',
                'product.images',
                'product.galleryMainImage',
            ])
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get();

        $totals = $this->repriceAndPersistLines($lines);

        return response()->json([
            'status'  => true,
            'message' => 'Deleted',
            'lines'   => $lines,
            'totals'  => $totals,
        ]);
    }

    /**
     * DELETE /api/cart
     */
    public function clear()
    {
        $userId = Auth::id();
        Cart::where('user_id', $userId)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Cleared',
            'lines'   => [],
            'totals'  => [
                'subtotal'     => 0,
                'extras_total' => 0,
                'grand_total'  => 0,
                'count_lines'  => 0,
                'count_items'  => 0,
            ],
        ]);
    }

    /* =========================
     * Attribute selections (CANONICAL)
     * ========================= */

    /**
     * Validate attribute_value_ids theo product_attributes (active=1),
     * rồi build snapshot:
     * - Size group -> size_name/size_price_extra
     * - Topping group -> toppings[]
     * - Others -> attribute_values[]
     */
    private function buildSelectionsForProduct(int $productId, array $attributeValueIds): array
    {
        $ids = array_values(array_unique(array_filter($attributeValueIds, fn($x) => is_numeric($x))));
        $ids = array_map('intval', $ids);

        if (count($ids) === 0) {
            return [
                'status'           => true,
                'size_value_id'    => null,
                'size_name'        => null,
                'size_price_extra' => 0,
                'toppings'         => [],
                'attributes'       => [],
                'normalized_ids'   => [],
            ];
        }

        // Validate: ids phải thuộc product_attributes active=1
        $rows = ProductAttribute::where('product_id', $productId)
            ->where('active', 1)
            ->whereIn('attribute_id', $ids)
            ->with(['value.group'])
            ->get();

        if ($rows->count() !== count($ids)) {
            return [
                'status'  => false,
                'message' => 'Some attribute values are not available for this product',
            ];
        }

        $sizeValueId = null;
        $sizeName = null;
        $sizeExtra = 0;

        $toppings = [];
        $attributes = [];

        foreach ($rows as $pa) {
            $val = $pa->value; // Attribute value
            if (!$val) continue;

            $group = $val->group; // Attribute group
            $groupName = $group ? (string)$group->name : '';

            if ($this->isSizeGroupName($groupName)) {
                if ($sizeValueId !== null && (int)$sizeValueId !== (int)$val->id) {
                    return [
                        'status'  => false,
                        'message' => 'Only one size can be selected',
                    ];
                }

                $sizeValueId = (int)$val->id;
                $sizeName = (string)$val->name;
                $sizeExtra = (float)($val->price_extra ?? 0);
                continue;
            }

            if ($this->isToppingGroupName($groupName)) {
                $toppings[] = [
                    'id'          => (int)$val->id,
                    'name'        => (string)$val->name,
                    'qty'         => 1,
                    'price_extra' => (float)($val->price_extra ?? 0),
                ];
                continue;
            }

            $attributes[] = [
                'group_id'    => $group ? (int)$group->id : null,
                'group_name'  => $groupName ?: null,
                'value_id'    => (int)$val->id,
                'value_name'  => (string)$val->name,
                'qty'         => 1,
                'price_extra' => (float)($val->price_extra ?? 0),
            ];
        }

        sort($ids);

        return [
            'status'           => true,
            'size_value_id'    => $sizeValueId,
            'size_name'        => $sizeName,
            'size_price_extra' => $sizeExtra,
            'toppings'         => $toppings,
            'attributes'       => $attributes,
            'normalized_ids'   => $ids,
        ];
    }

    private function applySelectionsToCart(Cart $cart, array $sel): void
    {
        $cart->size_name = $sel['size_name'] ?? null;
        $cart->size_price_extra = $this->money2((float)($sel['size_price_extra'] ?? 0));

        $cart->toppings = !empty($sel['toppings']) ? $sel['toppings'] : null;
        $cart->attribute_values = !empty($sel['attributes']) ? $sel['attributes'] : null;

        // normalize để line_key ổn định
        $cart->attribute_value_ids = $sel['normalized_ids'] ?? ($cart->attribute_value_ids ?? []);
    }

    private function isSizeGroupName(string $name): bool
    {
        $s = mb_strtolower(trim($name));
        return $s === 'size'
            || str_contains($s, 'size')
            || str_contains($s, 'kích cỡ')
            || str_contains($s, 'kich co');
    }

    private function isToppingGroupName(string $name): bool
    {
        $s = mb_strtolower(trim($name));
        return str_contains($s, 'topping') || str_contains($s, 'toping');
    }

    /* =========================
     * Stock + Pricing
     * ========================= */

    private function productStock(Product $product): int
    {
        return max(0, (int)($product->inventory?->stock ?? 0));
    }

    private function repriceAndPersistLines($lines): array
    {
        $subtotal = 0.0;
        $extrasTotal = 0.0;
        $grandTotal = 0.0;
        $countLines = 0;
        $countItems = 0;

        foreach ($lines as $line) {
            $product = $line->product;

            if (!$product || (int)$product->status !== 1) {
                // product không hợp lệ -> giữ line để user xoá thủ công
                $line->unit_price = $this->money2(0);
                $line->extras_total = $this->money2(0);
                $line->line_total = $this->money2(0);
                $line->save();
                continue;
            }

            // enforce stock rule
            $availableStock = $this->productStock($product);
            if ($availableStock <= 0) {
                // hết hàng -> xoá line cho sạch
                $line->delete();
                continue;
            }

            if ((int)$line->qty > $availableStock) {
                $line->qty = $availableStock;
            }

            // refresh snapshot theo attribute hiện tại
            $sel = $this->buildSelectionsForProduct((int)$product->id, $line->attribute_value_ids ?? []);
            if ($sel['status'] === false) {
                // attribute bị tắt / không thuộc product nữa -> xoá line
                $line->delete();
                continue;
            }

            $this->applySelectionsToCart($line, $sel);
            $this->repriceOneLine($line, $product);
            $line->save();

            $countLines++;
            $countItems += (int)$line->qty;

            $subtotal += (int)$line->qty * (float)$line->unit_price;
            $extrasTotal += (int)$line->qty * (float)$line->extras_total;
            $grandTotal += (float)$line->line_total;
        }

        return [
            'subtotal'     => $subtotal,
            'extras_total' => $extrasTotal,
            'grand_total'  => $grandTotal,
            'count_lines'  => $countLines,
            'count_items'  => $countItems,
        ];
    }

    private function repriceOneLine(Cart $line, Product $product): void
    {
        // sale campaign -> final_price
        $unitPrice = (float)($product->final_price ?? $product->price_base ?? 0);

        $extras =
            (float)$line->size_price_extra
            + (float)$this->sumPriceExtra($line->toppings)
            + (float)$this->sumPriceExtra($line->attribute_values);

        $qty = (int)$line->qty;
        $lineTotal = $qty * ($unitPrice + $extras);

        $line->unit_price   = $this->money2($unitPrice);
        $line->extras_total = $this->money2($extras);
        $line->line_total   = $this->money2($lineTotal);
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

    /* =========================
     * line_key helpers
     * ========================= */

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

    private function money2($value): string
    {
        return number_format((float)$value, 2, '.', '');
    }
}
