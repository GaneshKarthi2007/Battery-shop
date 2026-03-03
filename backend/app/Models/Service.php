<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Sale;
use App\Models\SaleItem;

class Service extends Model
{
    protected $guarded = [];

    protected $casts = [
        'assigned_at' => 'datetime',
        'resolved_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'pickup_date' => 'date',
    ];

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function sale()
    {
        return $this->hasOneThrough(Sale::class, SaleItem::class, 'service_id', 'id', 'id', 'sale_id');
    }
}
