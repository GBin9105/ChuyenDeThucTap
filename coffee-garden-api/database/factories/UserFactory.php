<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'username' => $this->faker->unique()->userName(),
            'password' => Hash::make('123456'),
            'roles' => 'customer',
            'avatar' => null,
            'status' => 1,
        ];
    }
}
