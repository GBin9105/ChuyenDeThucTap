<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = [
        'name',
        'link',
        'type',
        'parent_id',
        'sort_order',
        'table_id',
        'position',
        'status'
    ];

    // Tự động ép kiểu
    protected $casts = [
        'parent_id'  => 'integer',
        'sort_order' => 'integer',
        'table_id'   => 'integer',
        'status'     => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    // Menu con
    public function children()
    {
        return $this->hasMany(Menu::class, 'parent_id', 'id')
                    ->orderBy('sort_order', 'asc');
    }

    // Menu cha
    public function parent()
    {
        return $this->belongsTo(Menu::class, 'parent_id', 'id');
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    // Lọc menu theo vị trí (header / footer / mobile...)
    public function scopePosition($query, $position)
    {
        return $query->where('position', $position)->where('status', 1);
    }

    /*
    |--------------------------------------------------------------------------
    | STATIC: BUILD MENU TREE
    |--------------------------------------------------------------------------
    | Trả về dạng cây menu (nested)
    */
    public static function buildTree($items, $parentId = 0)
    {
        return $items
            ->where('parent_id', $parentId)
            ->map(function ($menu) use ($items) {
                $menu->children = self::buildTree(  $items, $menu->id);
                return $menu;
            })
            ->values();
    }
}
