<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        Menu::insert([

            // ==========================
            // HEADER MENU
            // ==========================
            [
                'name'       => 'Trang chủ',
                'link'       => '/',
                'type'       => 'custom',
                'parent_id'  => 0,
                'sort_order' => 1,
                'table_id'   => null,
                'position'   => 'header',
                'status'     => 1,
            ],

            [
                'name'       => 'Sản phẩm',
                'link'       => '/products',
                'type'       => 'custom',
                'parent_id'  => 0,
                'sort_order' => 2,
                'table_id'   => null,
                'position'   => 'header',
                'status'     => 1,
            ],

            [
                'name'       => 'Tin tức',
                'link'       => '/posts',
                'type'       => 'custom',
                'parent_id'  => 0,
                'sort_order' => 3,
                'table_id'   => null,
                'position'   => 'header',
                'status'     => 1,
            ],

            // ==========================
            // FOOTER MENU
            // ==========================
            [
                'name'       => 'Liên hệ',
                'link'       => '/contact',
                'type'       => 'custom',
                'parent_id'  => 0,
                'sort_order' => 1,
                'table_id'   => null,
                'position'   => 'footer',
                'status'     => 1,
            ],

        ]);
    }
}
