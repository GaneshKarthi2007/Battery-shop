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
        Schema::create('misc_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('entry_number')->nullable()->index();
            $table->date('date');
            $table->enum('type', ['Cash', 'Journal'])->default('Cash')->index();
            $table->text('particular');
            $table->decimal('debit_amount', 14, 2)->default(0);
            $table->decimal('credit_amount', 14, 2)->default(0);
            $table->string('debit_ledger')->nullable()->index();
            $table->string('credit_ledger')->nullable()->index();
            $table->json('credit_entries')->nullable();
            $table->json('debit_entries')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('bank_name')->nullable()->index();
            $table->string('cheque_no')->nullable()->index();
            $table->date('cheque_date')->nullable();
            $table->string('status')->default('Settled')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('misc_transactions');
    }
};
