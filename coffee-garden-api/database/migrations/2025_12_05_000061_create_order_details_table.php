<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_details', function (Blueprint $table) {
            $table->id();

            /**
             * Thuộc về order
             */
            $table->foreignId('order_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->index('order_id');

            /**
             * Product có thể bị xóa sau này, nhưng order phải giữ lịch sử
             */
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            /**
             * Snapshot product để hiển thị ổn định
             */
            $table->string('product_name');
            $table->string('product_slug')->nullable();
            $table->string('product_thumbnail')->nullable();

            /**
             * LEGACY size_id (cart hiện tại của bạn không dùng size_id nữa, nhưng giữ nullable cho an toàn)
             */
            $table->foreignId('size_id')
                ->nullable()
                ->constrained('sizes')
                ->nullOnDelete();

            /**
             * Snapshot size (đang dùng theo attribute size group trong cart)
             */
            $table->string('size_name')->nullable();
            $table->decimal('size_price_extra', 12, 2)->default(0);

            /**
             * Chuẩn cart hiện tại của bạn: lưu ids để trace cấu hình
             */
            $table->json('attribute_value_ids')->nullable();

            /**
             * Số lượng
             */
            $table->unsignedInteger('qty')->default(1);

            /**
             * Config snapshot (mirror từ cart)
             */
            $table->json('options')->nullable();
            $table->json('toppings')->nullable();
            $table->json('attribute_values')->nullable();

            /**
             * line_key từ cart (trace/gộp cấu hình)
             * SHA256 hex = 64 ký tự
             */
            $table->char('line_key', 64)->nullable();
            $table->index('line_key');

            /**
             * Snapshot pricing tại thời điểm checkout
             */
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('extras_total', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);

            $table->timestamps();

            $table->index(['order_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};
