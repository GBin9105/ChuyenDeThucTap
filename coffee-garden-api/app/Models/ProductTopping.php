<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductTopping extends Model
{
    protected $fillable = [
        'product_id',
        'topping_id',
        'price_extra',
    ];

    /**
     * Cast dữ liệu về đúng kiểu khi trả ra JSON
     */
    protected $casts = [
        'product_id'  => 'integer',
        'topping_id'  => 'integer',
        'price_extra' => 'float',
    ];

    /**
     * Mối quan hệ: Một record này thuộc về 1 product
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Mối quan hệ: Một record thuộc về 1 topping
     */
    public function topping()
    {
        return $this->belongsTo(Topping::class);
    }
}
