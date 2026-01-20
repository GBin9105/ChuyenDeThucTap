<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_inventories', function (Blueprint $table) {
            $table->id();

            // Sản phẩm (1 sản phẩm = 1 dòng tồn kho)
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete()
                ->unique();

            // Tồn kho hiện tại
            $table->integer('stock')->default(0);

            // Giá nhập hiện tại / gần nhất
            $table->decimal('cost_price', 12, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_inventories');
    }
};
