<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Customer;

class Sale extends Model
{
    protected $guarded = [];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'exchange_value' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_due' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::creating(function ($sale) {
            if (empty($sale->customer_code) && (!empty($sale->customer_name) || !empty($sale->customer_phone))) {
                $customer = Customer::ensureCustomer(
                    $sale->customer_name,
                    $sale->customer_phone,
                    $sale->vehicle_details
                );
                if ($customer) {
                    $sale->customer_code = $customer->customer_code;
                }
            }
        });
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function batterySerials()
    {
        return $this->hasMany(BatterySerial::class);
    }

    public function warrantyClaims()
    {
        return $this->hasMany(WarrantyClaim::class);
    }
}
