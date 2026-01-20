<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Product;
use App\Models\User;

class ProductStore extends Model
{
    use HasFactory;

    /**
     * Tên bảng (đúng theo migration)
     */
    protected $table = 'product_stores';

    /**
     * Các field cho phép ghi
     */
    protected $fillable = [
        'product_id',
        'cost_price',     // giá nhập tại thời điểm ghi nhận
        'qty_change',     // số lượng thay đổi (+/-)
        'stock_after',    // tồn kho sau cập nhật
        'type',           // import | sale | export | adjust | cancel
        'note',           // ghi chú
        'user_id',        // người thao tác
    ];

    /* =========================
     | RELATIONS
     ========================= */

    /**
     * Sản phẩm liên quan
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Người thao tác (admin / staff)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
