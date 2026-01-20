<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function create(array $data, $userId)
    {
        return DB::transaction(function () use ($data, $userId) {

            $order = Order::create([
                'user_id' => $userId,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'payment_method' => $data['payment_method'],
                'total_price' => $data['total_price'],
            ]);

            foreach ($data['items'] as $item) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'size_id' => $item['size_id'] ?? null,
                    'toppings' => json_encode($item['toppings'] ?? []),
                    'options' => json_encode($item['options'] ?? []),
                    'price' => $item['price'],
                    'amount' => $item['amount'],
                ]);
            }

            return $order->load('details');
        });
    }

    public function list($userId)
    {
        return Order::where('user_id', $userId)->with('details')->get();
    }

    public function find($id)
    {
        return Order::with('details')->findOrFail($id);
    }

    public function createPaymentUrl(Order $order)
{
    $amount = $order->total_price;

    $vnpService = new \App\Services\VNPayService();

    $url = $vnpService->createPayment([
        'amount' => $amount,
        'order_id' => $order->id
    ]);

    return $url['payment_url'];
}

}
