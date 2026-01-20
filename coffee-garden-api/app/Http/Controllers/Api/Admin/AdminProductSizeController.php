<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSize;
use Illuminate\Http\Request;

class AdminProductSizeController extends Controller
{
    /**
     * GET: /api/admin/products/{product_id}/sizes
     * Lấy tất cả size + giá thêm của sản phẩm
     */
    public function index($productId)
    {
        $product = Product::findOrFail($productId);

        return $product->sizes()->with('size')->get();
    }

    /**
     * POST: /api/admin/products/{product_id}/sizes
     * Gán size vào sản phẩm
     */
    public function store(Request $request, $productId)
    {
        $data = $request->validate([
            'size_id' => 'required|integer|exists:sizes,id',
            'price_extra' => 'required|numeric|min:0'
        ]);

        $data['product_id'] = $productId;

        // Nếu đã tồn tại → update
        $item = ProductSize::updateOrCreate(
            ['product_id' => $productId, 'size_id' => $data['size_id']],
            ['price_extra' => $data['price_extra']]
        );

        return response()->json([
            'message' => 'Saved successfully',
            'data'    => $item
        ]);
    }

    /**
     * PUT: /api/admin/products/{product_id}/sizes/{id}
     * Cập nhật giá_extra size cho sản phẩm
     */
    public function update(Request $request, $productId, $id)
    {
        $item = ProductSize::where('product_id', $productId)->findOrFail($id);

        $data = $request->validate([
            'price_extra' => 'required|numeric|min:0'
        ]);

        $item->update($data);

        return response()->json([
            'message' => 'Updated',
            'data'    => $item
        ]);
    }

    /**
     * DELETE: /api/admin/products/{product_id}/sizes/{id}
     * Xóa size khỏi sản phẩm
     */
    public function destroy($productId, $id)
    {
        $item = ProductSize::where('product_id', $productId)->findOrFail($id);

        $item->delete();

        return response()->json([
            'message' => 'Deleted'
        ]);
    }
}
