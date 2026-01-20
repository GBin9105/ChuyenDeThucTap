<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSize extends Model
{
    protected $fillable = [
        'product_id',
        'size_id',
        'price_extra',
    ];

    /**
     * Cast kiểu dữ liệu đảm bảo trả ra số chuẩn
     */
    protected $casts = [
        'product_id' => 'integer',
        'size_id'    => 'integer',
        'price_extra'=> 'float',
    ];

    /**
     * Mối quan hệ: Một size-extra thuộc về một sản phẩm
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Mối quan hệ: ProductSize thuộc về Size (bảng sizes)
     */
    public function size()
    {
        return $this->belongsTo(Size::class);
    }
}
