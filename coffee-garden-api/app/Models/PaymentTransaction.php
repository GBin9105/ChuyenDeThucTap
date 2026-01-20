<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $table = 'payment_transactions';

    /**
     * Fillable để dùng create()/update() an toàn.
     */
    protected $fillable = [
        'user_id',
        'order_id',

        'vnp_TxnRef',
        'vnp_Amount',
        'vnp_TransactionNo',
        'vnp_ResponseCode',
        'vnp_TransactionStatus',
        'vnp_BankCode',
        'vnp_PayDate',

        'status',

        // snapshot receiver + cart totals/snapshot
        'name',
        'phone',
        'email',
        'address',
        'note',
        'cart_totals',
        'cart_snapshot',

        // audit
        'payload',
        'vnp_SecureHash',
        'is_verified',
    ];

    protected $casts = [
        'user_id'       => 'integer',
        'order_id'      => 'integer',

        // vnp_Amount là unsignedBigInteger -> cast integer
        'vnp_Amount'    => 'integer',

        'payload'       => 'array',
        'cart_totals'   => 'array',
        'cart_snapshot' => 'array',

        'is_verified'   => 'boolean',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED  = 'failed';

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
