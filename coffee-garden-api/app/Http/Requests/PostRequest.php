<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [

            // ===== BASIC =====
            'title' => 'required|string|max:255',
            'slug'  => 'nullable|string|max:255',

            // ===== THUMBNAIL =====
            // - required khi CREATE
            // - optional khi UPDATE
            'thumbnail' => $this->isMethod('post')
                ? 'required|string|max:255'
                : 'nullable|string|max:255',

            // ===== CONTENT =====
            'description' => 'nullable|string',
            'content'     => 'nullable|string',

            // ===== TOPIC =====
            // required khi CREATE, optional khi UPDATE
            'topic_id' => $this->isMethod('post')
                ? 'required|exists:topics,id'
                : 'nullable|exists:topics,id',

            // ===== STATUS =====
            // 0 = draft, 1 = publish
            'status' => 'nullable|in:0,1',

            // ===== POST TYPE =====
            // post = blog, page = static page
            'post_type' => 'nullable|in:post,page',
        ];
    }
}
