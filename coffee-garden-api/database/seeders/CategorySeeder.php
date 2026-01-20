<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Cà phê',      'slug' => 'ca-phe'],
            ['name' => 'Trà sữa',     'slug' => 'tra-sua'],
            ['name' => 'Đồ ăn nhẹ',   'slug' => 'do-an-nhe'],
            ['name' => 'Nước ép',     'slug' => 'nuoc-ep'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }
    }
}
