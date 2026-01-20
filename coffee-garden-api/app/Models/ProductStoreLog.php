<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Product;
use App\Models\User;

class ProductStoreLog extends Model
{
    protected $table = 'product_store_logs';

    protected $fillable = [
        'product_id',
        'qty_before',
        'qty_change',
        'qty_after',
        'price_root',
        'admin_id',
        'note',
    ];

    /* =======================
     | RELATIONS
     ======================= */

    /**
     * Sản phẩm liên quan
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Admin thao tác
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
