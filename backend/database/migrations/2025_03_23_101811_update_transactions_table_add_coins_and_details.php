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
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'coins')) {
                $table->integer('coins')->nullable();
            }
            if (!Schema::hasColumn('transactions', 'platform_fee')) {
                $table->decimal('platform_fee', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('transactions', 'status')) {
                $table->string('status')->default('completed');
            }
            if (!Schema::hasColumn('transactions', 'description')) {
                $table->string('description')->nullable();
            }
            if (!Schema::hasColumn('transactions', 'details')) {
                $table->json('details')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['coins', 'platform_fee', 'status', 'description', 'details']);
        });
    }
};
