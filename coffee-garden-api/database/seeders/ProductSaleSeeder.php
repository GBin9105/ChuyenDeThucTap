<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductSale;

class ProductSaleSeeder extends Seeder
{
    public function run(): void
    {
        ProductSale::insert([
            [
                'product_id' => 1,
                'price_sale' => 25000,
                'date_begin' => now(),
                'date_end' => now()->addDays(7),
            ]
        ]);
    }
}
