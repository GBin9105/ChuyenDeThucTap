<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name'       => 'required|string|max:255',
            // slug không required → backend tự sinh
            'slug'       => 'nullable|string|max:255',
            'image'      => 'nullable|string',
            'parent_id'  => 'nullable|integer|exists:categories,id',
            'description'=> 'nullable|string',
            'sort_order' => 'nullable|integer',
            'status'     => 'nullable|integer',
        ];
    }
}
