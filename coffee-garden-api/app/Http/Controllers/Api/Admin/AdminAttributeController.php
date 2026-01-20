<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use Illuminate\Http\Request;

class AdminAttributeController extends Controller
{
    /**
     * GET /api/admin/attributes
     */
    public function index()
    {
        $groups = Attribute::where('type', 'group')
            ->with('values')
            ->orderBy('id', 'DESC')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $groups
        ]);
    }

    /**
     * GET /api/admin/attributes/{id}
     */
    public function show($id)
    {
        $group = Attribute::where('type', 'group')
            ->with('values')
            ->findOrFail($id);

        return response()->json([
            'status' => true,
            'data'   => $group
        ]);
    }

    /**
     * POST /api/admin/attributes
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255'
        ]);

        $normalized = strtolower(trim($request->name));

        if (Attribute::where('type', 'group')
            ->whereRaw('LOWER(name) = ?', [$normalized])
            ->exists()
        ) {
            return response()->json([
                'status'  => false,
                'message' => 'Tên nhóm thuộc tính đã tồn tại!'
            ], 422);
        }

        $group = Attribute::create([
            'name'        => $request->name,
            'type'        => 'group',
            'parent_id'   => null,
            'price_extra' => 0
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Group created',
            'data'    => $group
        ], 201);
    }

    /**
     * PUT /api/admin/attributes/{id}
     */
    public function update(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $normalized = strtolower(trim($request->name));

        if (Attribute::where('type', 'group')
            ->whereRaw('LOWER(name) = ?', [$normalized])
            ->where('id', '!=', $id)
            ->exists()
        ) {
            return response()->json([
                'status'  => false,
                'message' => 'Tên nhóm thuộc tính đã tồn tại!'
            ], 422);
        }

        $group = Attribute::where('type', 'group')->findOrFail($id);
        $group->update(['name' => $request->name]);

        return response()->json([
            'status'  => true,
            'message' => 'Group updated',
            'data'    => $group
        ]);
    }

    /**
     * POST /api/admin/attributes/{group_id}/value
     * THÊM VALUE + EXTRA PRICE
     */
    public function addValue(Request $request, $group_id)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'price_extra' => 'nullable|integer|min:0'
        ]);

        $group = Attribute::where('type', 'group')->findOrFail($group_id);

        $normalized = strtolower(trim($request->name));

        if (Attribute::where('type', 'value')
            ->where('parent_id', $group_id)
            ->whereRaw('LOWER(name) = ?', [$normalized])
            ->exists()
        ) {
            return response()->json([
                'status'  => false,
                'message' => 'Giá trị này đã tồn tại trong nhóm!'
            ], 422);
        }

        $value = Attribute::create([
            'name'        => $request->name,
            'type'        => 'value',
            'parent_id'   => $group_id,
            'price_extra' => $request->price_extra ?? 0
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Value added',
            'data'    => $value
        ]);
    }

    /**
     * PUT /api/admin/attributes/value/{id}
     * UPDATE VALUE + EXTRA PRICE
     */
    public function updateValue(Request $request, $id)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'price_extra' => 'nullable|integer|min:0'
        ]);

        $value = Attribute::where('type', 'value')->findOrFail($id);

        $normalized = strtolower(trim($request->name));

        if (Attribute::where('type', 'value')
            ->where('parent_id', $value->parent_id)
            ->whereRaw('LOWER(name) = ?', [$normalized])
            ->where('id', '!=', $id)
            ->exists()
        ) {
            return response()->json([
                'status'  => false,
                'message' => 'Giá trị này đã tồn tại!'
            ], 422);
        }

        $value->update([
            'name'        => $request->name,
            'price_extra' => $request->price_extra ?? 0
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Value updated',
            'data'    => $value
        ]);
    }

    /**
     * DELETE VALUE
     */
    public function deleteValue($id)
    {
        $value = Attribute::where('type', 'value')->findOrFail($id);
        $value->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Value deleted'
        ]);
    }

    /**
     * DELETE GROUP
     */
    public function destroy($id)
    {
        $group = Attribute::where('type', 'group')->findOrFail($id);
        $group->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Group deleted'
        ]);
    }
}
