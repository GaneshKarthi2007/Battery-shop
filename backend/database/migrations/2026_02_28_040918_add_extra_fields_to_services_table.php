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
        Schema::table('services', function (Blueprint $table) {
            $table->string('voice_note')->nullable()->after('complaint_details');
            $table->timestamp('assigned_at')->nullable()->after('assigned_to');
            $table->timestamp('resolved_at')->nullable()->after('status');
            $table->string('payment_status')->default('pending')->after('resolved_at');
            $table->timestamp('payment_confirmed_at')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['voice_note', 'assigned_at', 'resolved_at', 'payment_status', 'payment_confirmed_at']);
        });
    }
};
