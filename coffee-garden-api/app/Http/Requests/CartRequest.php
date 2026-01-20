<?php

namespace App\Http\Requests\Cart;

use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductAttribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CartRequest extends FormRequest
{
    public function authorize(): bool
    {
        // guest không được dùng cart
        return auth()->check();
    }

    public function rules(): array
    {
        $isStore = $this->isMethod('post');

        return [
            // POST: required, PATCH: optional (vì lấy từ route cart)
            'product_id' => $isStore
                ? ['required', 'integer', 'exists:products,id']
                : ['sometimes', 'integer', 'exists:products,id'],

            // POST: required, PATCH: nullable
            'qty' => $isStore
                ? ['required', 'integer', 'min:1', 'max:999']
                : ['sometimes', 'nullable', 'integer', 'min:1', 'max:999'],

            /**
             * options: key/value tùy biến (ice/sugar/note...)
             */
            'options'   => ['nullable', 'array'],
            'options.*' => ['nullable'],

            /**
             * Canonical: IDs của attribute VALUE
             * - chỉ nhận attributes.type = value
             * - kiểm tra thuộc product_attributes(active=1) sẽ làm ở withValidator()
             */
            'attribute_value_ids'   => ['nullable', 'array', 'max:30'],
            'attribute_value_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('attributes', 'id')->where(fn ($q) => $q->where('type', 'value')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Thiếu product_id',
            'product_id.integer'  => 'product_id không hợp lệ',
            'product_id.exists'   => 'Sản phẩm không tồn tại',

            'qty.required'        => 'Thiếu số lượng',
            'qty.integer'         => 'Số lượng không hợp lệ',
            'qty.min'             => 'Số lượng tối thiểu là 1',
            'qty.max'             => 'Số lượng tối đa là 999',

            'options.array'       => 'options phải là object/array',

            'attribute_value_ids.array'      => 'attribute_value_ids phải là mảng',
            'attribute_value_ids.max'        => 'attribute_value_ids tối đa 30 lựa chọn',
            'attribute_value_ids.*.integer'  => 'attribute_value_ids chứa phần tử không hợp lệ',
            'attribute_value_ids.*.distinct' => 'attribute_value_ids không được trùng',
            'attribute_value_ids.*.exists'   => 'Có attribute value không tồn tại hoặc không hợp lệ',
        ];
    }

    protected function prepareForValidation(): void
    {
        // qty: FE có thể gửi string
        if ($this->has('qty')) {
            $v = $this->input('qty');
            $this->merge(['qty' => is_numeric($v) ? (int) $v : $v]);
        }

        // options: nếu FE gửi string JSON
        if ($this->has('options') && is_string($this->input('options'))) {
            $decoded = json_decode($this->input('options'), true);
            if (is_array($decoded)) {
                $this->merge(['options' => $decoded]);
            }
        }

        // attribute_value_ids: normalize về int[], unique
        if ($this->has('attribute_value_ids')) {
            $raw = $this->input('attribute_value_ids');

            if (is_string($raw)) {
                $decoded = json_decode($raw, true);
                $raw = is_array($decoded) ? $decoded : $raw;
            }

            if (is_array($raw)) {
                $ids = array_values(array_unique(array_filter($raw, fn ($x) => is_numeric($x))));
                $ids = array_map('intval', $ids);
                $this->merge(['attribute_value_ids' => $ids]);
            }
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) return;

            // ===== Resolve productId =====
            $productId = $this->input('product_id');

            // PATCH thường không gửi product_id => lấy từ route('cart')
            if (!$productId && !$this->isMethod('post')) {
                $routeCart = $this->route('cart');

                if ($routeCart instanceof Cart) {
                    $productId = $routeCart->product_id;
                } elseif (is_numeric($routeCart)) {
                    $found = Cart::find((int)$routeCart);
                    $productId = $found?->product_id;
                }
            }

            if (!$productId) {
                $validator->errors()->add('product_id', 'Thiếu product_id');
                return;
            }

            $productId = (int) $productId;

            $product = Product::with(['inventory', 'campaignItems.campaign'])->find($productId);
            if (!$product) return; // exists:products,id đã chặn trước

            // Product phải active
            if ((int) $product->status !== 1) {
                $validator->errors()->add('product_id', 'Product is not available');
                return;
            }

            // ===== Stock theo inventory =====
            // PATCH: chỉ check nếu có gửi qty (sometimes)
            $qtyProvided = $this->has('qty');
            $qty = $qtyProvided ? (int) $this->input('qty') : null;

            if ($this->isMethod('post') || $qtyProvided) {
                $stock = (int) ($product->inventory?->stock ?? 0);

                // fallback nếu DB còn cột stock (trường hợp migrate cũ)
                $attrs = $product->getAttributes();
                if (array_key_exists('stock', $attrs)) {
                    $stock = (int) ($product->stock ?? $stock);
                }
                $stock = max(0, $stock);

                if ($qty !== null && $qty > $stock) {
                    $validator->errors()->add('qty', 'Not enough stock');
                    return;
                }
            }

            // ===== Validate attribute_value_ids thuộc product_attributes(active=1) =====
            $ids = $this->input('attribute_value_ids', []);
            if (is_array($ids) && count($ids) > 0) {
                $count = ProductAttribute::where('product_id', $productId)
                    ->where('active', 1)
                    ->whereIn('attribute_id', $ids)
                    ->count();

                if ($count !== count($ids)) {
                    $validator->errors()->add(
                        'attribute_value_ids',
                        'Some attribute values are not available for this product'
                    );
                    return;
                }
            }
        });
    }
}
