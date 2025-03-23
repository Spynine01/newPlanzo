<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsVerifiedToEventOrgs extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('event_org', function (Blueprint $table) {
            $table->boolean('isVerified')->default(false); // Add the column with default false
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('event_org', function (Blueprint $table) {
            $table->dropColumn('isVerified'); // Remove the column if rolling back
        });
    }
}
