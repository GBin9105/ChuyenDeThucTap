<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // guest không được checkout
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'phone'          => ['required', 'string', 'max:30'],
            'email'          => ['nullable', 'email', 'max:255'],
            'address'        => ['nullable', 'string', 'max:255'],
            'note'           => ['nullable', 'string', 'max:2000'],

            // VNPay demo sandbox / COD
            'payment_method' => ['required', 'in:vnpay,cod'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Vui lòng nhập tên người nhận',
            'phone.required'          => 'Vui lòng nhập số điện thoại',
            'email.email'             => 'Email không hợp lệ',
            'payment_method.required' => 'Vui lòng chọn phương thức thanh toán',
            'payment_method.in'       => 'payment_method chỉ nhận vnpay hoặc cod',
        ];
    }

    protected function prepareForValidation(): void
    {
        // trim để tránh lỗi nhập khoảng trắng
        $this->merge([
            'name'    => is_string($this->name) ? trim($this->name) : $this->name,
            'phone'   => is_string($this->phone) ? trim($this->phone) : $this->phone,
            'email'   => is_string($this->email) ? trim($this->email) : $this->email,
            'address' => is_string($this->address) ? trim($this->address) : $this->address,
        ]);
    }
}
