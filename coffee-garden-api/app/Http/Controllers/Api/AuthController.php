<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * =========================
     * REGISTER (CLIENT)
     * =========================
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'username' => 'required|string|unique:users,username',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'username' => $validated['username'],
            'phone'    => $validated['phone'] ?? null,

            // ✅ User model đã có setPasswordAttribute -> tự hash nếu chưa hash
            // => không cần Hash::make ở đây (tránh double-hash)
            'password' => $validated['password'],

            'roles'    => 'user',
            'status'   => 1,
        ]);

        $token = $user->createToken('client_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng ký thành công!',
            'token'   => $token,
            'user'    => $user,
        ], 201);
    }

    /**
     * =========================
     * LOGIN (CLIENT – email hoặc username)
     * =========================
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginValue = $request->input('username');
        $password   = $request->input('password');

        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL)
            ? 'email'
            : 'username';

        $user = User::where($field, $loginValue)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'message' => 'Email/Username hoặc mật khẩu không đúng!'
            ], 422);
        }

        if ((int) $user->status !== 1) {
            return response()->json([
                'message' => 'Tài khoản đã bị khóa!'
            ], 403);
        }

        $token = $user->createToken('client_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng nhập thành công!',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    /**
     * =========================
     * GET CURRENT USER
     * GET /api/auth/me
     * =========================
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * =========================
     * UPDATE CURRENT USER PROFILE (+ CHANGE PASSWORD)
     * PUT /api/auth/me
     * =========================
     *
     * - Update profile: name/username/email/phone
     * - Change password: require current_password + password + password_confirmation
     */
    public function updateMe(Request $request)
    {
        $user = $request->user();

        // Nếu FE gửi password => bắt current_password
        $changingPassword = $request->filled('password');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'username' => [
                'required', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($user->id),
            ],

            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            // ✅ phone vẫn nullable
            'phone' => ['nullable', 'string', 'max:20'],

            'current_password' => [$changingPassword ? 'required' : 'nullable', 'string'],
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
        ]);

        if ($changingPassword) {
            $current = (string) ($validated['current_password'] ?? '');

            if (!Hash::check($current, $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Mật khẩu hiện tại không đúng.'],
                ]);
            }
        }

        $user->name     = $validated['name'];
        $user->username = $validated['username'];
        $user->email    = $validated['email'];

        /**
         * ✅ FIX QUAN TRỌNG:
         * Chỉ update phone khi FE có gửi field 'phone'
         * Nếu FE không gửi phone (ví dụ đổi mật khẩu), giữ nguyên phone hiện tại.
         */
        if ($request->has('phone')) {
            // cho phép set null nếu FE gửi phone = null / ""
            $user->phone = $validated['phone'] ?? null;
        }

        if ($changingPassword) {
            // ✅ User model tự hash -> không cần Hash::make
            $user->password = $validated['password'];
        }

        $user->save();

        return response()->json([
            'message' => $changingPassword
                ? 'Cập nhật profile & đổi mật khẩu thành công!'
                : 'Cập nhật profile thành công!',
            'user'    => $user,
        ]);
    }

    /**
     * =========================
     * LOGOUT
     * =========================
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Đăng xuất thành công!'
        ]);
    }
}
