<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UpiPayment extends Model
{
    protected $fillable = [
        'amount',
        'status',
        'sale_data',
        'invoice_state',
        'upi_ref',
    ];

    protected $casts = [
        'sale_data'     => 'array',
        'invoice_state' => 'array',
    ];
}
