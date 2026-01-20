<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaleCampaignRequest extends FormRequest
{
    /**
     * =========================================================
     * AUTHORIZE
     * =========================================================
     */
    public function authorize(): bool
    {
        // Đã được bảo vệ bởi middleware auth + is_admin
        return true;
    }

    /**
     * =========================================================
     * RULES
     * =========================================================
     */
    public function rules(): array
    {
        return [
            /**
             * =====================================================
             * BASIC INFO
             * =====================================================
             */
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            /**
             * =====================================================
             * TIME RANGE
             * =====================================================
             */
            'from_date' => [
                'required',
                'date',
            ],

            'to_date' => [
                'required',
                'date',
                'after:from_date',
            ],
        ];
    }

    /**
     * =========================================================
     * MESSAGES
     * =========================================================
     */
    public function messages(): array
    {
        return [
            // name
            'name.required' => 'Tên chiến dịch không được bỏ trống',
            'name.string'   => 'Tên chiến dịch phải là chuỗi ký tự',
            'name.max'      => 'Tên chiến dịch tối đa 255 ký tự',

            // description
            'description.string' => 'Mô tả chiến dịch không hợp lệ',

            // from_date
            'from_date.required' => 'Ngày bắt đầu không được bỏ trống',
            'from_date.date'     => 'Ngày bắt đầu không hợp lệ',

            // to_date
            'to_date.required' => 'Ngày kết thúc không được bỏ trống',
            'to_date.date'     => 'Ngày kết thúc không hợp lệ',
            'to_date.after'    => 'Ngày kết thúc phải sau ngày bắt đầu',
        ];
    }
}
