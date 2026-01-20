<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderDetail extends Model
{
    use HasFactory;

    protected $table = 'order_details';

    protected $fillable = [
        'order_id',
        'product_id',

        // snapshot product
        'product_name',
        'product_slug',
        'product_thumbnail',

        // size snapshot (legacy + snapshot theo attribute size)
        'size_id',
        'size_name',
        'size_price_extra',

        // trace cấu hình chuẩn cart hiện tại
        'attribute_value_ids',

        'qty',

        // config snapshot
        'options',
        'toppings',
        'attribute_values',

        'line_key',

        // pricing snapshot
        'unit_price',
        'extras_total',
        'line_total',
    ];

    protected $casts = [
        'order_id'            => 'integer',
        'product_id'          => 'integer',
        'size_id'             => 'integer',

        'options'             => 'array',
        'toppings'            => 'array',
        'attribute_values'    => 'array',
        'attribute_value_ids' => 'array',

        'qty'                 => 'integer',

        // tiền tệ: tránh float
        'size_price_extra'    => 'decimal:2',
        'unit_price'          => 'decimal:2',
        'extras_total'        => 'decimal:2',
        'line_total'          => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Nếu bạn còn bảng sizes + Size model (legacy) thì giữ.
     * Nếu đã bỏ sizes hoàn toàn, hãy xoá method này + bỏ FK size_id trong migrate.
     */
    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class, 'size_id');
    }
}
