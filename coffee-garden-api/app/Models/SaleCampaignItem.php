<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleCampaignItem extends Model
{
    /**
     * =========================================================
     * TABLE
     * =========================================================
     */
    protected $table = 'sale_campaign_items';

    /**
     * =========================================================
     * FILLABLE
     * =========================================================
     */
    protected $fillable = [
        'campaign_id',
        'product_id',

        // percent | fixed_amount | fixed_price
        'type',

        // giảm theo %
        'percent',

        // dùng cho fixed_amount & fixed_price
        'sale_price',
    ];

    /**
     * =========================================================
     * CASTS
     * =========================================================
     */
    protected $casts = [
        'percent'    => 'float',
        'sale_price' => 'float',
    ];

    /**
     * =========================================================
     * RELATIONS
     * =========================================================
     */
    public function campaign()
    {
        return $this->belongsTo(SaleCampaign::class, 'campaign_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * =========================================================
     * CHECK ACTIVE
     * =========================================================
     */
    public function isActive(): bool
    {
        return $this->campaign?->isActive() ?? false;
    }

    /**
     * =========================================================
     * CORE LOGIC – TÍNH GIÁ SAU SALE
     * =========================================================
     */
    public function getFinalPrice(float $originalPrice): float
    {
        if (!$this->isActive()) {
            return $originalPrice;
        }

        return match ($this->type) {
            // 🔥 GIẢM %
            'percent' => max(
                0,
                $originalPrice - ($originalPrice * $this->percent / 100)
            ),

            // 🔥 GIẢM TIỀN CỐ ĐỊNH
            'fixed_amount' => max(
                0,
                $originalPrice - $this->sale_price
            ),

            // 🔥 ĐỒNG GIÁ
            'fixed_price' => max(
                0,
                $this->sale_price
            ),

            default => $originalPrice,
        };
    }

    /**
     * =========================================================
     * LABEL HIỂN THỊ SALE (ADMIN / CLIENT)
     * =========================================================
     */
    public function getSaleLabel(): string
    {
        return match ($this->type) {
            'percent'       => '-' . (int) $this->percent . '%',
            'fixed_amount'  => '-₫' . number_format($this->sale_price),
            'fixed_price'   => '₫' . number_format($this->sale_price),
            default         => '',
        };
    }
}
