<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sale_campaigns', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->text('description')->nullable();

            // thời gian áp dụng
            $table->dateTime('from_date');
            $table->dateTime('to_date');

            $table->enum('status', ['draft', 'active', 'expired'])
                  ->default('draft');

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('sale_campaigns');
    }
};
