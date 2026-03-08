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
            $table->string('sub_status')->nullable()->after('status');
            $table->timestamp('status_updated_at')->nullable()->after('updated_at');
            $table->timestamp('billed_at')->nullable()->after('status_updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['sub_status', 'status_updated_at', 'billed_at']);
        });
    }
};
