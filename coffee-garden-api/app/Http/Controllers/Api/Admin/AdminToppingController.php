<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ToppingRequest;
use App\Models\Topping;

class AdminToppingController extends Controller
{
    /**
     * GET /api/admin/toppings
     * Lấy danh sách topping
     */
    public function index()
    {
        return response()->json(
            Topping::orderBy('id', 'DESC')->get()
        );
    }

    /**
     * POST /api/admin/toppings
     * Tạo topping mới
     */
    public function store(ToppingRequest $request)
    {
        $topping = Topping::create($request->validated());

        return response()->json([
            'message' => 'Created successfully',
            'data'    => $topping
        ], 201);
    }

    /**
     * GET /api/admin/toppings/{id}
     * Lấy chi tiết topping
     */
    public function show($id)
    {
        $topping = Topping::findOrFail($id);

        return response()->json($topping);
    }

    /**
     * PUT /api/admin/toppings/{id}
     * Cập nhật topping
     */
    public function update(ToppingRequest $request, $id)
    {
        $topping = Topping::findOrFail($id);
        $topping->update($request->validated());

        return response()->json([
            'message' => 'Updated successfully',
            'data'    => $topping
        ]);
    }

    /**
     * DELETE /api/admin/toppings/{id}
     * Xóa topping
     */
    public function destroy($id)
    {
        $topping = Topping::findOrFail($id);
        $topping->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }
}
