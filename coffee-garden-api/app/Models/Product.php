<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * =========================================================
     * FILLABLE
     * =========================================================
     * ❌ KHÔNG CÓ stock (stock nằm ở inventory)
     */
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'thumbnail',
        'content',
        'description',
        'price_base',
        'status',
    ];

    /**
     * =========================================================
     * APPENDS (GỬI CHO FE)
     * =========================================================
     */
    protected $appends = [
        'final_price',
        'is_on_sale',
        'is_in_stock',
    ];

    /**
     * Cache sale active trong 1 request
     */
    protected $cachedActiveSale = null;

    /*--------------------------------------------------------------
     | CATEGORY
    --------------------------------------------------------------*/
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /*--------------------------------------------------------------
     | INVENTORY (PHƯƠNG ÁN B – SNAPSHOT)
    --------------------------------------------------------------*/
    public function inventory(): HasOne
    {
        return $this->hasOne(ProductInventory::class, 'product_id');
    }

    /*--------------------------------------------------------------
     | SALE CAMPAIGN ITEMS
    --------------------------------------------------------------*/
    public function campaignItems(): HasMany
    {
        return $this->hasMany(SaleCampaignItem::class, 'product_id', 'id')
            ->with('campaign');
    }

    /**
     * =========================================================
     * SALE ĐANG ACTIVE (THEO THỜI GIAN)
     * =========================================================
     */
    public function activeSale()
    {
        if ($this->cachedActiveSale !== null) {
            return $this->cachedActiveSale;
        }

        $now = now();

        $this->cachedActiveSale = $this->campaignItems()
            ->whereHas('campaign', function ($q) use ($now) {
                $q->where('status', 'active')
                  ->where('from_date', '<=', $now)
                  ->where('to_date', '>=', $now);
            })
            ->orderBy('id')
            ->first();

        return $this->cachedActiveSale;
    }

    /*--------------------------------------------------------------
     | SALE ACCESSORS – CORE LOGIC
    --------------------------------------------------------------*/

    /**
     * Có đang sale hay không
     */
    public function getIsOnSaleAttribute(): bool
    {
        return $this->activeSale() !== null;
    }

    /**
     * =========================================================
     * GIÁ CUỐI CÙNG (ÁP DỤNG SALE – 3 KIỂU)
     * =========================================================
     *
     * percent       → giảm %
     * fixed_amount  → GIẢM TIỀN CỐ ĐỊNH (TRỪ TIỀN)
     * fixed_price   → ĐỒNG GIÁ
     */
    public function getFinalPriceAttribute(): float
    {
        $base = (float) $this->price_base;
        $sale = $this->activeSale();

        if (!$sale) {
            return round($base);
        }

        return match ($sale->type) {

            // 🔥 GIẢM THEO %
            'percent' => round(
                max(0, $base - ($base * $sale->percent / 100))
            ),

            // 🔥 GIẢM TIỀN CỐ ĐỊNH
            'fixed_amount' => round(
                max(0, $base - (float) $sale->sale_price)
            ),

            // 🔥 ĐỒNG GIÁ
            'fixed_price' => round(
                max(0, (float) $sale->sale_price)
            ),

            default => round($base),
        };
    }

    /*--------------------------------------------------------------
     | INVENTORY ACCESSORS (PHƯƠNG ÁN B)
    --------------------------------------------------------------*/

    /**
     * CÒN HÀNG HAY KHÔNG
     */
    public function getIsInStockAttribute(): bool
    {
        return ($this->inventory?->stock ?? 0) > 0
            && $this->status === 1;
    }

    /**
     * =========================================================
     * SCOPE: CHỈ LẤY SẢN PHẨM BÁN ĐƯỢC (CLIENT)
     * =========================================================
     */
    public function scopeAvailable($query)
    {
        return $query
            ->where('products.status', 1)
            ->whereHas('inventory', function ($q) {
                $q->where('stock', '>', 0);
            });
    }

    /*--------------------------------------------------------------
     | ATTRIBUTE VALUES
    --------------------------------------------------------------*/
    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttribute::class, 'product_id', 'id')
            ->with(['value.group']);
    }

    public function attributesGrouped()
    {
        return $this->attributeValues
            ->filter(fn ($item) => $item->value && $item->value->group)
            ->groupBy(fn ($item) => $item->value->group->name)
            ->map(fn ($group) => $group->pluck('value.name')->toArray());
    }

    /*--------------------------------------------------------------
     | GALLERY IMAGES (MỚI – ĐÃ ĐỒNG BỘ)
    --------------------------------------------------------------*/

    /**
     * Toàn bộ gallery image (active)
     * - main image luôn đứng đầu
     * - sau đó sort_order
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)
            ->where('status', 1)
            ->orderByDesc('is_main')
            ->orderBy('sort_order');
    }

    /**
     * Ảnh main trong gallery (KHÔNG thay thế thumbnail)
     */
    public function galleryMainImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)
            ->where('is_main', true)
            ->where('status', 1);
    }

    /*--------------------------------------------------------------
     | ACCESSORS
    --------------------------------------------------------------*/
    public function getPriceBaseAttribute($value): float
    {
        return (float) $value;
    }
}
