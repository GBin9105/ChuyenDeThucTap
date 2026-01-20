<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();

            // Sản phẩm
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            // Attribute VALUE ID
            // (không phải group)
            $table->foreignId('attribute_id')
                ->constrained('attributes')
                ->cascadeOnDelete();

            // Active = hiển thị / Hidden
            $table->boolean('active')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_attributes');
    }
};
