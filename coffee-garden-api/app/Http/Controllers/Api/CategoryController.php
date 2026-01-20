<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    // ======================================
    // GET ALL ACTIVE CATEGORIES
    // ======================================
    public function index()
    {
        return Category::select('id', 'name', 'slug')
            ->where('status', 1)
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    // ======================================
    // GET ONE CATEGORY BY SLUG + PRODUCTS
    // ======================================
    public function show($slug)
    {
        $category = Category::where('slug', $slug)
            ->select('id', 'name', 'slug')
            ->firstOrFail();

        // Lấy sản phẩm thuộc danh mục này + load thumbnail
        $products = $category->products()
            ->select('id', 'name', 'slug', 'thumbnail', 'price_base', 'status')
            ->where('status', 1)
            ->orderByDesc('id')
            ->get();

        // Gắn vào category (tự động thành JSON)
        $category->products = $products;

        return $category;
    }
}
