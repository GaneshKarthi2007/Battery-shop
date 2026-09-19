<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function serials()
    {
        return $this->hasMany(BatterySerial::class);
    }
}
