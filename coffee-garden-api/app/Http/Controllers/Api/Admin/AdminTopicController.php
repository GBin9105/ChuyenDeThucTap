<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTopicController extends Controller
{
    /**
     * Generate slug an toàn (tránh trùng)
     */
    protected function generateSlug(string $name): string
    {
        $slug = Str::slug($name);
        $count = Topic::where('slug', 'LIKE', "{$slug}%")->count();

        return $count ? "{$slug}-{$count}" : $slug;
    }

    /**
     * Danh sách Topic (Admin)
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Topic::orderByDesc('id')->paginate(20)
        ]);
    }

    /**
     * Tạo Topic
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
            'status'      => 'nullable|integer',
        ]);

        $validated['slug']        = $this->generateSlug($validated['name']);
        $validated['description'] = $validated['description'] ?? '';
        $validated['sort_order']  = $validated['sort_order'] ?? 0;
        $validated['status']      = $validated['status'] ?? 1;

        $topic = Topic::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo chủ đề thành công',
            'data' => $topic
        ], 201);
    }

    /**
     * Chi tiết Topic
     */
    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => Topic::findOrFail($id)
        ]);
    }

    /**
     * Cập nhật Topic
     */
    public function update(Request $request, $id)
    {
        $topic = Topic::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
            'status'      => 'nullable|integer',
        ]);

        /**
         * QUY TẮC QUAN TRỌNG:
         * - KHÔNG tự đổi slug khi update
         * - Chỉ đổi slug nếu admin chủ động sửa (ở đây: KHÔNG cho sửa slug)
         */
        unset($validated['slug']);

        $validated['description'] = $validated['description'] ?? $topic->description;
        $validated['sort_order']  = $validated['sort_order'] ?? $topic->sort_order;
        $validated['status']      = $validated['status'] ?? $topic->status;

        $topic->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật chủ đề thành công',
            'data' => $topic
        ]);
    }

    /**
     * Xóa Topic
     */
    public function destroy($id)
    {
        $topic = Topic::findOrFail($id);

        // Không cho xóa nếu topic còn bài viết
        if ($topic->posts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa chủ đề đang có bài viết'
            ], 422);
        }

        $topic->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa chủ đề thành công'
        ]);
    }
}
