<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pie_users', function (Blueprint $table) {
            $table->string('uid', 128)->primary();
            $table->string('display_name', 255);
            $table->string('email', 255)->unique()->nullable();
            $table->enum('role', ['foyer', 'jeune', 'etudiant', 'rural', 'invite'])->default('foyer');
            $table->string('location', 255)->default('Maroc');
            $table->decimal('earnings', 10, 2)->default(0);
            $table->integer('courses_completed')->default(0);
            $table->string('level', 100)->default('Nouveau Membre');
            $table->integer('xp')->default(0);
            $table->integer('streak')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pie_users');
    }
};
