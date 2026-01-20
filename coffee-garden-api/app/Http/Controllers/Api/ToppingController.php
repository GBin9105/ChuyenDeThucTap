<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Topping;

class ToppingController extends Controller
{
    public function index()
    {
        return Topping::where('status', 1)->get();
    }

    public function productToppings($id)
    {
        return Product::findOrFail($id)->toppings()->get();
    }
}
