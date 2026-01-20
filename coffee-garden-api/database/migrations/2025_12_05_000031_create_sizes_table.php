<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sizes', function (Blueprint $table) {
            $table->id();
            $table->string('name');             // S / M / L
            $table->string('description')->nullable();
            $table->integer('price')->default(0); // Giá chênh lệch theo size
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('sizes');
    }
};
