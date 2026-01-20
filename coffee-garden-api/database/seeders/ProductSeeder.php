<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'category_id' => 1,
                'name' => 'Cà phê sữa đá',
                'thumbnail' => 'coffee-sua-da.jpg',
                'content' => 'Công thức đặc biệt với vị đậm đà.',
                'description' => 'Cà phê truyền thống Việt Nam',
                'price_base' => 30000,
            ],
            [
                'category_id' => 2,
                'name' => 'Trà sữa trân châu',
                'thumbnail' => 'trasua-tranchau.jpg',
                'content' => 'Trà sữa Đài Loan thơm béo.',
                'description' => 'Món được yêu thích nhất',
                'price_base' => 25000,
            ],
            [
                'category_id' => 4,
                'name' => 'Nước ép cam tươi',
                'thumbnail' => 'nuoc-ep-cam.jpg',
                'content' => 'Nước ép cam 100% nguyên chất.',
                'description' => 'Tăng sức đề kháng',
                'price_base' => 40000,
            ],
        ];

        foreach ($products as $p) {
            Product::create([
                'category_id' => $p['category_id'],
                'name' => $p['name'],
                'slug' => Str::slug($p['name']),
                'thumbnail' => $p['thumbnail'],
                'content' => $p['content'],
                'description' => $p['description'],
                'price_base' => $p['price_base'],
                'status' => 1,
            ]);
        }
    }
}
