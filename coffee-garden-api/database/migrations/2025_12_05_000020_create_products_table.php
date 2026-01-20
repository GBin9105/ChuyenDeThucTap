<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            /**
             * CATEGORY
             * Mỗi sản phẩm thuộc 1 category.
             * Khi category bị xóa → toàn bộ product của category đó cũng bị xóa.
             */
            $table->foreignId('category_id')
                ->constrained()
                ->cascadeOnDelete();

            /**
             * BASIC INFORMATION
             */
            $table->string('name');
            $table->string('slug')->unique();

            /**
             * MAIN THUMBNAIL IMAGE
             */
            $table->string('thumbnail');

            /**
             * DESCRIPTION (NGẮN)
             */
            $table->string('description')->nullable();

            /**
             * CONTENT (CHI TIẾT SẢN PHẨM)
             */
            $table->longText('content')->nullable();

            /**
             * GIÁ GỐC
             */
            $table->decimal('price_base', 12, 2)->default(0);

            /**
             * 🔥 STOCK – SỐ LƯỢNG TỒN KHO
             */
            $table->unsignedInteger('stock')->default(0);

            /**
             * STATUS
             * 1 = active, 0 = hidden
             */
            $table->unsignedTinyInteger('status')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
