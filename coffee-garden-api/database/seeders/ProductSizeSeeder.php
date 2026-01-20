<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductSize;

class ProductSizeSeeder extends Seeder
{
    public function run(): void
    {
        ProductSize::insert([
            ['product_id' => 1, 'size_id' => 1, 'price_extra' => 0],
            ['product_id' => 1, 'size_id' => 2, 'price_extra' => 5000],
            ['product_id' => 1, 'size_id' => 3, 'price_extra' => 10000],

            ['product_id' => 2, 'size_id' => 1, 'price_extra' => 0],
            ['product_id' => 3, 'size_id' => 1, 'price_extra' => 0],
        ]);
    }
}
