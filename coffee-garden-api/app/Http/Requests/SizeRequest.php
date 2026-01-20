<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SizeRequest extends FormRequest
{
    /**
     * Cho phép request (đã được middleware admin kiểm soát)
     */
    public function authorize()
    {
        return true;
    }

    /**
     * RULES cho Size
     */
    public function rules()
    {
        return [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',

            // status: 1 = hiển thị, 0 = ẩn
            'status'      => 'nullable|integer|in:0,1'
        ];
    }

    /**
     * Thông báo lỗi đẹp hơn
     */
    public function messages()
    {
        return [
            'name.required' => 'Tên size không được để trống.',
            'name.max'      => 'Tên size quá dài.',

            'description.max' => 'Mô tả không được quá 1000 ký tự.',

            'status.in' => 'Trạng thái không hợp lệ.',
        ];
    }
}
