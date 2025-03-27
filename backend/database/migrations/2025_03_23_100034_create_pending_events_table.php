<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('pending_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description');
            $table->string('category');
            $table->date('date');
            $table->time('time');
            $table->string('location')->nullable();
            $table->string('venue')->nullable();
            $table->string('address')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->integer('available_tickets')->nullable();
            $table->string('image')->nullable();
            $table->enum('status', ['pending', 'finalized'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('pending_events');
    }
};
