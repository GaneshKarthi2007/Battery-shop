<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BatterySerial extends Model
{
    protected $guarded = [];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry_date' => 'date',
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function warrantyClaims()
    {
        return $this->hasMany(WarrantyClaim::class);
    }
}
