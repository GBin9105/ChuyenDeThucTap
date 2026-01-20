<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MenuRequest;
use App\Models\Menu;

class AdminMenuController extends Controller
{
    /**
     * Danh sách menu (đã sắp xếp đúng thứ tự)
     */
    public function index()
    {
        $menus = Menu::orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'message' => 'Menu list loaded successfully.',
            'data'    => $menus
        ]);
    }

    /**
     * Tạo menu mới
     */
    public function store(MenuRequest $request)
    {
        $menu = Menu::create($request->validated());

        return response()->json([
            'message' => 'Menu created successfully.',
            'data'    => $menu
        ], 201);
    }

    /**
     * Xem chi tiết menu
     */
    public function show($id)
    {
        $menu = Menu::find($id);

        if (!$menu) {
            return response()->json(['message' => 'Menu not found'], 404);
        }

        return response()->json([
            'message' => 'Menu loaded successfully.',
            'data'    => $menu
        ]);
    }

    /**
     * Cập nhật menu
     */
    public function update(MenuRequest $request, $id)
    {
        $menu = Menu::find($id);

        if (!$menu) {
            return response()->json(['message' => 'Menu not found'], 404);
        }

        // Prevent self-parent
        if ($request->parent_id == $id) {
            return response()->json([
                'message' => 'A menu cannot be its own parent.'
            ], 400);
        }

        $menu->update($request->validated());

        return response()->json([
            'message' => 'Menu updated successfully.',
            'data'    => $menu
        ]);
    }

    /**
     * Xóa menu, không cho xóa nếu có submenu
     */
    public function destroy($id)
    {
        $menu = Menu::find($id);

        if (!$menu) {
            return response()->json(['message' => 'Menu not found'], 404);
        }

        // Prevent delete if this menu has children
        $children = Menu::where('parent_id', $id)->count();

        if ($children > 0) {
            return response()->json([
                'message' => 'Cannot delete menu because it has submenu.'
            ], 400);
        }

        $menu->delete();

        return response()->json([
            'message' => 'Menu deleted successfully.'
        ]);
    }
}
