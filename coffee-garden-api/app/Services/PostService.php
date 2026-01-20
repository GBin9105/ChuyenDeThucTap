<?php

namespace App\Services;

use App\Models\Post;

class PostService
{
    public function all()
    {
        return Post::latest()->get();
    }

    public function findBySlug($slug)
    {
        return Post::where('slug', $slug)->firstOrFail();
    }

    public function create(array $data)
    {
        return Post::create($data);
    }

    public function update(Post $post, array $data)
    {
        $post->update($data);
        return $post;
    }

    public function delete(Post $post)
    {
        return $post->delete();
    }
}
