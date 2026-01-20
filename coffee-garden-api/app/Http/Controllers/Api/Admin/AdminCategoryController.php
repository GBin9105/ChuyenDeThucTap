<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Requests\CategoryRequest;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index()
    {
        return Category::all();
    }

    public function store(CategoryRequest $request)
    {
        $data = $request->validated();

        // Tự sinh slug
        $data['slug'] = Str::slug($data['name']);

        $category = Category::create($data);

        return response()->json($category);
    }

    public function show($id)
    {
        return Category::findOrFail($id);
    }

    public function update(CategoryRequest $request, $id)
    {
        $category = Category::findOrFail($id);

        $data = $request->validated();

        // Tự sinh slug mới nếu name thay đổi
        $data['slug'] = Str::slug($data['name']);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy($id)
    {
        Category::destroy($id);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
