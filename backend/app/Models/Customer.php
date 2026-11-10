<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_code',
        'name',
        'phone',
        'vehicle_number',
        'address',
    ];

    protected $appends = ['log_id'];

    public function getLogIdAttribute(): string
    {
        return $this->customer_code ?: ('CUST-' . str_pad($this->id, 5, '0', STR_PAD_LEFT));
    }

    /**
     * Ensure a customer exists in the master record and return the Customer model.
     * Generates a solid log ID (e.g. CUST-00001) if new.
     */
    public static function ensureCustomer(?string $name, ?string $phone, ?string $vehicleNumber = null, ?string $address = null): ?self
    {
        $name = trim($name ?? '');
        $phone = trim($phone ?? '');

        if (empty($name) && empty($phone)) {
            return null;
        }

        if (empty($name)) {
            $name = 'Customer ' . ($phone ?: 'Guest');
        }

        // Look up by phone if provided, otherwise by name
        $query = self::query();
        if (!empty($phone)) {
            $query->where('phone', $phone);
        } else {
            $query->where('name', $name);
        }

        $customer = $query->first();

        if ($customer) {
            // Update vehicle number or address if missing
            $dirty = false;
            if (empty($customer->vehicle_number) && !empty($vehicleNumber)) {
                $customer->vehicle_number = $vehicleNumber;
                $dirty = true;
            }
            if (empty($customer->address) && !empty($address)) {
                $customer->address = $address;
                $dirty = true;
            }
            if ($dirty) {
                $customer->save();
            }
            return $customer;
        }

        // Generate next solid customer log ID: CUST-00001, CUST-00002, etc.
        $nextNum = self::count() + 1;
        $customerCode = 'CUST-' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);

        // Guarantee uniqueness in case of gaps
        while (self::where('customer_code', $customerCode)->exists()) {
            $nextNum++;
            $customerCode = 'CUST-' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);
        }

        return self::create([
            'customer_code' => $customerCode,
            'name' => $name,
            'phone' => $phone ?: null,
            'vehicle_number' => $vehicleNumber ?: null,
            'address' => $address ?: null,
        ]);
    }
}
