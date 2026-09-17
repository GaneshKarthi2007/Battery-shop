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
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'payment_status')) {
                $table->string('payment_status')->default('paid')->after('payment_method');
            }
            if (!Schema::hasColumn('sales', 'balance_due')) {
                $table->decimal('balance_due', 15, 2)->default(0)->after('payment_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'balance_due']);
        });
    }
};
