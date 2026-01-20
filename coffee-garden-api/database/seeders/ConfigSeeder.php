<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Config;

class ConfigSeeder extends Seeder
{
    public function run(): void
    {
        Config::create([
            'site_name' => 'Coffee Garden',
            'email' => 'contact@coffeegarden.com',
            'phone' => '0900 123 456',
            'address' => '123 Nguyễn Văn Cừ, TP.HCM',
        ]);
    }
}
