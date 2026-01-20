<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BannerRequest;
use App\Models\Banner;

class AdminBannerController extends Controller
{
    /**
     * Display a listing of the banners.
     */
    public function index()
    {
        $banners = Banner::orderBy('id', 'desc')->get();

        return response()->json([
            'message' => 'Banner list loaded successfully.',
            'data'    => $banners
        ]);
    }

    /**
     * Store a newly created banner.
     */
    public function store(BannerRequest $request)
    {
        $banner = Banner::create($request->validated());

        return response()->json([
            'message' => 'Banner created successfully.',
            'data'    => $banner
        ], 201);
    }

    /**
     * Display a specific banner.
     */
    public function show($id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], 404);
        }

        return response()->json([
            'message' => 'Banner loaded successfully.',
            'data'    => $banner
        ]);
    }

    /**
     * Update a banner.
     */
    public function update(BannerRequest $request, $id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], 404);
        }

        $banner->update($request->validated());

        return response()->json([
            'message' => 'Banner updated successfully.',
            'data'    => $banner
        ]);
    }

    /**
     * Remove a banner.
     */
    public function destroy($id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], 404);
        }

        $banner->delete();

        return response()->json([
            'message' => 'Banner deleted successfully.'
        ]);
    }
}
