<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        /**
         * BƯỚC 1 — Tạo bảng trước (chưa thêm foreign key)
         */
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();

            // thuộc nhóm nào (nullable = group)
            $table->unsignedBigInteger('parent_id')->nullable();

            // Tên group hoặc value
            $table->string('name');

            // group / value
            $table->enum('type', ['group', 'value'])->default('value');

            // Giá cố định (chỉ áp dụng cho VALUE)
            $table->integer('price_extra')->default(0);

            $table->timestamps();
        });

        /**
         * BƯỚC 2 — Thêm foreign key SAU KHI bảng đã tồn tại
         */
        Schema::table('attributes', function (Blueprint $table) {
            $table->foreign('parent_id')
                ->references('id')
                ->on('attributes')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        /**
         * BƯỚC NGƯỢC: xóa FK trước → rồi mới drop table
         */
        Schema::table('attributes', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });

        Schema::dropIfExists('attributes');
    }
};
