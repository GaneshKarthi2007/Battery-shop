<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upi_payments', function (Blueprint $table) {
            $table->id();
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // pending | received | expired
            $table->json('sale_data')->nullable();        // serialised sale payload
            $table->json('invoice_state')->nullable();    // serialised invoice state
            $table->string('upi_ref')->nullable();        // optional UPI transaction ref
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('upi_payments');
    }
};
