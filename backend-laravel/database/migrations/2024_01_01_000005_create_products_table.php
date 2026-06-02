<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->string('id', 36)->primary()->default('');
            $table->string('title', 255);
            $table->decimal('price', 8, 2);
            $table->text('description');
            $table->text('image_url');
            $table->string('seller_name', 255);
            $table->boolean('is_certified')->default(false);
            $table->integer('likes')->default(0);
            $table->boolean('is_user_added')->default(false);
            $table->text('voice_memo_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
