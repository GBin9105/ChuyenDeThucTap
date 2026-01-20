<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Topic extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sort_order',
        'description',
        'status'
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'status'     => 'integer'
    ];

    /**
     * Một Topic có nhiều bài Post
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
