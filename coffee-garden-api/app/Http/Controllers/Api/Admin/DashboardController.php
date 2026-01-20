<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * SUMMARY
     */
    public function summary()
    {
        $totalOrders = (int) Order::count();

        // Doanh thu: chỉ lấy đơn thanh toán thành công và không bị hủy
        $totalRevenue = (float) Order::query()
            ->where('payment_status', Order::PAYMENT_SUCCESS)  // 'success'
            ->where('status', '!=', Order::STATUS_CANCELED)    // != 3
            ->sum('total_price');

        // Users: roles trong DB là 'admin' | 'user' (không có 'customer')
        $totalUsers = (int) User::query()
            ->where('roles', 'user')
            ->count();

        $totalProducts = (int) Product::count();

        return response()->json([
            'totalOrders'   => $totalOrders,
            'totalRevenue'  => $totalRevenue,
            'totalUsers'    => $totalUsers,
            'totalProducts' => $totalProducts,
        ]);
    }

    /**
     * REVENUE CHART (7 ngày) - tính theo payment success & not canceled
     */
    public function revenueChart(Request $request)
    {
        $daysCount = (int) ($request->query('days', 7));
        if ($daysCount <= 0) $daysCount = 7;
        if ($daysCount > 365) $daysCount = 365;

        $data = collect(range($daysCount - 1, 0))->map(function ($day) {
            $date = Carbon::today()->subDays($day)->toDateString();

            $revenue = (float) Order::query()
                ->whereDate('created_at', $date)
                ->where('payment_status', Order::PAYMENT_SUCCESS)
                ->where('status', '!=', Order::STATUS_CANCELED)
                ->sum('total_price');

            return [
                'day'     => Carbon::parse($date)->format('d/m'),
                'revenue' => $revenue,
            ];
        });

        return response()->json($data);
    }

    /**
     * TOP PRODUCTS
     * - Tính theo order_details snapshot (an toàn nếu product bị xóa/null)
     * - Lọc đơn hợp lệ bằng join orders
     * - Fix lỗi ONLY_FULL_GROUP_BY bằng aggregate cho name
     */
    public function topProducts(Request $request)
    {
        $limit = (int) ($request->query('limit', 5));
        if ($limit <= 0) $limit = 5;
        if ($limit > 50) $limit = 50;

        $top = DB::table('order_details')
            ->join('orders', 'order_details.order_id', '=', 'orders.id')
            ->where('orders.payment_status', Order::PAYMENT_SUCCESS)
            ->where('orders.status', '!=', Order::STATUS_CANCELED)
            ->selectRaw('COALESCE(order_details.product_id, 0) as id')
            ->selectRaw('MAX(order_details.product_name) as name')
            ->selectRaw('SUM(order_details.qty) as total_sold')
            ->groupBy('order_details.product_id')
            ->orderByDesc('total_sold')
            ->limit($limit)
            ->get();

        return response()->json($top);
    }
}
