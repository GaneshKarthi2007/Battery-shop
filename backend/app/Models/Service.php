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

    protected $appends = ['log_id', 'display_log_id', 'voice_note_url'];

    public static function getNextLogId(): int
    {
        $maxFromCode = self::query()
            ->whereNotNull('service_code')
            ->pluck('service_code')
            ->map(function ($code) {
                $digits = preg_replace('/\D/', '', (string)$code);
                return $digits !== '' ? (int)$digits : 0;
            })
            ->max() ?? 0;

        $maxFromId = (int) self::max('id');

        return max($maxFromCode, $maxFromId, 0) + 1;
    }

    protected static function booted()
    {
        static::creating(function ($service) {
            if (empty($service->service_code)) {
                $service->service_code = (string) self::getNextLogId();
            }

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
    }

    /** Log ID with the shop-configured prefix applied (e.g. "SRV-12"). */
    public function getDisplayLogIdAttribute(): string
    {
        return Setting::serviceLogIdPrefix() . $this->log_id;
    }

    /**
     * Accessor: full public URL of the service-level voice note (null when none).
     */
    public function getVoiceNoteUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorage::class)->url($this->voice_note);
    }

    public function getLogIdAttribute(): string
    {
        if ($this->service_code) {
            $digits = preg_replace('/\D/', '', (string)$this->service_code);
            return $digits !== '' ? (string)(int)$digits : (string)$this->service_code;
        }
        return (string) $this->id;
    }

    /**
     * Resolve route binding allowing lookup by numeric ID, service_code, or legacy SRV-xxxxx.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $digits = preg_replace('/\D/', '', (string)$value);
        return $this->where('service_code', (string)$value)
            ->orWhere('id', $value)
            ->when($digits !== '', function ($q) use ($digits, $value) {
                $intVal = (string)(int)$digits;
                $q->orWhere('service_code', $intVal)
                  ->orWhere('id', (int)$intVal)
                  ->orWhere('service_code', 'SRV-' . str_pad($intVal, 5, '0', STR_PAD_LEFT));
            })
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
