<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaleCampaign;
use Illuminate\Http\Request;

class AdminSaleCampaignController extends Controller
{
    /**
     * ============================================================
     * GET /api/admin/sale-campaigns
     * 👉 DANH SÁCH CAMPAIGN (ADMIN LIST)
     * ============================================================
     */
    public function index()
    {
        return SaleCampaign::withCount('items')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * ============================================================
     * POST /api/admin/sale-campaigns
     * 👉 TẠO CHIẾN DỊCH (KHÔNG CHO TRÙNG THỜI GIAN)
     * ============================================================
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'from_date'   => ['required', 'date'],
            'to_date'     => ['required', 'date', 'after:from_date'],
        ]);

        /**
         * ❌ CHECK TRÙNG THỜI GIAN
         * Rule:
         * existing.from_date <= new.to_date
         * AND
         * existing.to_date >= new.from_date
         */
        $conflict = SaleCampaign::where(function ($q) use ($validated) {
            $q->where('from_date', '<=', $validated['to_date'])
              ->where('to_date', '>=', $validated['from_date']);
        })->exists();

        if ($conflict) {
            return response()->json([
                'status'  => false,
                'message' => 'Đã tồn tại chiến dịch sale trong khoảng thời gian này',
            ], 422);
        }

        $campaign = SaleCampaign::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'from_date'   => $validated['from_date'],
            'to_date'     => $validated['to_date'],
            'status'      => 'active',
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Tạo chiến dịch thành công',
            'data'    => $campaign,
        ], 201);
    }

    /**
     * ============================================================
     * GET /api/admin/sale-campaigns/{id}
     * 👉 VIEW / EDIT / MODAL XEM SẢN PHẨM
     * ============================================================
     */
    public function show($id)
    {
        return response()->json([
            'status' => true,
            'data'   => SaleCampaign::with([
                /**
                 * 🔥 LOAD ITEM + PRODUCT
                 * - FE dùng cho:
                 *   - Edit campaign
                 *   - Modal xem sản phẩm sale
                 */
                'items.product:id,name,thumbnail'
            ])->findOrFail($id),
        ]);
    }

    /**
     * ============================================================
     * PUT /api/admin/sale-campaigns/{id}
     * 👉 UPDATE (KHÔNG CHO TRÙNG THỜI GIAN – TRỪ CHÍNH NÓ)
     * ============================================================
     */
    public function update(Request $request, $id)
    {
        $campaign = SaleCampaign::findOrFail($id);

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'from_date'   => ['required', 'date'],
            'to_date'     => ['required', 'date', 'after:from_date'],
        ]);

        /**
         * ❌ CHECK TRÙNG THỜI GIAN (TRỪ CHÍNH NÓ)
         */
        $conflict = SaleCampaign::where('id', '!=', $campaign->id)
            ->where(function ($q) use ($validated) {
                $q->where('from_date', '<=', $validated['to_date'])
                  ->where('to_date', '>=', $validated['from_date']);
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'status'  => false,
                'message' => 'Khoảng thời gian này đã có chiến dịch sale khác',
            ], 422);
        }

        $campaign->update($validated);

        return response()->json([
            'status'  => true,
            'message' => 'Cập nhật chiến dịch thành công',
            'data'    => $campaign,
        ]);
    }

    /**
     * ============================================================
     * DELETE /api/admin/sale-campaigns/{id}
     * ============================================================
     */
    public function destroy($id)
    {
        SaleCampaign::destroy($id);

        return response()->json([
            'status'  => true,
            'message' => 'Đã xoá chiến dịch',
        ]);
    }
}
