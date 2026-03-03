<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRecord extends Model
{
    protected $fillable = [
        'customer_name',
        'customer_phone',
        'customer_address',
        'battery_brand',
        'battery_model',
        'valuation_amount',
        'status',
    ];
}
