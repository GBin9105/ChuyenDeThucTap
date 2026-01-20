<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderPaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build()
    {
        $order = $this->order->loadMissing(['items.product', 'items.size']);

        return $this
            ->subject('Coffee Garden - Xác nhận thanh toán ' . ($order->order_code ?? ''))
            ->view('emails.order_paid', [
                'order' => $order,
            ]);
    }
}
