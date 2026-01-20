<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;

class PostController extends Controller
{
    /**
     * GET LIST BLOG POSTS (Client)
     *
     * Điều kiện:
     * - Chỉ lấy bài viết đã publish
     * - Chỉ lấy post_type = post
     * - Load kèm topic để FE filter / hiển thị
     *
     * URL: GET /api/posts
     */
    public function index()
    {
        $posts = Post::published()
            ->with('topic:id,name,slug')
            ->orderByDesc('id')
            ->get([
                'id',
                'title',
                'slug',
                'thumbnail',
                'description',
                'topic_id',
                'created_at',
            ]);

        return response()->json([
            'success' => true,
            'data'    => $posts,
        ]);
    }

    /**
     * GET POST DETAIL BY SLUG (Client)
     *
     * URL: GET /api/posts/{slug}
     */
    public function show(string $slug)
    {
        $post = Post::published()
            ->with('topic:id,name,slug')
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => $post,
        ]);
    }
}
