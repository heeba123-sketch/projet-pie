<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('phone', 30);
            $table->text('customer_notes')->nullable();
            $table->string('user_language', 5)->default('fr');
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered'])->default('pending');
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 36);
            $table->string('kit_id', 36);
            $table->integer('quantity')->default(1);
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('kit_id')->references('id')->on('kits')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
