<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Option;

class OptionSeeder extends Seeder
{
    public function run(): void
    {
        Option::insert([
            ['name' => 'Đường 0%', 'type' => 'sugar'],
            ['name' => 'Đường 50%', 'type' => 'sugar'],
            ['name' => 'Đường 100%', 'type' => 'sugar'],
            ['name' => 'Đá 0%', 'type' => 'ice'],
            ['name' => 'Đá 50%', 'type' => 'ice'],
            ['name' => 'Đá 100%', 'type' => 'ice'],
        ]);
    }
}
