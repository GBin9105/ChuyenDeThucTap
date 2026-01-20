<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderDetailController extends Controller
{
    /**
     * GET /api/orders/{id}/items
     * User xem items của đơn hàng của chính họ
     */
    public function index(Request $request, $id)
    {
        $userId = (int) Auth::id();

        $order = Order::query()
            ->where('id', (int) $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $items = OrderDetail::query()
            ->where('order_id', $order->id)
            ->with(['product', 'size'])
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => [
                'order' => $order,
                'items' => $items,
            ],
        ]);
    }
}
