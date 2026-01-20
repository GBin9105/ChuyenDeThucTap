<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    /**
     * GET /api/admin/payments
     *
     * Query optional:
     * - order_id
     * - status (pending|success|failed)
     * - vnp_TxnRef
     * - bank (vnp_BankCode)
     * - resp (vnp_ResponseCode)
     * - from (Y-m-d)
     * - to   (Y-m-d)
     * - per_page (default 20)
     */
    public function index(Request $request)
    {
        $perPage = (int)($request->query('per_page', 20));
        $perPage = max(1, min(100, $perPage));

        $q = PaymentTransaction::query()->latest();

        if ($request->filled('order_id')) {
            $q->where('order_id', (int)$request->query('order_id'));
        }

        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }

        if ($request->filled('vnp_TxnRef')) {
            $q->where('vnp_TxnRef', 'like', '%' . trim((string)$request->query('vnp_TxnRef')) . '%');
        }

        if ($request->filled('bank')) {
            $q->where('vnp_BankCode', $request->query('bank'));
        }

        if ($request->filled('resp')) {
            $q->where('vnp_ResponseCode', $request->query('resp'));
        }

        if ($request->filled('from')) {
            $q->whereDate('created_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $q->whereDate('created_at', '<=', $request->query('to'));
        }

        $data = $q->paginate($perPage);

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    /**
     * GET /api/admin/payments/{id}
     * Trả về transaction + order (nếu có)
     */
    public function show($id)
    {
        $tx = PaymentTransaction::findOrFail($id);

        $order = null;
        if (!empty($tx->order_id)) {
            $order = Order::with(['user', 'items.product', 'items.size'])->find($tx->order_id);
        }

        return response()->json([
            'status' => true,
            'data'   => [
                'transaction' => $tx,
                'order'       => $order,
            ],
        ]);
    }

    /**
     * GET /api/admin/orders/{orderId}/payments
     * Danh sách payment attempts theo order
     */
    public function byOrder($orderId)
    {
        $order = Order::with(['user'])->findOrFail($orderId);

        $txs = PaymentTransaction::where('order_id', $order->id)
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data'   => [
                'order'        => $order,
                'transactions' => $txs,
            ],
        ]);
    }
}
