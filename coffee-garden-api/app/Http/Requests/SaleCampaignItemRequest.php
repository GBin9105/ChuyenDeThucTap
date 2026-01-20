<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaleCampaignItemRequest extends FormRequest
{
    /**
     * =========================================================
     * AUTHORIZE
     * =========================================================
     */
    public function authorize(): bool
    {
        // Đã có middleware is_admin
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
             * TYPE
             *
             * percent       : giảm theo %
             * fixed_amount  : giảm tiền cố định (TRỪ TIỀN)
             * fixed_price   : đồng giá (SET GIÁ BÁN CUỐI)
             * =====================================================
             */
            'type' => [
                'required',
                Rule::in([
                    'percent',
                    'fixed_amount',
                    'fixed_price',
                ]),
            ],

            /**
             * =====================================================
             * SALE THEO %
             * =====================================================
             */
            'percent' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
                Rule::requiredIf(
                    fn () => $this->input('type') === 'percent'
                ),
            ],

            /**
             * =====================================================
             * SALE PRICE
             *
             * fixed_amount : số tiền bị trừ
             * fixed_price  : giá bán cuối cùng
             * =====================================================
             */
            'sale_price' => [
                'nullable',
                'numeric',
                'min:1',
                Rule::requiredIf(
                    fn () => in_array(
                        $this->input('type'),
                        ['fixed_amount', 'fixed_price'],
                        true
                    )
                ),
            ],

            /**
             * =====================================================
             * PRODUCTS
             * =====================================================
             */
            'products' => [
                'required',
                'array',
                'min:1',
            ],

            'products.*.id' => [
                'required',
                'integer',
                'exists:products,id',
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
            // type
            'type.required' => 'Vui lòng chọn kiểu giảm giá',
            'type.in'       => 'Kiểu giảm giá không hợp lệ',

            // percent
            'percent.required' => 'Vui lòng nhập % giảm',
            'percent.integer'  => 'Giảm % phải là số nguyên',
            'percent.min'      => 'Giảm % phải lớn hơn 0',
            'percent.max'      => 'Giảm % không được vượt quá 100',

            // fixed_amount & fixed_price
            'sale_price.required' => 'Vui lòng nhập giá trị giảm / giá bán',
            'sale_price.numeric'  => 'Giá trị phải là số',
            'sale_price.min'      => 'Giá trị phải lớn hơn 0',

            // products
            'products.required' => 'Vui lòng chọn ít nhất 1 sản phẩm',
            'products.array'    => 'Danh sách sản phẩm không hợp lệ',
            'products.min'      => 'Phải chọn ít nhất 1 sản phẩm',

            'products.*.id.required' => 'ID sản phẩm không được bỏ trống',
            'products.*.id.integer'  => 'ID sản phẩm phải là số',
            'products.*.id.exists'   => 'Sản phẩm không tồn tại',
        ];
    }
}
