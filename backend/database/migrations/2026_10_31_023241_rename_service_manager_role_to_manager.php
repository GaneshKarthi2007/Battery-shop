<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Merge the deprecated 'service_manager' role into the unified 'manager' role.
     * After this migration there is only one manager role in the system.
     */
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'service_manager')
            ->update(['role' => 'manager']);
    }

    public function down(): void
    {
        // No rollback — we cannot know which managers were originally service_managers.
    }
};
