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
            $table->string('customer_phone')->nullable()->after('customer_name');
            $table->string('vehicle_details')->nullable()->after('customer_phone');
            $table->decimal('extra_charges', 15, 2)->default(0)->after('total_amount');
            $table->decimal('discount_amount', 15, 2)->default(0)->after('extra_charges');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['customer_phone', 'vehicle_details', 'extra_charges', 'discount_amount']);
        });
    }
};
