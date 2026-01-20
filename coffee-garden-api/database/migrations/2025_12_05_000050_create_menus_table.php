<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();

            // Tên menu (bắt buộc)
            $table->string('name');

            // Link có thể null (tùy loại menu)
            $table->string('link')->nullable();

            // Loại menu: custom/category/topic/page
            $table->enum('type', ['custom', 'category', 'topic', 'page'])
                  ->default('custom');

            // Parent (menu cha)
            $table->unsignedBigInteger('parent_id')->default(0);

            // Thứ tự sắp xếp
            $table->unsignedInteger('sort_order')->default(0);

            // Liên kết đến ID của bảng khác (categories, topics, pages...)
            $table->unsignedBigInteger('table_id')->nullable();

            // Vị trí hiển thị: menu chính hoặc footer
            $table->enum('position', ['mainmenu', 'footermenu'])
                  ->default('mainmenu');

            // Trạng thái
            $table->unsignedTinyInteger('status')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('menus');
    }
};
