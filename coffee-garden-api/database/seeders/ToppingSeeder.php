<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Topping;

class ToppingSeeder extends Seeder
{
    public function run(): void
    {
        Topping::insert([
            ['name' => 'Trân châu', 'price' => 5000],
            ['name' => 'Kem cheese', 'price' => 10000],
            ['name' => 'Thạch trái cây', 'price' => 7000],
        ]);
    }
}
