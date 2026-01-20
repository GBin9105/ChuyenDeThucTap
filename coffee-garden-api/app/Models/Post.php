<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    /**
     * Các field được phép ghi mass-assignment
     */
    protected $fillable = [
        'title',
        'slug',
        'thumbnail',     // ảnh đại diện bài viết
        'description',   // mô tả ngắn (excerpt)
        'content',       // nội dung chi tiết
        'topic_id',      // chủ đề blog
        'post_type',     // post | page
        'status',        // 1 = publish, 0 = draft
        'user_id',       // tác giả (nullable)
    ];

    /**
     * Cast kiểu dữ liệu
     */
    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Một bài viết thuộc về một chủ đề
     */
    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * Một bài viết thuộc về một người dùng (tác giả)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: chỉ lấy bài viết blog đã publish
     * Dùng cho FE
     */
    public function scopePublished($query)
    {
        return $query->where('status', 1)
                     ->where('post_type', 'post');
    }

    /**
     * Scope: chỉ lấy page (About, Policy, ...)
     */
    public function scopePage($query)
    {
        return $query->where('post_type', 'page');
    }
}
