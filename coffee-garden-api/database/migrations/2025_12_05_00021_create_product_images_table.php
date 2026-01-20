<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();

            /**
             * RELATION
             * 1 product có nhiều images
             * Xoá product → xoá toàn bộ image liên quan
             */
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            /**
             * IMAGE PATH
             * Lưu đường dẫn ảnh (relative hoặc full URL)
             * Ví dụ:
             * - products/latte/image-1.jpg
             * - https://cdn.domain.com/products/latte/image-1.jpg
             */
            $table->string('image');

            /**
             * IS MAIN IMAGE
             * 1 = ảnh chính (thumbnail mở rộng)
             * 0 = ảnh phụ (gallery)
             */
            $table->boolean('is_main')->default(false);

            /**
             * SORT ORDER
             * Thứ tự hiển thị trong gallery
             */
            $table->unsignedInteger('sort_order')->default(0);

            /**
             * STATUS
             * 1 = active, 0 = hidden
             */
            $table->unsignedTinyInteger('status')->default(1);

            $table->timestamps();

            /**
             * INDEXES
             */
            $table->index(['product_id', 'is_main']);
            $table->index(['product_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
