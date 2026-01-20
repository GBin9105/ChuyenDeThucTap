<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Size extends Model
{
    protected $fillable = [
        'name',
        'description'
    ];

    /**
     * Cast khi trả về API
     */
    protected $casts = [
        'name'        => 'string',
        'description' => 'string',
    ];

    /**
     * Một size có thể được sử dụng bởi nhiều sản phẩm
     * (thông qua bảng product_sizes)
     */
    public function productSizes()
    {
        return $this->hasMany(ProductSize::class);
    }
}
