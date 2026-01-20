<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductTopping;

class ProductToppingSeeder extends Seeder
{
    public function run(): void
    {
        ProductTopping::insert([
            ['product_id' => 2, 'topping_id' => 1, 'price_extra' => 5000], // trân châu
            ['product_id' => 2, 'topping_id' => 2, 'price_extra' => 8000], // kem cheese
        ]);
    }
}
