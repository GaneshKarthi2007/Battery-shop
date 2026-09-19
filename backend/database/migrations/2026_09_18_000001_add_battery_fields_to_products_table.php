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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'voltage')) {
                $table->string('voltage')->nullable()->default('12V')->after('ah');
            }
            if (!Schema::hasColumn('products', 'vehicle_compatibility')) {
                $table->string('vehicle_compatibility')->nullable()->after('voltage');
            }
            if (!Schema::hasColumn('products', 'purchase_price')) {
                $table->decimal('purchase_price', 15, 2)->nullable()->default(0)->after('price');
            }
            if (!Schema::hasColumn('products', 'warranty_months')) {
                $table->integer('warranty_months')->nullable()->default(24)->after('purchase_price');
            }
            if (!Schema::hasColumn('products', 'purchase_date')) {
                $table->date('purchase_date')->nullable()->after('warranty_months');
            }
            if (!Schema::hasColumn('products', 'stock_status')) {
                $table->string('stock_status')->default('in_stock')->after('stock');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'voltage',
                'vehicle_compatibility',
                'purchase_price',
                'warranty_months',
                'purchase_date',
                'stock_status'
            ]);
        });
    }
};
