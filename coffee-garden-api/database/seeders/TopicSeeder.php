<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Topic;

class TopicSeeder extends Seeder
{
    public function run(): void
    {
        $topics = [
            'Coffee Tips',
            'Công thức pha chế',
            'Ưu đãi & sự kiện',
        ];

        foreach ($topics as $name) {
            Topic::create([
                'name' => $name,
                'slug' => Str::slug($name),
            ]);
        }
    }
}
