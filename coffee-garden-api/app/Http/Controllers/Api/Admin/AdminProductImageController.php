<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductImageRequest;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminProductImageController extends Controller
{
    /**
     * =========================================================
     * LIST IMAGES OF A PRODUCT
     * =========================================================
     * API: GET /api/admin/products/{productId}/images
     */
    public function index($productId)
    {
        return ProductImage::where('product_id', $productId)
            ->orderByDesc('is_main')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * =========================================================
     * STORE IMAGE
     * =========================================================
     * API: POST /api/admin/product-images
     */
    public function store(ProductImageRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {

            /**
             * Nếu ảnh này là main → unset main cũ
             */
            if ($data['is_main']) {
                ProductImage::where('product_id', $data['product_id'])
                    ->where('is_main', true)
                    ->update(['is_main' => false]);
            }

            $image = ProductImage::create($data);

            return response()->json([
                'status' => true,
                'data'   => $image,
            ], 201);
        });
    }

    /**
     * =========================================================
     * UPDATE IMAGE
     * =========================================================
     * API: PUT /api/admin/product-images/{id}
     */
    public function update(ProductImageRequest $request, $id)
    {
        $image = ProductImage::findOrFail($id);
        $data  = $request->validated();

        DB::transaction(function () use ($image, $data) {

            /**
             * Nếu set main → unset các ảnh main khác
             */
            if ($data['is_main']) {
                ProductImage::where('product_id', $image->product_id)
                    ->where('is_main', true)
                    ->where('id', '!=', $image->id)
                    ->update(['is_main' => false]);
            }

            $image->update($data);
        });

        return response()->json([
            'status' => true,
            'data'   => $image->fresh(),
        ]);
    }

    /**
     * =========================================================
     * DELETE IMAGE
     * =========================================================
     * API: DELETE /api/admin/product-images/{id}
     */
    public function destroy($id)
    {
        $image = ProductImage::findOrFail($id);

        $image->delete();

        return response()->json([
            'status' => true,
        ]);
    }

    /**
     * =========================================================
     * SET MAIN IMAGE (QUICK ACTION)
     * =========================================================
     * API: POST /api/admin/product-images/{id}/set-main
     */
    public function setMain($id)
    {
        $image = ProductImage::findOrFail($id);

        DB::transaction(function () use ($image) {

            ProductImage::where('product_id', $image->product_id)
                ->where('is_main', true)
                ->update(['is_main' => false]);

            $image->update(['is_main' => true]);
        });

        return response()->json([
            'status' => true,
            'data'   => $image->fresh(),
        ]);
    }

    /**
     * =========================================================
     * REORDER IMAGES
     * =========================================================
     * API: POST /api/admin/product-images/reorder
     *
     * Payload:
     * {
     *   "items": [
     *     { "id": 5, "sort_order": 0 },
     *     { "id": 8, "sort_order": 1 }
     *   ]
     * }
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'items'               => 'required|array',
            'items.*.id'          => 'required|integer|exists:product_images,id',
            'items.*.sort_order'  => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                ProductImage::where('id', $item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'status' => true,
        ]);
    }
}
