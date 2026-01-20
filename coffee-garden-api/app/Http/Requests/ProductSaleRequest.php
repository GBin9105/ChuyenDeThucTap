<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Cho phép mọi request, đã có middleware admin kiểm soát
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:percent,fixed',

            // Nếu type = percent
            'percent' => 'required_if:type,percent|nullable|integer|min:1|max:100',

            // Nếu type = fixed
            'sale_price' => 'required_if:type,fixed|nullable|numeric|min:0',

            // Datetime
            'from_date' => 'required|date_format:Y-m-d H:i:s',
            'to_date'   => 'required|date_format:Y-m-d H:i:s|after:from_date',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Vui lòng chọn loại khuyến mãi.',
            'type.in'       => 'Loại sale không hợp lệ.',

            'percent.required_if' => 'Vui lòng nhập phần trăm giảm giá.',
            'percent.integer'     => 'Phần trăm giảm giá phải là số nguyên.',
            'percent.min'         => 'Phần trăm tối thiểu là 1%.',
            'percent.max'         => 'Phần trăm tối đa là 100%.',

            'sale_price.required_if' => 'Vui lòng nhập giá giảm cố định.',
            'sale_price.numeric'     => 'Giá giảm phải là số.',
            'sale_price.min'         => 'Giá giảm phải lớn hơn hoặc bằng 0.',

            'from_date.required'      => 'Vui lòng chọn thời gian bắt đầu.',
            'from_date.date_format'   => 'Định dạng ngày giờ không hợp lệ (Y-m-d H:i:s).',

            'to_date.required'        => 'Vui lòng chọn thời gian kết thúc.',
            'to_date.date_format'     => 'Định dạng ngày giờ không hợp lệ (Y-m-d H:i:s).',
            'to_date.after'           => 'Thời gian kết thúc phải sau thời gian bắt đầu.',
        ];
    }
}
