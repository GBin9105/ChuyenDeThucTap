<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attribute extends Model
{
    protected $fillable = [
        'parent_id',     // null => group, number => value of group
        'name',          // tên group hoặc tên value
        'type',          // group | value
        'price_extra',   // giá cố định của value
    ];

    protected $casts = [
        'parent_id'   => 'integer',
        'price_extra' => 'integer',
    ];

    /**
     * ----------------------------------------------------
     * GROUP → VALUES
     * Ví dụ: Size → [S, M, L]
     * ----------------------------------------------------
     */
    public function values()
    {
        return $this->hasMany(Attribute::class, 'parent_id')
            ->where('type', 'value')
            ->orderBy('id', 'ASC');
    }

    /**
     * ----------------------------------------------------
     * VALUE → GROUP
     * Ví dụ: "L" → nhóm "Size"
     * ----------------------------------------------------
     */
    public function group()
    {
        return $this->belongsTo(Attribute::class, 'parent_id')
            ->where('type', 'group');
    }

    /**
     * ----------------------------------------------------
     * VALUE xuất hiện trong những ProductAttribute nào
     * ----------------------------------------------------
     */
    public function productAttributes()
    {
        return $this->hasMany(ProductAttribute::class, 'attribute_id');
    }
}
