<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutorial_steps', function (Blueprint $table) {
            $table->id();
            $table->string('tutorial_id', 36);
            $table->integer('step_number');
            $table->text('instruction_ar');
            $table->text('instruction_tmz');
            $table->text('instruction_fr');
            $table->text('instruction_en');
            $table->string('animation_key', 50)->default('wrap-finger');
            $table->timestamps();

            $table->foreign('tutorial_id')->references('id')->on('tutorials')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutorial_steps');
    }
};
