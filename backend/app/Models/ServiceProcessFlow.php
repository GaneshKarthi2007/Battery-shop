<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceProcessFlow extends Model
{
    protected $guarded = [];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
