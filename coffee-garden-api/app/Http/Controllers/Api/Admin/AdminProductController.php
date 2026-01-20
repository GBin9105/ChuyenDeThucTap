<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\ProductInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AdminProductController extends Controller
{
    /**
     * =========================================================
     * LIST PRODUCTS (ADMIN)
     * =========================================================
     */
    public function index()
    {
        return Product::with([
            'category',
            'inventory',                     // snapshot tồn kho
            'attributeValues.value.group',
            'campaignItems.campaign',        // 🔥 xem sản phẩm đang sale
            'galleryMainImage',              // 🔥 ảnh main trong gallery (preview)
        ])
            ->orderByDesc('id')
            ->get();
    }

    /**
     * =========================================================
     * CREATE PRODUCT
     * =========================================================
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255',
            'thumbnail'   => 'required|string|max:500',
            'content'     => 'nullable|string',
            'description' => 'nullable|string',
            'price_base'  => 'required|numeric|min:0',
            'category_id' => 'required|integer|exists:categories,id',
            'status'      => 'nullable|integer',
            'attributes'  => 'array',
        ]);

        return DB::transaction(function () use ($validated, $request) {

            /**
             * =========================================================
             * AUTO SLUG
             * =========================================================
             */
            $slug   = $validated['slug'] ?? Str::slug($validated['name']);
            $origin = $slug;
            $i      = 1;

            while (Product::where('slug', $slug)->exists()) {
                $slug = $origin . '-' . $i++;
            }

            $validated['slug']   = $slug;
            $validated['status'] = $validated['status'] ?? 1;

            /**
             * =========================================================
             * CREATE PRODUCT
             * =========================================================
             */
            $product = Product::create($validated);

            /**
             * =========================================================
             * INIT INVENTORY SNAPSHOT (PHƯƠNG ÁN B)
             * 1 product = 1 inventory row
             * =========================================================
             */
            ProductInventory::create([
                'product_id' => $product->id,
                'stock'      => 0,
                'cost_price' => 0,
            ]);

            /**
             * =========================================================
             * SAVE ATTRIBUTES
             * =========================================================
             */
            if ($request->has('attributes')) {
                foreach ($request->input('attributes', []) as $attr) {
                    ProductAttribute::create([
                        'product_id'   => $product->id,
                        'attribute_id' => $attr['id'],
                        'active'       => $attr['active'] ?? 1,
                    ]);
                }
            }

            return response()->json(
                $product->load($this->relations()),
                201
            );
        });
    }

    /**
     * =========================================================
     * SHOW PRODUCT (ADMIN)
     * =========================================================
     * → ADMIN XEM FULL:
     *   - product core
     *   - inventory
     *   - attributes
     *   - sale
     *   - gallery images
     */
    public function show($id)
    {
        return Product::with($this->relations())
            ->findOrFail($id);
    }

    /**
     * =========================================================
     * UPDATE PRODUCT (FULL DATA)
     * =========================================================
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255',
            'thumbnail'   => 'required|string|max:500',
            'content'     => 'nullable|string',
            'description' => 'nullable|string',
            'price_base'  => 'required|numeric|min:0',
            'category_id' => 'required|integer|exists:categories,id',
            'status'      => 'nullable|integer',
            'attributes'  => 'array',
        ]);

        /**
         * =========================================================
         * AUTO SLUG (UPDATE)
         * =========================================================
         */
        $slug   = $validated['slug'] ?? Str::slug($validated['name']);
        $origin = $slug;
        $i      = 1;

        while (
            Product::where('slug', $slug)
                ->where('id', '!=', $product->id)
                ->exists()
        ) {
            $slug = $origin . '-' . $i++;
        }

        $validated['slug'] = $slug;

        DB::transaction(function () use ($validated, $request, $product) {

            /**
             * =========================================================
             * UPDATE PRODUCT
             * =========================================================
             */
            $product->update($validated);

            /**
             * =========================================================
             * UPDATE ATTRIBUTES
             * =========================================================
             */
            if ($request->has('attributes')) {
                ProductAttribute::where('product_id', $product->id)->delete();

                foreach ($request->input('attributes', []) as $attr) {
                    ProductAttribute::create([
                        'product_id'   => $product->id,
                        'attribute_id' => $attr['id'],
                        'active'       => $attr['active'] ?? 1,
                    ]);
                }
            }
        });

        return response()->json([
            'status' => true,
            'data'   => $product->load($this->relations()),
        ]);
    }

    /**
     * =========================================================
     * DELETE PRODUCT
     * =========================================================
     */
    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            Product::destroy($id);
            // product_inventories
            // product_attributes
            // product_images
            // sale_campaign_items
            // → cascade theo FK
        });

        return response()->json([
            'status' => true,
        ]);
    }

    /**
     * =========================================================
     * RELATIONS (ADMIN)
     * =========================================================
     */
    private function relations(): array
    {
        return [
            'category',
            'inventory',
            'attributeValues.value.group',
            'campaignItems.campaign', // 🔥 admin thấy sản phẩm đang sale
            'images',                 // 🔥 toàn bộ gallery
            'galleryMainImage',       // 🔥 ảnh main gallery
        ];
    }
}
