<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{
    use HasFactory;

    protected $table = 'carts';

    protected $fillable = [
        'user_id',
        'product_id',
        'qty',
        'options',

        'attribute_value_ids',

        'size_name',
        'size_price_extra',
        'toppings',
        'attribute_values',

        'line_key',

        'unit_price',
        'extras_total',
        'line_total',
    ];

    protected $casts = [
        'options'             => 'array',
        'attribute_value_ids' => 'array',
        'toppings'            => 'array',
        'attribute_values'    => 'array',

        'size_price_extra' => 'decimal:2',
        'unit_price'       => 'decimal:2',
        'extras_total'     => 'decimal:2',
        'line_total'       => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
