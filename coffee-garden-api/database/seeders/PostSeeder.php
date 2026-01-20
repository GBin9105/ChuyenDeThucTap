<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Post;
use Illuminate\Support\Str;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        Post::insert([
            [
                'topic_id'   => 1,
                'title'      => 'Bí quyết pha cà phê ngon như barista',
                'slug'       => Str::slug('Bí quyết pha cà phê ngon như barista'),
                'thumbnail'  => 'post1.jpg',    // ✔ đúng field
                'description'=> 'Mẹo pha cà phê chuẩn hương vị barista.',
                'content'    => 'Nội dung bài viết...',
                'status'     => 1,
            ],
            [
                'topic_id'   => 3,
                'title'      => 'Khuyến mãi tháng này tại Coffee Garden',
                'slug'       => Str::slug('Khuyến mãi tháng này tại Coffee Garden'),
                'thumbnail'  => 'post2.jpg',
                'description'=> 'Nhiều ưu đãi hấp dẫn đang chờ bạn!',
                'content'    => 'Thông tin chi tiết...',
                'status'     => 1,
            ]
        ]);
    }
}
