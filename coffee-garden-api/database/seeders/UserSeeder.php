<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@gmail.com',
            'phone' => '0900000000',
            'username' => 'admin',
            'password' => '1',  // sẽ tự động hash bởi Mutator trong Model
            'roles' => 'admin',
            'avatar' => null,
            'status' => 1,
        ]);

        User::factory()->count(10)->create();
    }
}
