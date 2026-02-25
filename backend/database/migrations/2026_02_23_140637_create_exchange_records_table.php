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
        Schema::create('exchange_records', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('battery_brand');
            $table->string('battery_model')->nullable();
            $table->decimal('valuation_amount', 10, 2);
            $table->string('status')->default('pending'); // pending, consumed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_records');
    }
};
