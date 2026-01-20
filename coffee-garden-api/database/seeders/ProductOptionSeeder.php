<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductOption;

class ProductOptionSeeder extends Seeder
{
    public function run(): void
    {
        ProductOption::insert([
            ['product_id' => 1, 'option_id' => 1],
            ['product_id' => 1, 'option_id' => 2],
            ['product_id' => 2, 'option_id' => 2],
            ['product_id' => 2, 'option_id' => 3],
        ]);
    }
}
