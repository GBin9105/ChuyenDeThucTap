<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;

class MenuController extends Controller
{
    public function index($position)
    {
        return Menu::where('position',$position)
            ->where('status',1)
            ->orderBy('sort_order','asc')
            ->get();
    }
}
