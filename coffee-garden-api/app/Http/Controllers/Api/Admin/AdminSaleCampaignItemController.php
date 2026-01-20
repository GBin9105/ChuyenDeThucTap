<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaleCampaign;
use App\Models\SaleCampaignItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminSaleCampaignItemController extends Controller
{
    /**
     * ============================================================
     * POST /api/admin/sale-campaigns/{campaignId}/items
     * 👉 ATTACH / REPLACE PRODUCTS TO CAMPAIGN
     * ============================================================
     */
    public function store(Request $request, $campaignId)
    {
        /**
         * ============================================================
         * ENSURE CAMPAIGN EXISTS
         * ============================================================
         */
        SaleCampaign::findOrFail($campaignId);

        /**
         * ============================================================
         * VALIDATION (ĐỒNG BỘ TOÀN HỆ THỐNG)
         * ============================================================
         */
        $validated = $request->validate([
            'type' => [
                'required',
                Rule::in([
                    'percent',
                    'fixed_amount',
                    'fixed_price',
                ]),
            ],

            // 🔥 GIẢM %
            'percent' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
                Rule::requiredIf(
                    fn () => $request->input('type') === 'percent'
                ),
            ],

            // 🔥 GIẢM TIỀN / ĐỒNG GIÁ
            'sale_price' => [
                'nullable',
                'numeric',
                'min:1',
                Rule::requiredIf(
                    fn () => in_array(
                        $request->input('type'),
                        ['fixed_amount', 'fixed_price'],
                        true
                    )
                ),
            ],

            'products' => [
                'required',
                'array',
                'min:1',
            ],

            'products.*.id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
        ]);

        /**
         * ============================================================
         * QUYẾT ĐỊNH GIÁ – TUYỆT ĐỐI KHÔNG ĐOÁN
         * ============================================================
         */
        $type = $validated['type'];

        $percent = $type === 'percent'
            ? (float) $validated['percent']
            : null;

        $salePrice = in_array($type, ['fixed_amount', 'fixed_price'], true)
            ? (float) $validated['sale_price']
            : null;

        /**
         * ============================================================
         * REPLACE ITEMS (AN TOÀN – ĐÚNG NGHIỆP VỤ)
         * ============================================================
         */
        SaleCampaignItem::where('campaign_id', $campaignId)->delete();

        foreach ($validated['products'] as $product) {
            SaleCampaignItem::create([
                'campaign_id' => $campaignId,
                'product_id'  => $product['id'],
                'type'        => $type,
                'percent'     => $percent,
                'sale_price'  => $salePrice,
            ]);
        }

        /**
         * ============================================================
         * RESPONSE
         * ============================================================
         */
        return response()->json([
            'status'  => true,
            'message' => 'Danh sách sản phẩm đã được cập nhật.',
        ]);
    }
}
