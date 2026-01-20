<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Search by name, email, username
        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('username', 'like', "%$search%");
            });
        }

        return response()->json([
            'data' => $query->orderBy('id', 'desc')->paginate(10)
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email'    => 'required|email|unique:users',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:4',
            'roles'    => 'required|string',
            'status'   => 'required|integer',
            'avatar'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create($request->all());

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $user
        ], 201);
    }

    public function show($id)
    {
        return response()->json(['data' => User::findOrFail($id)]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'username' => "required|string|max:255|unique:users,username,$id",
            'email'    => "required|email|unique:users,email,$id",
            'phone'    => 'nullable|string|max:20',
            'password' => 'nullable|string|min:4',
            'roles'    => 'required|string',
            'status'   => 'required|integer',
            'avatar'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // giữ nguyên password nếu không nhập
        if (!$request->password) {
            $request->merge(['password' => $user->password]);
        }

        $user->update($request->all());

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // ❗ Không cho phép xoá chính mình
        if (auth()->id() == $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.'
            ], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
