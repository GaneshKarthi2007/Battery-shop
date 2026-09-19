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
        Schema::create('warranty_claims', function (Blueprint $table) {
            $table->id();
            $table->string('claim_number')->unique();
            $table->foreignId('battery_serial_id')->nullable()->constrained('battery_serials')->onDelete('set null');
            $table->string('serial_number');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('vehicle_number')->nullable();
            $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('set null');
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry_date')->nullable();
            $table->text('issue_description');
            $table->text('inspection_notes')->nullable();
            $table->string('claim_type')->default('replacement'); // replacement, repair, prorata_refund
            $table->string('status')->default('pending_inspection'); // pending_inspection, sent_to_manufacturer, approved, replaced, rejected
            $table->string('replacement_serial_number')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warranty_claims');
    }
};
