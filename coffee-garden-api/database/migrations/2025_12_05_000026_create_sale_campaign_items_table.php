<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sale_campaign_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('campaign_id')
                ->constrained('sale_campaigns')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('type', [
                'percent',
                'fixed_price',
                'fixed_amount',
            ])->default('percent');

            $table->unsignedInteger('percent')->nullable();

            $table->decimal('sale_price', 12, 2)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_campaign_items');
    }
};
