<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();

            /**
             * Người thực hiện checkout (cần cho flow "pay cart" theo user)
             */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->index('user_id');

            /**
             * Order chỉ tạo khi payment success => order_id phải nullable
             */
            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->nullOnDelete();
            $table->index('order_id');

            /**
             * VNPay attempt reference (idempotency)
             */
            $table->string('vnp_TxnRef', 64)->unique();

            /**
             * VNPay amount = total_price * 100 (integer)
             */
            $table->unsignedBigInteger('vnp_Amount');

            $table->string('vnp_TransactionNo', 64)->nullable();
            $table->string('vnp_ResponseCode', 32)->nullable();
            $table->string('vnp_TransactionStatus', 32)->nullable();
            $table->string('vnp_BankCode', 32)->nullable();
            $table->string('vnp_PayDate', 32)->nullable();

            /**
             * Trạng thái attempt
             * pending | success | failed
             */
            $table->string('status', 20)->default('pending');
            $table->index('status');

            /**
             * Snapshot checkout (VÌ order chưa tồn tại ở bước create payment)
             * IPN success sẽ dùng các field này để tạo orders + order_details.
             */
            $table->string('name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->text('note')->nullable();

            /**
             * Snapshot totals/cart tại thời điểm tạo payment
             * - cart_totals: {subtotal, extras_total, grand_total, count_lines, count_items...}
             * - cart_snapshot: lines[] (lưu toàn bộ line cần để tạo order_details)
             */
            $table->json('cart_totals')->nullable();
            $table->json('cart_snapshot')->nullable();

            /**
             * Audit / verify callback
             */
            $table->json('payload')->nullable();
            $table->string('vnp_SecureHash', 512)->nullable();
            $table->boolean('is_verified')->default(false);

            $table->timestamps();

            $table->index(['order_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
