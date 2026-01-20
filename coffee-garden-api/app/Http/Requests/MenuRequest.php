<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Menu;

class MenuRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Cho phép admin thực hiện request
    }

    public function rules()
    {
        $id = $this->route('id') ?? null; // Lấy ID khi update

        return [
            // NAME
            'name'       => 'required|string|max:255',

            // LINK (có thể null, nhưng nếu có phải là string)
            'link'       => 'nullable|string|max:255',

            // TYPE (optional: custom, category, product…)
            'type'       => 'nullable|string|max:50',

            // PARENT ID
            'parent_id'  => [
                'nullable',
                'integer',
                Rule::notIn([$id]), // Không cho chọn chính nó làm cha
                Rule::exists('menus', 'id'), // Cha phải tồn tại
            ],

            // SORT ORDER
            'sort_order' => 'nullable|integer|min:0',

            // POSITION (header, footer, sidebar, mobile…)
            'position'   => 'nullable|string|max:50',

            // STATUS (0 = hidden, 1 = active)
            'status'     => 'nullable|integer|in:0,1',
        ];
    }

    public function messages()
    {
        return [
            'name.required'      => 'Tên menu là bắt buộc.',
            'parent_id.not_in'   => 'Menu không thể tự làm cha của chính nó.',
            'parent_id.exists'   => 'Menu cha không tồn tại.',
            'sort_order.min'     => 'Sort order không thể nhỏ hơn 0.',
            'status.in'          => 'Status phải là 0 hoặc 1.',
        ];
    }
}
