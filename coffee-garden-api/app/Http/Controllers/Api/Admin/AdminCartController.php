<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCartController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('is_admin');
    }

    /**
     * GET /api/admin/carts?user_id=1
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $query = Cart::with([
                'user:id,name,email',
                'product.inventory',
                'product.campaignItems.campaign',
            ])
            ->orderByDesc('id');

        if (!empty($data['user_id'])) {
            $query->where('user_id', $data['user_id']);
        }

        $lines = $query->get();

        $totals = $this->repriceAndPersistLines($lines);

        return response()->json([
            'status' => true,
            'user'   => !empty($data['user_id']) ? User::find($data['user_id']) : null,
            'data'   => $lines,
            'totals' => $totals,
        ]);
    }

    /**
     * PATCH /api/admin/carts/{cart}
     * chỉ cho update qty (và vẫn chặn tồn kho)
     */
    public function update(Request $request, Cart $cart)
    {
        $data = $request->validate([
            'qty' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $cart = Cart::where('id', $cart->id)->lockForUpdate()->firstOrFail();

        $product = Product::with(['inventory', 'campaignItems.campaign'])
            ->find($cart->product_id);

        if (!$product || (int)$product->status !== 1) {
            $cart->unit_price = $this->money2(0);
            $cart->extras_total = $this->money2(0);
            $cart->line_total = $this->money2(0);
            $cart->save();

            return response()->json([
                'status'  => false,
                'message' => 'Product is not available',
                'data'    => $cart,
            ], 422);
        }

        $availableStock = $this->productStock($product);
        $nextQty = (int)$data['qty'];

        if ($nextQty > $availableStock) {
            return response()->json([
                'status'  => false,
                'message' => 'Not enough stock',
            ], 422);
        }

        $cart->qty = $nextQty;

        // cập nhật snapshot extras theo Attribute hiện tại
        $sel = $this->buildSelectionsForCart($product->id, $cart->attribute_value_ids);

        if ($sel['status'] === false) {
            return response()->json([
                'status'  => false,
                'message' => $sel['message'] ?? 'Invalid attributes',
            ], 422);
        }

        $this->applySelectionsToCart($cart, $sel);
        $this->repriceOneLine($cart, $product);

        $cart->save();

        $cart->load(['user:id,name,email', 'product.inventory', 'product.campaignItems.campaign']);

        return response()->json([
            'status'  => true,
            'message' => 'Updated',
            'data'    => $cart,
        ]);
    }

    /**
     * DELETE /api/admin/carts/{cart}
     */
    public function destroy(Cart $cart)
    {
        $cart->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Deleted',
        ]);
    }

    /**
     * POST /api/admin/carts/clear?user_id=1
     */
    public function clear(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $q = Cart::query();
        if (!empty($data['user_id'])) {
            $q->where('user_id', $data['user_id']);
        }

        $deleted = $q->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Cleared',
            'deleted' => $deleted,
        ]);
    }

    /* ========================= Core: reprice using Attribute CURRENT ========================= */

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
                $line->unit_price = $this->money2(0);
                $line->extras_total = $this->money2(0);
                $line->line_total = $this->money2(0);
                $line->save();
                continue;
            }

            // enforce stock rule (role nào cũng không vượt kho)
            $availableStock = $this->productStock($product);
            if ($availableStock <= 0) {
                // hết hàng -> xóa dòng cho sạch cart
                $line->delete();
                continue;
            }
            if ((int)$line->qty > $availableStock) {
                $line->qty = $availableStock;
            }

            $sel = $this->buildSelectionsForCart($product->id, $line->attribute_value_ids);

            // Nếu selections invalid (attribute bị tắt / không thuộc product) -> xóa line
            if ($sel['status'] === false) {
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

    /**
     * Validate + load Attribute CURRENT price_extra based on ProductAttribute active=1
     */
    private function buildSelectionsForCart(int $productId, $attributeValueIds): array
    {
        if (!is_array($attributeValueIds) || count($attributeValueIds) === 0) {
            return [
                'status' => true,
                'size_value_id' => null,
                'size_name' => null,
                'size_price_extra' => 0,
                'toppings' => [],
                'attributes' => [],
                'normalized_ids' => [],
            ];
        }

        $ids = array_values(array_unique(array_filter($attributeValueIds, fn($x) => is_numeric($x))));
        $ids = array_map('intval', $ids);

        // Validate: phải thuộc product_attributes active=1
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
            $val = $pa->value;
            if (!$val) continue;

            $group = $val->group;
            $groupName = $group ? (string)$group->name : '';

            // SIZE: chỉ 1 value
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

            // TOPPING: nhiều value
            if ($this->isToppingGroupName($groupName)) {
                $toppings[] = [
                    'id'          => (int)$val->id,
                    'name'        => (string)$val->name,
                    'qty'         => 1,
                    'price_extra' => (float)($val->price_extra ?? 0),
                ];
                continue;
            }

            // OTHER GROUPS
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

        // normalize ids to stabilize line_key
        $cart->attribute_value_ids = $sel['normalized_ids'] ?? ($cart->attribute_value_ids ?? []);
    }

    private function repriceOneLine(Cart $line, Product $product): void
    {
        // dùng final_price (sale campaign) nếu có
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
        if (is_string($arr)) $arr = json_decode($arr, true);
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

    /* ========================= Stock: use inventory ========================= */

    private function productStock(Product $product): int
    {
        return max(0, (int)($product->inventory?->stock ?? 0));
    }

    /* ========================= Helpers ========================= */

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

    private function money2($value): string
    {
        return number_format((float)$value, 2, '.', '');
    }
}
