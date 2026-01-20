<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Topping extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'status'
    ];

    protected $casts = [
        'price'  => 'float',
        'status' => 'integer'
    ];

    /**
     * Quan hệ: Một topping có thể thuộc nhiều product
     * nhưng vì bạn đang dùng bảng trung gian product_toppings (1 product – nhiều topping với price_extra),
     * bạn không nên dùng belongsToMany mà dùng hasMany tới ProductTopping.
     */
    public function productToppings()
    {
        return $this->hasMany(ProductTopping::class);
    }

    /**
     * Quan hệ: Lấy danh sách product thông qua bảng product_toppings
     * → Nếu bạn vẫn cần danh sách Product, có thể dùng hasManyThrough.
     */
    public function products()
    {
        return $this->hasManyThrough(
            Product::class,
            ProductTopping::class,
            'topping_id',   // khóa ngoại ở bảng product_toppings
            'id',           // khóa chính của bảng products
            'id',           // khóa chính của bảng toppings
            'product_id'    // khóa ngoại product_id ở bảng product_toppings
        );
    }
}
