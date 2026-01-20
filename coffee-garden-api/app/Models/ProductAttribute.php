<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductAttribute extends Model
{
    protected $fillable = [
        'product_id',
        'attribute_id',   // VALUE ID (vd: Size M, Đá, 50% đường)
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * ----------------------------------------------------
     * VALUE (ví dụ: Size M, Sugar 50%)
     * ----------------------------------------------------
     */
    public function value()
    {
        return $this->belongsTo(Attribute::class, 'attribute_id')
            ->with('group');   // quan trọng: để FE có group mà không cần query thêm
    }

    /**
     * ----------------------------------------------------
     * GROUP của VALUE (ví dụ: Size, Đường, Topping)
     * Tự động lấy từ value->group
     * ----------------------------------------------------
     */
    public function getGroupAttribute()
    {
        return $this->value ? $this->value->group : null;
    }

    /**
     * ----------------------------------------------------
     * PRODUCT
     * ----------------------------------------------------
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
