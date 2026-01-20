<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Topic;

class TopicController extends Controller
{
    /**
     * GET /api/topics
     * - Chỉ lấy topic đang active
     * - Dùng cho FE Blog (menu / filter)
     * - Không lộ dữ liệu admin
     */
    public function index()
    {
        $topics = Topic::where('status', 1)
            ->orderBy('sort_order')
            ->get([
                'id',
                'name',
                'slug',
            ]);

        return response()->json([
            'success' => true,
            'data' => $topics
        ]);
    }
}
