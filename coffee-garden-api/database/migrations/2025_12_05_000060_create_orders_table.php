<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            /**
             * User (nullable để an toàn: sau này hỗ trợ guest/admin tạo hộ)
             */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->index('user_id');

            /**
             * Mã đơn hiển thị/đối soát
             */
            $table->string('order_code', 50)->unique();

            /**
             * Thông tin người nhận (snapshot)
             * Vì order chỉ tạo sau khi pay success => bạn có thể lấy từ form checkout hoặc snapshot từ attempt.
             */
            $table->string('name');
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->string('address')->nullable();

            /**
             * Payment
             * Vì order chỉ tạo khi thanh toán thành công => mặc định success
             */
            $table->enum('payment_method', ['vnpay', 'cod'])->default('vnpay');
            $table->enum('payment_status', ['pending', 'success', 'failed'])->default('success');

            /**
             * Trạng thái đơn (business)
             * 1 pending/active | 2 paid | 3 canceled
             * Order tạo khi thanh toán success => default 2
             */
            $table->unsignedTinyInteger('status')->default(2);

            /**
             * Totals snapshot (khớp cart totals)
             */
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('extras_total', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);

            /**
             * Thời điểm thanh toán thành công
             */
            $table->timestamp('paid_at')->nullable();

            /**
             * Ghi chú
             */
            $table->text('note')->nullable();

            /**
             * Trace tới attempt VNPay (rất hữu ích khi debug/đối soát)
             * - Không unique vì bạn có thể retry, nhưng vì order chỉ tạo khi success,
             *   thực tế thường 1 order map 1 TxnRef success.
             */
            $table->string('vnp_TxnRef', 64)->nullable();
            $table->index('vnp_TxnRef');

            $table->timestamps();

            $table->index(['payment_method', 'payment_status']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
