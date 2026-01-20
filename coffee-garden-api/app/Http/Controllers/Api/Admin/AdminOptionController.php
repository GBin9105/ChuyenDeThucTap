<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\OptionRequest;
use App\Models\Option;

class AdminOptionController extends Controller
{
    public function index()
    {
        return Option::all();
    }

    public function store(OptionRequest $request)
    {
        $option = Option::create($request->validated());
        return response()->json($option);
    }

    public function show($id)
    {
        return Option::findOrFail($id);
    }

    public function update(OptionRequest $request, $id)
    {
        $option = Option::findOrFail($id);
        $option->update($request->validated());
        return response()->json($option);
    }

    public function destroy($id)
    {
        Option::destroy($id);
        return response()->json(['message' => 'Deleted successfully']);
    }
}
