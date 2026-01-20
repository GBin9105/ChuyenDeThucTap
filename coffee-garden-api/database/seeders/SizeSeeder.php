<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Size;

class SizeSeeder extends Seeder
{
    public function run(): void
    {
        Size::insert([
            ['name' => 'S', 'price' => 0],
            ['name' => 'M', 'price' => 5000],
            ['name' => 'L', 'price' => 10000],
        ]);
    }
}
