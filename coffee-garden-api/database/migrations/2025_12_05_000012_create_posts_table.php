<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('topic_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();

            // tên cột đúng backend + frontend đang dùng
            $table->string('thumbnail')->nullable();

            $table->text('description')->nullable();
            $table->longText('content')->nullable();

            $table->enum('post_type', ['post', 'page'])->default('post');

            $table->unsignedTinyInteger('status')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('posts');
    }
};
