<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    /**
     * =========================================================
     * CONSTANTS – PAYMENT
     * =========================================================
     */
    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_SUCCESS = 'success';
    public const PAYMENT_FAILED  = 'failed';

    /**
     * =========================================================
     * CONSTANTS – ORDER STATUS (tinyint)
     * =========================================================
     */
    public const STATUS_PENDING  = 1;
    public const STATUS_PAID     = 2;
    public const STATUS_CANCELED = 3;

    /**
     * =========================================================
     * FILLABLE
     * =========================================================
     */
    protected $fillable = [
        'user_id',
        'order_code',

        // receiver snapshot
        'name',
        'phone',
        'email',
        'address',

        // payment
        'payment_method',     // vnpay | cod
        'payment_status',     // pending | success | failed

        // totals snapshot
        'subtotal',
        'extras_total',
        'total_price',

        // paid time
        'paid_at',

        // ✅ chống trừ kho 2 lần
        'inventory_deducted_at',

        // business status (tinyint)
        'status',             // 1 pending | 2 paid | 3 canceled

        'note',

        // trace
        'vnp_TxnRef',
    ];

    /**
     * =========================================================
     * CASTS
     * =========================================================
     * Tiền: decimal cast trả string, tránh float.
     */
    protected $casts = [
        'subtotal'     => 'decimal:2',
        'extras_total' => 'decimal:2',
        'total_price'  => 'decimal:2',

        'paid_at'               => 'datetime',
        'inventory_deducted_at' => 'datetime',

        'status'  => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * =========================================================
     * RELATIONS
     * =========================================================
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderDetail::class, 'order_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class, 'order_id');
    }

    /**
     * =========================================================
     * HELPERS
     * =========================================================
     */
    public function isPaymentSuccess(): bool
    {
        return (string) $this->payment_status === self::PAYMENT_SUCCESS;
    }

    public function isPaymentPending(): bool
    {
        return (string) $this->payment_status === self::PAYMENT_PENDING;
    }

    public function isPaidOrder(): bool
    {
        return (int) $this->status === self::STATUS_PAID;
    }

    public function isPendingOrder(): bool
    {
        return (int) $this->status === self::STATUS_PENDING;
    }

    public function isCanceled(): bool
    {
        return (int) $this->status === self::STATUS_CANCELED;
    }

    public function isCod(): bool
    {
        return (string) $this->payment_method === 'cod';
    }

    public function isVnpay(): bool
    {
        return (string) $this->payment_method === 'vnpay';
    }

    /**
     * Đơn có thể trừ kho không (theo business logic chung):
     * - đã payment success
     * - không bị cancel
     */
    public function canReduceStock(): bool
    {
        return $this->isPaymentSuccess() && !$this->isCanceled();
    }

    /**
     * ✅ đã trừ kho chưa (chống double-deduct)
     */
    public function isInventoryDeducted(): bool
    {
        return !empty($this->inventory_deducted_at);
    }

    /**
     * ✅ COD: client có thể bấm "Đã nhận" khi:
     * - COD
     * - status pending
     * - chưa canceled
     */
    public function canConfirmReceived(): bool
    {
        return $this->isCod() && $this->isPendingOrder() && !$this->isCanceled();
    }

    /**
     * ✅ COD: client có thể hủy khi:
     * - COD
     * - status pending
     * - chưa trừ kho
     * - chưa canceled
     */
    public function canCancelByClient(): bool
    {
        return $this->isCod()
            && $this->isPendingOrder()
            && !$this->isCanceled()
            && !$this->isInventoryDeducted();
    }
}
