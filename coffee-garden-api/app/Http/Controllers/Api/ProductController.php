<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;

class ProductController extends Controller
{
    /**
     * ==========================================================
     * CLIENT – GET ALL PRODUCTS
     * Chỉ trả về sản phẩm:
     * - status = 1
     * - stock > 0
     * ==========================================================
     */
    public function index()
    {
        return Product::available()
            ->with([
                'category',
                'campaignItems.campaign',
                'images',            
                'galleryMainImage',  
            ])
            ->orderByDesc('id')
            ->get()
            ->map(function ($p) {

                $images = $p->images?->map(function ($img) {
                    return [
                        'id'         => $img->id,
                        'product_id' => $img->product_id,
                        'image'      => $img->image,
                        'is_main'    => (bool) $img->is_main,
                        'sort_order' => (int) ($img->sort_order ?? 0),
                        'status'     => (bool) ($img->status ?? true),
                        'created_at' => $img->created_at,
                        'updated_at' => $img->updated_at,
                    ];
                })->values() ?? collect();

                $main = $p->galleryMainImage ? [
                    'id'         => $p->galleryMainImage->id,
                    'product_id' => $p->galleryMainImage->product_id,
                    'image'      => $p->galleryMainImage->image,
                    'is_main'    => (bool) $p->galleryMainImage->is_main,
                    'sort_order' => (int) ($p->galleryMainImage->sort_order ?? 0),
                    'status'     => (bool) ($p->galleryMainImage->status ?? true),
                    'created_at' => $p->galleryMainImage->created_at,
                    'updated_at' => $p->galleryMainImage->updated_at,
                ] : null;

                return [
                    'id'          => $p->id,
                    'name'        => $p->name,
                    'slug'        => $p->slug,
                    'thumbnail'   => $p->thumbnail,
                    'description' => $p->description,

                    'price_base'  => $p->price_base,
                    'final_price' => $p->final_price,
                    'is_on_sale'  => $p->is_on_sale,

                    'stock'       => $p->inventory?->stock ?? 0,
                    'is_in_stock' => $p->is_in_stock,

                    'category_id' => $p->category_id,
                    'category'    => $p->category,
                    'images'             => $images,
                    'gallery_main_image' => $main,
                ];
            });
    }

    /**
     * ==========================================================
     * CLIENT – GET PRODUCT DETAIL BY SLUG
     * Nếu hết hàng → 404
     * ==========================================================
     */
    public function show($slug)
    {
        $product = Product::available()
            ->with([
                'category',
                'attributeValues.value.group',
                'campaignItems.campaign',
                'images',            
                'galleryMainImage',  
                'inventory',         
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        $images = $product->images?->map(function ($img) {
            return [
                'id'         => $img->id,
                'product_id' => $img->product_id,
                'image'      => $img->image,
                'is_main'    => (bool) $img->is_main,
                'sort_order' => (int) ($img->sort_order ?? 0),
                'status'     => (bool) ($img->status ?? true),
                'created_at' => $img->created_at,
                'updated_at' => $img->updated_at,
            ];
        })->values() ?? collect();

        $main = $product->galleryMainImage ? [
            'id'         => $product->galleryMainImage->id,
            'product_id' => $product->galleryMainImage->product_id,
            'image'      => $product->galleryMainImage->image,
            'is_main'    => (bool) $product->galleryMainImage->is_main,
            'sort_order' => (int) ($product->galleryMainImage->sort_order ?? 0),
            'status'     => (bool) ($product->galleryMainImage->status ?? true),
            'created_at' => $product->galleryMainImage->created_at,
            'updated_at' => $product->galleryMainImage->updated_at,
        ] : null;

        return [
            'id'          => $product->id,
            'name'        => $product->name,
            'slug'        => $product->slug,
            'thumbnail'   => $product->thumbnail,
            'description' => $product->description,
            'content'     => $product->content,

            'price_base'  => $product->price_base,
            'final_price' => $product->final_price,
            'is_on_sale'  => $product->is_on_sale,

            'stock'       => $product->inventory?->stock ?? 0,
            'is_in_stock' => $product->is_in_stock,

            'category_id' => $product->category_id,
            'category'    => $product->category,

            'attribute_values'   => $product->attributeValues,
            'attributes_grouped' => $product->attributesGrouped(),

            'images'             => $images,
            'gallery_main_image' => $main,
        ];
    }
}
