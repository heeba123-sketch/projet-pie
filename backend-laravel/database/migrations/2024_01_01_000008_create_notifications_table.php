<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            // user_id nullable if it's a global notification, or foreign key if specific
            $table->string('user_id')->nullable();
            
            $table->string('type')->default('general'); // welcome, order_status, new_kit, etc.
            
            // Multilingual titles and messages (optional depending on how translation is handled)
            $table->string('title_fr')->nullable();
            $table->string('title_ar')->nullable();
            $table->string('title_tmz')->nullable();
            $table->string('title_en')->nullable();
            
            $table->text('message_fr')->nullable();
            $table->text('message_ar')->nullable();
            $table->text('message_tmz')->nullable();
            $table->text('message_en')->nullable();
            
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
