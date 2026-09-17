<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
