<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kits', function (Blueprint $table) {
            $table->string('id', 36)->primary(); // ex: kit-1
            $table->text('title_ar');
            $table->text('title_tmz');
            $table->text('title_fr');
            $table->text('title_en');
            $table->decimal('price', 8, 2);
            $table->text('description_ar');
            $table->text('description_tmz');
            $table->text('description_fr');
            $table->text('description_en');
            $table->text('image_url');
            $table->string('color_hex', 7)->default('#FFFFFF');
            $table->integer('stock')->default(0);
            $table->integer('reorder_at')->default(8);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kits');
    }
};
