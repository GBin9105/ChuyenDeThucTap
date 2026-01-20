<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;

class OptionController extends Controller
{
    public function index()
    {
        return \App\Models\Option::all();
    }

    public function productOptions($id)
    {
        return Product::findOrFail($id)->options()->get();
    }
}
