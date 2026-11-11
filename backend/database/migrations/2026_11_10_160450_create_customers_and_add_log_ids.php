<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create dedicated customers table with solid log ID (customer_code)
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('customer_code', 30)->unique()->index();
                $table->string('name');
                $table->string('phone')->nullable()->index();
                $table->string('vehicle_number')->nullable();
                $table->text('address')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add solid log IDs to services table
        if (Schema::hasTable('services')) {
            Schema::table('services', function (Blueprint $table) {
                if (!Schema::hasColumn('services', 'service_code')) {
                    $table->string('service_code', 30)->nullable()->index()->after('id');
                }
                if (!Schema::hasColumn('services', 'customer_code')) {
                    $table->string('customer_code', 30)->nullable()->index()->after('service_code');
                }
            });
        }

        // 3. Add customer_code to sales table
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (!Schema::hasColumn('sales', 'customer_code')) {
                    $table->string('customer_code', 30)->nullable()->index()->after('customer_name');
                }
            });
        }

        // 4. Backfill existing services with solid log IDs (SRV-00001, SRV-00002, ...)
        if (Schema::hasTable('services')) {
            $existingServices = DB::table('services')->select('id', 'service_code')->orderBy('id')->get();
            foreach ($existingServices as $srv) {
                if (empty($srv->service_code)) {
                    DB::table('services')
                        ->where('id', $srv->id)
                        ->update(['service_code' => 'SRV-' . str_pad($srv->id, 5, '0', STR_PAD_LEFT)]);
                }
            }
        }

        // 5. Backfill existing customers and generate solid customer log IDs (CUST-00001, CUST-00002, ...)
        $existingCustomers = [];

        // Collect from sales
        if (Schema::hasTable('sales')) {
            $sales = DB::table('sales')
                ->select('customer_name', 'customer_phone', 'vehicle_details')
                ->whereNotNull('customer_name')
                ->where('customer_name', '!=', '')
                ->orderBy('id')
                ->get();

            foreach ($sales as $s) {
                $phone = trim($s->customer_phone ?? '');
                $name = trim($s->customer_name);
                $key = $phone ? "phone:{$phone}" : "name:{$name}";

                if (!isset($existingCustomers[$key])) {
                    $existingCustomers[$key] = [
                        'name' => $name,
                        'phone' => $phone ?: null,
                        'vehicle_number' => $s->vehicle_details ?: null,
                    ];
                }
            }
        }

        // Collect from services
        if (Schema::hasTable('services')) {
            $services = DB::table('services')
                ->select('customer_name', 'contact_number', 'vehicle_details')
                ->whereNotNull('customer_name')
                ->where('customer_name', '!=', '')
                ->orderBy('id')
                ->get();

            foreach ($services as $srv) {
                $phone = trim($srv->contact_number ?? '');
                $name = trim($srv->customer_name);
                $key = $phone ? "phone:{$phone}" : "name:{$name}";

                if (!isset($existingCustomers[$key])) {
                    $existingCustomers[$key] = [
                        'name' => $name,
                        'phone' => $phone ?: null,
                        'vehicle_number' => $srv->vehicle_details ?: null,
                    ];
                }
            }
        }

        $counter = 1;
        foreach ($existingCustomers as $key => $custData) {
            $code = 'CUST-' . str_pad($counter, 5, '0', STR_PAD_LEFT);
            $counter++;

            DB::table('customers')->insertOrIgnore([
                'customer_code' => $code,
                'name' => $custData['name'],
                'phone' => $custData['phone'],
                'vehicle_number' => $custData['vehicle_number'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Link back to sales
            if (Schema::hasTable('sales')) {
                $q = DB::table('sales');
                if ($custData['phone']) {
                    $q->where('customer_phone', $custData['phone']);
                } else {
                    $q->where('customer_name', $custData['name']);
                }
                $q->update(['customer_code' => $code]);
            }

            // Link back to services
            if (Schema::hasTable('services')) {
                $q = DB::table('services');
                if ($custData['phone']) {
                    $q->where('contact_number', $custData['phone']);
                } else {
                    $q->where('customer_name', $custData['name']);
                }
                $q->update(['customer_code' => $code]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('services')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropColumn(['service_code', 'customer_code']);
            });
        }

        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn(['customer_code']);
            });
        }

        Schema::dropIfExists('customers');
    }
};
