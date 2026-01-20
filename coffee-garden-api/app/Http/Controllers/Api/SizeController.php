<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SizeController extends Controller
{
    /**
     * GET /api/sizes
     * Trả về danh sách Size chung (S, M, L...)
     */
    public function index()
    {
        return response()->json(
            Size::orderBy('id', 'ASC')->get()
        );
    }

    /**
     * GET /api/products/{id}/sizes
     * Trả về list size + price_extra cho từng sản phẩm
     */
    public function productSizes($id)
    {
        $product = Product::findOrFail($id);

        // Detect pivot table name
        $pivot = null;
        if (Schema::hasTable('product_sizes')) {
            $pivot = 'product_sizes';
        } elseif (Schema::hasTable('product_size')) {
            $pivot = 'product_size';
        }

        if (!$pivot) {
            return response()->json([
                'message' => 'Pivot table for product sizes not found (expected product_sizes or product_size).'
            ], 500);
        }

        // Join pivot -> sizes
        $rows = DB::table("$pivot as ps")
            ->join("sizes as s", "s.id", "=", "ps.size_id")
            ->where("ps.product_id", $product->id)
            ->orderBy("s.id", "ASC")
            ->select([
                "ps.id as product_size_id", // id của pivot (để debug / nếu BE validate theo pivot)
                "ps.product_id",
                "ps.size_id",              // id của sizes
                "s.name as size_name",
                "ps.price_extra",
            ])
            ->get();

        return response()->json($rows);
    }
}
