<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

use App\Models\Product;
use App\Models\ProductInventory;
use App\Models\ProductStore;
use App\Models\ProductStoreLog;

class AdminInventoryController extends Controller
{
    /**
     * ======================================================
     * GET INVENTORY LIST (TỒN KHO HIỆN TẠI)
     * ======================================================
     */
    public function index()
    {
        $data = Product::query()
            ->leftJoin('product_inventories as pi', 'products.id', '=', 'pi.product_id')
            ->select([
                'products.id',
                'products.name',
                'products.thumbnail',
                'products.price_base',
                DB::raw('COALESCE(pi.stock, 0) as stock'),
                DB::raw('COALESCE(pi.cost_price, 0) as cost_price'),
            ])
            ->orderByDesc('products.id')
            ->get();

        return response()->json($data);
    }

    /**
     * ======================================================
     * IMPORT INVENTORY (NHẬP KHO)
     * ======================================================
     */
    public function import(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty'        => 'required|integer|min:1',
            'price_root' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {

            // Snapshot tồn kho
            $inventory = ProductInventory::firstOrCreate(
                ['product_id' => $request->product_id],
                ['stock' => 0, 'cost_price' => 0]
            );

            $stockBefore = $inventory->stock;
            $stockAfter  = $stockBefore + $request->qty;

            // Update snapshot
            $inventory->update([
                'stock'      => $stockAfter,
                'cost_price' => $request->price_root,
            ]);

            // Log giao dịch kho
            ProductStore::create([
                'product_id'  => $request->product_id,
                'cost_price'  => $request->price_root,
                'qty_change'  => $request->qty,
                'stock_after' => $stockAfter,
                'type'        => 'import',
                'user_id'     => Auth::id(),
                'note'        => 'Nhập kho',
            ]);

            // Log audit
            ProductStoreLog::create([
                'product_id' => $request->product_id,
                'qty_before' => $stockBefore,
                'qty_change' => $request->qty,
                'qty_after'  => $stockAfter,
                'price_root' => $request->price_root,
                'admin_id'   => Auth::id(),
                'note'       => 'Nhập kho',
            ]);
        });

        return response()->json([
            'message' => 'Nhập kho thành công',
        ]);
    }

    /**
     * ======================================================
     * ADJUST INVENTORY (KIỂM KÊ / ĐIỀU CHỈNH)
     * ======================================================
     */
    public function adjust(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty'        => 'required|integer|min:0',
            'price_root' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {

            $inventory = ProductInventory::firstOrCreate(
                ['product_id' => $request->product_id],
                ['stock' => 0, 'cost_price' => 0]
            );

            $stockBefore = $inventory->stock;
            $stockAfter  = $request->qty;
            $qtyChange   = $stockAfter - $stockBefore;

            $inventory->update([
                'stock'      => $stockAfter,
                'cost_price' => $request->price_root ?? $inventory->cost_price,
            ]);

            ProductStore::create([
                'product_id'  => $request->product_id,
                'cost_price'  => $inventory->cost_price,
                'qty_change'  => $qtyChange,
                'stock_after' => $stockAfter,
                'type'        => 'adjust',
                'user_id'     => Auth::id(),
                'note'        => 'Điều chỉnh kho',
            ]);

            ProductStoreLog::create([
                'product_id' => $request->product_id,
                'qty_before' => $stockBefore,
                'qty_change' => $qtyChange,
                'qty_after'  => $stockAfter,
                'price_root' => $request->price_root,
                'admin_id'   => Auth::id(),
                'note'       => 'Điều chỉnh kho',
            ]);
        });

        return response()->json([
            'message' => 'Điều chỉnh kho thành công',
        ]);
    }

    /**
     * ======================================================
     * INVENTORY DETAIL BY PRODUCT
     * ======================================================
     */
    public function show($productId)
    {
        $product = Product::findOrFail($productId);

        $inventory = ProductInventory::where('product_id', $productId)->first();

        return response()->json([
            'product'   => $product,
            'inventory' => $inventory,
        ]);
    }

    /**
     * ======================================================
     * INVENTORY HISTORY (LỊCH SỬ NHẬP / ĐIỀU CHỈNH)
     * ======================================================
     */
    public function history($productId)
    {
        $logs = ProductStoreLog::with('admin:id,name')
            ->where('product_id', $productId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($logs);
    }
}
