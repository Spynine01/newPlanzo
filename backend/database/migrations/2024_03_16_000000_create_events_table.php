<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('category');
            $table->date('date');
            $table->time('time');
            $table->string('location');
            $table->string('venue');
            $table->string('address');
            $table->decimal('price', 10, 2);
            $table->integer('available_tickets');
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('organizer_id')->nullable();
            $table->json('schedule')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('events');
    }
}; 