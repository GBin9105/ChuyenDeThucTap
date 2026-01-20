<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('image');
            $table->string('link')->nullable();

            // FIX: bỏ ENUM → dùng string linh hoạt
            $table->string('position', 50)->default('slideshow');

            $table->unsignedInteger('sort_order')->default(0);
            $table->tinyText('description')->nullable();
            $table->unsignedTinyInteger('status')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('banners');
    }
};
