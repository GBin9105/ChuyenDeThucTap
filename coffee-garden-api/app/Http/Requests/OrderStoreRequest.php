<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'required|string|max:255',
            'phone'           => 'required|string|max:20',
            'email'           => 'nullable|email|max:255',
            'address'         => 'nullable|string|max:500',
            'payment_method'  => 'required|in:vnpay,cod',
            'items'           => 'required|array|min:1',

            'items.*.product_id' => 'required|exists:products,id',
            'items.*.size_id'    => 'nullable|exists:sizes,id',
            'items.*.qty'        => 'required|integer|min:1',
            'items.*.price'      => 'required|numeric|min:0',
            'items.*.toppings'   => 'nullable|array',
            'items.*.options'    => 'nullable|array',
        ];
    }
}
