<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Banner;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $banners = [
            [
                'name' => 'Giảm giá 50% tuần lễ vàng',
                'image' => 'banner1.jpg',
                'link' => '#',
                'position' => 'slideshow',
                'sort_order' => 1,
                'description' => 'Ưu đãi lớn trong tuần lễ vàng',
                'status' => 1,
            ],
            [
                'name' => 'Món mới: Trà sữa kem cheese',
                'image' => 'banner2.jpg',
                'link' => '#',
                'position' => 'slideshow',
                'sort_order' => 2,
                'description' => 'Sản phẩm mới ra mắt trong tháng này',
                'status' => 1,
            ],
            [
                'name' => 'Quảng cáo đối tác',
                'image' => 'banner_ads1.jpg',
                'link' => 'https://example.com',
                'position' => 'ads',
                'sort_order' => 1,
                'description' => 'Banner quảng cáo',
                'status' => 1,
            ]
        ];

        foreach ($banners as $banner) {
            Banner::create($banner);
        }
    }
}
