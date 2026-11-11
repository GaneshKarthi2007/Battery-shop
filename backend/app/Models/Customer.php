<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        if ($this->customer_code) {
            $digits = preg_replace('/\D/', '', (string)$this->customer_code);
            return $digits !== '' ? (string)(int)$digits : (string)$this->customer_code;
        }
        return (string) $this->id;
    }

    /**
     * Determine next sequential integer log ID.
     * Takes maximum of existing numeric codes and IDs, plus 1.
     */
    public static function getNextLogId(): int
    {
        $maxFromCode = self::query()
            ->whereNotNull('customer_code')
            ->pluck('customer_code')
            ->map(function ($code) {
                $digits = preg_replace('/\D/', '', (string)$code);
                return $digits !== '' ? (int)$digits : 0;
            })
            ->max() ?? 0;

        $maxFromId = (int) self::max('id');

        return max($maxFromCode, $maxFromId, 0) + 1;
    }

    /**
     * Ensure a customer exists in the master record and return the Customer model.
     * Supports manual log ID or generates next integer log ID.
     */
    public static function ensureCustomer(?string $name, ?string $phone, ?string $vehicleNumber = null, ?string $address = null, ?string $manualLogId = null): ?self
    {
        $name = trim($name ?? '');
        $phone = trim($phone ?? '');

        if (empty($name) && empty($phone)) {
            return null;
        }

        if (empty($name)) {
            $name = 'Customer ' . ($phone ?: 'Guest');
        }

        // Look up by manualLogId if provided
        if (!empty($manualLogId)) {
            $cleanLogId = preg_replace('/\D/', '', (string)$manualLogId);
            if ($cleanLogId !== '') {
                $intLogId = (string)(int)$cleanLogId;
                $existing = self::where('customer_code', $intLogId)
                    ->orWhere('customer_code', 'CUST-' . str_pad($intLogId, 5, '0', STR_PAD_LEFT))
                    ->first();
                if ($existing) {
                    return $existing;
                }
            }
        }

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

        if (!empty($manualLogId)) {
            $clean = preg_replace('/\D/', '', (string)$manualLogId);
            $customerCode = $clean !== '' ? (string)(int)$clean : (string) self::getNextLogId();
        } else {
            $customerCode = (string) self::getNextLogId();
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
