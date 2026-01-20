<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // User & Roles
            UserSeeder::class,

            // Product Catalog
            CategorySeeder::class,
            ProductSeeder::class,

            // Sizes - Toppings - Options
            SizeSeeder::class,
            ProductSizeSeeder::class,
            ToppingSeeder::class,
            ProductToppingSeeder::class,
            OptionSeeder::class,
            ProductOptionSeeder::class,

            // Blog
            TopicSeeder::class,
            PostSeeder::class,

            // UI
            BannerSeeder::class,
        ]);
    }
}
