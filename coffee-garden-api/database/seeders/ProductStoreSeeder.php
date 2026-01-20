<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductStore;

class ProductStoreSeeder extends Seeder
{
    public function run(): void
    {
        ProductStore::insert([
            ['product_id' => 1, 'qty' => 100],
            ['product_id' => 2, 'qty' => 80],
            ['product_id' => 3, 'qty' => 50],
        ]);
    }
}
