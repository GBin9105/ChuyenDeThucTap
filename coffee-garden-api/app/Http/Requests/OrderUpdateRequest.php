<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'sometimes|string|max:255',
            'phone'           => 'sometimes|string|max:20',
            'email'           => 'sometimes|email',
            'address'         => 'sometimes|string|max:255',
            'payment_method'  => 'sometimes|in:vnpay,cod',
            'payment_status'  => 'sometimes|in:pending,success,failed',
            'total_price'     => 'sometimes|numeric|min:0',
            'status'          => 'sometimes|integer|min:0|max:5',
        ];
    }
}
