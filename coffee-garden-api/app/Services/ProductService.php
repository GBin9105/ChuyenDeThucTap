<?php

namespace App\Services;

use App\Models\Product;

class ProductService
{
    public function all()
    {
        return Product::with(['images', 'sizes', 'toppings'])->get();
    }

    public function findBySlug($slug)
    {
        return Product::where('slug', $slug)->with(['images', 'sizes', 'toppings'])->firstOrFail();
    }

    public function create(array $data)
    {
        return Product::create($data);
    }

    public function update(Product $product, array $data)
    {
        $product->update($data);
        return $product;
    }

    public function delete(Product $product)
    {
        return $product->delete();
    }
}
