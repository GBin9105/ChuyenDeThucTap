<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;

class BannerController extends Controller
{
    public function index()
    {
        return Banner::where('status',1)->get();
    }

    public function position($position)
    {
        return Banner::where('position',$position)->get();
    }
}
