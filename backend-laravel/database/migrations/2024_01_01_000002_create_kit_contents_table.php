<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kit_contents', function (Blueprint $table) {
            $table->id();
            $table->string('kit_id', 36);
            $table->text('label_ar');
            $table->text('label_tmz');
            $table->text('label_fr');
            $table->text('label_en');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('kit_id')->references('id')->on('kits')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kit_contents');
    }
};
