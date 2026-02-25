<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $guarded = [];

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
