<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutorials', function (Blueprint $table) {
            $table->string('id', 36)->primary(); // ex: course-1
            $table->enum('metier', ['crochet', 'broderie', 'tissage', 'poterie']);
            $table->string('linked_kit_id', 36)->nullable();
            $table->text('title_ar');
            $table->text('title_tmz');
            $table->text('title_fr');
            $table->text('title_en');
            $table->text('description_ar');
            $table->text('description_tmz');
            $table->text('description_fr');
            $table->text('description_en');
            $table->enum('difficulty', ['facile', 'moyen', 'expert']);
            $table->string('duration', 20)->default('5 min');
            $table->string('video_embed_id', 50)->nullable();
            $table->string('video_mock_name', 50)->nullable();
            // Exercise fields
            $table->decimal('earn_price', 8, 2)->nullable();
            $table->string('output_product_id', 50)->nullable();
            $table->text('exercise_title_ar')->nullable();
            $table->text('exercise_title_tmz')->nullable();
            $table->text('exercise_title_fr')->nullable();
            $table->text('exercise_title_en')->nullable();
            $table->text('exercise_desc_ar')->nullable();
            $table->text('exercise_desc_tmz')->nullable();
            $table->text('exercise_desc_fr')->nullable();
            $table->text('exercise_desc_en')->nullable();
            $table->timestamps();

            $table->foreign('linked_kit_id')->references('id')->on('kits')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutorials');
    }
};
