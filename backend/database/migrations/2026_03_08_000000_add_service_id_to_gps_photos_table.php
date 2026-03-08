<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add optional service_id FK to gps_photos so photos can be linked to a service.
     */
    public function up(): void
    {
        Schema::table('gps_photos', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->after('user_id')->constrained('services')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('gps_photos', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn('service_id');
        });
    }
};
