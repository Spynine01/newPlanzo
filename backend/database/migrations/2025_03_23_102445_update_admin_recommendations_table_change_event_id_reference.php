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
        Schema::table('admin_recommendations', function (Blueprint $table) {
            // Drop existing foreign key
            $table->dropForeign(['event_id']);
            $table->dropForeign(['transaction_id']);
            
            // Modify event_id to reference pending_events
            $table->foreign('event_id')
                ->references('id')
                ->on('pending_events')
                ->onDelete('cascade');
            
            // Make transaction_id nullable and optional
            $table->foreignId('transaction_id')
                ->nullable()
                ->change();
            
            // Make recommendation nullable
            $table->text('recommendation')
                ->nullable()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('admin_recommendations', function (Blueprint $table) {
            // Drop modified foreign keys
            $table->dropForeign(['event_id']);
            $table->dropForeign(['transaction_id']);
            
            // Restore original foreign keys
            $table->foreign('event_id')
                ->references('id')
                ->on('events')
                ->onDelete('cascade');
            
            $table->foreignId('transaction_id')
                ->change();
            
            $table->text('recommendation')
                ->change();
        });
    }
};
