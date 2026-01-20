<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Support\Str;
use App\Http\Requests\PostRequest;

class AdminPostController extends Controller
{
    /**
     * Tạo slug an toàn (tránh trùng)
     */
    protected function generateSlug(string $title): string
    {
        $slug = Str::slug($title);
        $count = Post::where('slug', 'LIKE', "{$slug}%")->count();

        return $count ? "{$slug}-{$count}" : $slug;
    }

    /**
     * Danh sách bài viết (Admin)
     */
    public function index()
    {
        $posts = Post::with('topic')
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $posts
        ]);
    }

    /**
     * Chi tiết bài viết
     */
    public function show($id)
    {
        $post = Post::with('topic')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $post
        ]);
    }

    /**
     * Tạo bài viết
     */
    public function store(PostRequest $request)
    {
        $data = $request->validated();

        // Slug: chỉ tự sinh nếu không truyền
        $data['slug'] = $data['slug'] ?? $this->generateSlug($data['title']);

        // Default values (an toàn)
        $data['description'] = $data['description'] ?? '';
        $data['content']     = $data['content'] ?? '';
        $data['thumbnail']   = $data['thumbnail'] ?? null;
        $data['status']      = $data['status'] ?? 1;
        $data['post_type']   = $data['post_type'] ?? 'post';

        // Nếu sau này dùng auth
        // $data['user_id'] = auth()->id();

        $post = Post::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo bài viết thành công',
            'data' => $post
        ], 201);
    }

    /**
     * Cập nhật bài viết
     */
    public function update(PostRequest $request, $id)
    {
        $post = Post::findOrFail($id);
        $data = $request->validated();

        /**
         * QUY TẮC RẤT QUAN TRỌNG:
         * - KHÔNG tự đổi slug khi update
         * - Chỉ đổi slug nếu admin chủ động truyền slug
         */
        if (empty($data['slug'])) {
            unset($data['slug']);
        }

        // Không ghi đè thumbnail nếu không gửi
        if (!array_key_exists('thumbnail', $data)) {
            $data['thumbnail'] = $post->thumbnail;
        }

        $post->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bài viết thành công',
            'data' => $post
        ]);
    }

    /**
     * Xóa bài viết
     */
    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa bài viết thành công'
        ]);
    }
}
