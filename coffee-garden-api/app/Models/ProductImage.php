<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use HasFactory;

    /**
     * =========================================================
     * TABLE (OPTIONAL – RÕ RÀNG)
     * =========================================================
     */
    protected $table = 'product_images';

    /**
     * =========================================================
     * MASS ASSIGNMENT
     * =========================================================
     */
    protected $fillable = [
        'product_id',
        'image',       // relative path hoặc full URL
        'is_main',     // ảnh nổi bật trong gallery
        'sort_order',  // thứ tự hiển thị
        'status',      // active / hidden
    ];

    /**
     * =========================================================
     * CASTS
     * =========================================================
     */
    protected $casts = [
        'is_main' => 'boolean',
        'status'  => 'boolean',
    ];

    /*--------------------------------------------------------------
     | RELATIONS
    --------------------------------------------------------------*/

    /**
     * Product sở hữu image này
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /*--------------------------------------------------------------
     | SCOPES (OPTIONAL – DÙNG KHI CẦN)
    --------------------------------------------------------------*/

    /**
     * Chỉ lấy image active
     */
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    /**
     * Chỉ lấy image main trong gallery
     */
    public function scopeMain($query)
    {
        return $query->where('is_main', 1);
    }
}
