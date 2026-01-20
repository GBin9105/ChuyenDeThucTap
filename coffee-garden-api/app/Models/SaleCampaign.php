<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleCampaign extends Model
{
    /**
     * =========================================================
     * TABLE
     * =========================================================
     */
    protected $table = 'sale_campaigns';

    /**
     * =========================================================
     * FILLABLE
     * =========================================================
     * Campaign CHỈ quản lý metadata + thời gian
     */
    protected $fillable = [
        'name',
        'description',
        'from_date',
        'to_date',
        'status', // draft | active | expired
    ];

    /**
     * =========================================================
     * CASTS
     * =========================================================
     */
    protected $casts = [
        'from_date' => 'datetime',
        'to_date'   => 'datetime',
    ];

    /**
     * =========================================================
     * RELATIONS
     * =========================================================
     */

    /**
     * Danh sách item (sản phẩm được sale)
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleCampaignItem::class, 'campaign_id');
    }

    /**
     * =========================================================
     * HELPERS
     * =========================================================
     */

    /**
     * Campaign có đang active không
     */
    public function isActive(): bool
    {
        $now = now();

        return $this->status === 'active'
            && $this->from_date !== null
            && $this->to_date !== null
            && $this->from_date->lte($now)
            && $this->to_date->gte($now);
    }

    /**
     * =========================================================
     * SCOPES (OPTIONAL – RẤT HỮU ÍCH)
     * =========================================================
     */

    /**
     * Scope campaign đang active
     */
    public function scopeActive($query)
    {
        $now = now();

        return $query->where('status', 'active')
            ->where('from_date', '<=', $now)
            ->where('to_date', '>=', $now);
    }
}
