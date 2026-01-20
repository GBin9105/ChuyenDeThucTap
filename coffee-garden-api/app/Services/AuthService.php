<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * REGISTER USER
     */
    public function register(array $data)
    {
        return User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'username' => $data['username'],
            'phone'    => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'roles'    => 'customer',
            'status'   => 1,
        ]);
    }

    /**
     * LOGIN (email OR username)
     */
    public function login(array $data)
    {
        // login = email OR username
        $user = User::where('email', $data['login'])
                    ->orWhere('username', $data['login'])
                    ->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return null;
        }

        // Create Sanctum token
        $token = $user->createToken('api_token')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * GET PROFILE
     */
    public function profile($user)
    {
        return $user;
    }

    /**
     * LOGOUT (delete all tokens)
     */
    public function logout($user)
    {
        $user->tokens()->delete();
        return true;
    }
}
