<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductImageRequest extends FormRequest
{
    /**
     * =========================================================
     * AUTHORIZE
     * =========================================================
     * Đã nằm trong admin + middleware → cho phép
     */
    public function authorize(): bool
    {
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
             * PRODUCT
             * Bắt buộc tồn tại
             */
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            /**
             * IMAGE
             * - Cho phép URL hoặc relative path
             * - Không ép upload file
             * Ví dụ:
             *  - products/latte/1.jpg
             *  - https://cdn.domain.com/products/latte/1.jpg
             */
            'image' => [
                'required',
                'string',
                'max:2048',
            ],

            /**
             * IS MAIN IMAGE
             * true / false / 1 / 0 đều hợp lệ
             */
            'is_main' => [
                'nullable',
                'boolean',
            ],

            /**
             * SORT ORDER
             * Thứ tự hiển thị trong gallery
             */
            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            /**
             * STATUS
             * 1 = active
             * 0 = hidden
             */
            'status' => [
                'nullable',
                'integer',
                'in:0,1',
            ],
        ];
    }

    /**
     * =========================================================
     * SANITIZE / NORMALIZE DATA
     * =========================================================
     * Gán default để controller KHÔNG phải xử lý logic phụ
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_main'    => (bool) $this->input('is_main', false),
            'sort_order' => (int)  $this->input('sort_order', 0),
            'status'     => (int)  $this->input('status', 1),
        ]);
    }

    /**
     * =========================================================
     * CUSTOM MESSAGES
     * =========================================================
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Product không được để trống',
            'product_id.integer'  => 'Product không hợp lệ',
            'product_id.exists'   => 'Product không tồn tại',

            'image.required'      => 'Ảnh không được để trống',
            'image.string'        => 'Ảnh phải là đường dẫn hợp lệ',
            'image.max'           => 'Đường dẫn ảnh quá dài',

            'is_main.boolean'     => 'is_main chỉ nhận true hoặc false',

            'sort_order.integer'  => 'Thứ tự phải là số',
            'sort_order.min'      => 'Thứ tự phải lớn hơn hoặc bằng 0',

            'status.in'           => 'Status chỉ nhận 0 hoặc 1',
        ];
    }
}
