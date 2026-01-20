<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_store_logs', function (Blueprint $table) {
            $table->id();

            // Sản phẩm
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            // Số lượng
            $table->unsignedInteger('qty_before');   // tồn kho trước
            $table->integer('qty_change');           // + / -
            $table->unsignedInteger('qty_after');    // tồn kho sau

            // Giá nhập tại thời điểm ghi nhận
            $table->decimal('price_root', 12, 2)->nullable();

            // Admin thao tác
            $table->foreignId('admin_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Ghi chú
            $table->string('note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_store_logs');
    }
};
