<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('qty')->default(1);

            // options (ice/sugar/note...) JSON
            $table->json('options')->nullable();

            /**
             * CANONICAL: danh sách Attribute VALUE IDs user đã chọn
             * Ví dụ: [12, 15, 99]
             * - 12 có thể là Size M
             * - 15 có thể là Sugar 50%
             * - 99 có thể là Topping Trân châu
             */
            $table->json('attribute_value_ids')->nullable();

            /**
             * Snapshot để FE hiển thị (được server cập nhật lại theo Attribute hiện tại mỗi lần load)
             */
            $table->string('size_name')->nullable();
            $table->decimal('size_price_extra', 12, 2)->default(0);

            $table->json('toppings')->nullable();          // [{id,name,qty,price_extra}]
            $table->json('attribute_values')->nullable();  // [{group_id,group_name,value_id,value_name,qty,price_extra}]

            /**
             * line_key: gộp dòng theo cấu hình (product + options + attribute_value_ids sorted)
             */
            $table->char('line_key', 64);

            /**
             * Pricing snapshot (server luôn cập nhật lại)
             */
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('extras_total', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);

            $table->timestamps();

            $table->unique(['user_id', 'line_key']);
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
