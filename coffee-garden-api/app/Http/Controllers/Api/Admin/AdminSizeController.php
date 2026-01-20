<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SizeRequest;
use App\Models\Size;

class AdminSizeController extends Controller
{
    /**
     * GET /api/admin/sizes
     * Lấy danh sách size
     */
    public function index()
    {
        return response()->json(
            Size::orderBy('id', 'DESC')->get()
        );
    }

    /**
     * POST /api/admin/sizes
     * Tạo size mới
     */
    public function store(SizeRequest $request)
    {
        $size = Size::create($request->validated());

        return response()->json([
            'message' => 'Created successfully',
            'data'    => $size
        ], 201);
    }

    /**
     * GET /api/admin/sizes/{id}
     * Lấy 1 size theo ID
     */
    public function show($id)
    {
        $size = Size::findOrFail($id);

        return response()->json($size);
    }

    /**
     * PUT /api/admin/sizes/{id}
     * Cập nhật size
     */
    public function update(SizeRequest $request, $id)
    {
        $size = Size::findOrFail($id);
        $size->update($request->validated());

        return response()->json([
            'message' => 'Updated successfully',
            'data'    => $size
        ]);
    }

    /**
     * DELETE /api/admin/sizes/{id}
     * Xóa size
     */
    public function destroy($id)
    {
        $item = Size::findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }
}
