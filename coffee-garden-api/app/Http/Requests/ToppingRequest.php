<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ToppingRequest extends FormRequest
{
    /**
     * Cho phép request chạy (đã được middleware admin kiểm soát)
     */
    public function authorize()
    {
        return true;
    }

    /**
     * RULES cho Topping
     */
    public function rules()
    {
        return [
            'name'        => 'required|string|max:255',
            'price'       => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'status'      => 'nullable|integer|in:0,1', // 0 = ẩn, 1 = hiện
        ];
    }

    /**
     * Custom messages (tùy chọn nhưng đẹp hơn)
     */
    public function messages()
    {
        return [
            'name.required' => 'Tên topping không được để trống.',
            'name.max'      => 'Tên topping quá dài.',

            'price.required' => 'Giá topping không được để trống.',
            'price.numeric'  => 'Giá topping phải là số.',
            'price.min'      => 'Giá topping phải lớn hơn hoặc bằng 0.',

            'description.max' => 'Mô tả không được quá 1000 ký tự.',

            'status.in' => 'Trạng thái không hợp lệ.',
        ];
    }
}
