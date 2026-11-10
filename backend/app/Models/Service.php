<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Customer;

class Service extends Model
{
    protected $guarded = [];

    protected $casts = [
        'assigned_at' => 'datetime',
        'resolved_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'pickup_date' => 'date',
        'status_updated_at' => 'datetime',
        'billed_at' => 'datetime',
    ];

    protected $appends = ['log_id'];

    protected static function booted()
    {
        static::creating(function ($service) {
            // Link customer and assign customer_code
            if (empty($service->customer_code) && (!empty($service->customer_name) || !empty($service->contact_number))) {
                $customer = Customer::ensureCustomer(
                    $service->customer_name,
                    $service->contact_number,
                    $service->vehicle_details
                );
                if ($customer) {
                    $service->customer_code = $customer->customer_code;
                }
            }
        });

        static::created(function ($service) {
            // Assign solid service log ID (e.g. SRV-00001)
            if (empty($service->service_code)) {
                $service->service_code = 'SRV-' . str_pad($service->id, 5, '0', STR_PAD_LEFT);
                $service->saveQuietly();
            }
        });
    }

    public function getLogIdAttribute(): string
    {
        return $this->service_code ?: ('SRV-' . str_pad($this->id, 5, '0', STR_PAD_LEFT));
    }

    /**
     * Resolve route binding allowing lookup by ID or solid log ID (SRV-00001).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('service_code', $value)
            ->orWhere('id', $value)
            ->firstOrFail();
    }

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function sale()
    {
        return $this->hasOneThrough(Sale::class, SaleItem::class, 'service_id', 'id', 'id', 'sale_id');
    }

    /**
     * All sales and quotations linked to this service via sale_items.
     */
    public function sales()
    {
        // Fetch all Sale rows that have at least one SaleItem pointing to this service
        return $this->hasManyThrough(Sale::class, SaleItem::class, 'service_id', 'id', 'id', 'sale_id');
    }

    public function parentService()
    {
        return $this->belongsTo(Service::class, 'parent_id');
    }

    public function childServices()
    {
        return $this->hasMany(Service::class, 'parent_id');
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class);
    }

    public function processFlows()
    {
        return $this->hasMany(ServiceProcessFlow::class);
    }
}
