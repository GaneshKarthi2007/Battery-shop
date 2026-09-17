<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BatterySerial;
use App\Models\WarrantyClaim;
use Illuminate\Http\Request;

class WarrantyClaimController extends Controller
{
    public function index(Request $request)
    {
        $query = WarrantyClaim::with(['product', 'batterySerial', 'sale']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('claim_number', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('vehicle_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $claims = $query->latest()->paginate(20);

        return response()->json($claims);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'serial_number' => 'required|string',
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'vehicle_number' => 'nullable|string',
            'issue_description' => 'required|string',
            'claim_type' => 'nullable|string|in:replacement,repair,prorata_refund',
            'product_id' => 'nullable|exists:products,id',
            'sale_id' => 'nullable|exists:sales,id',
            'purchase_date' => 'nullable|date',
            'warranty_expiry_date' => 'nullable|date',
            'inspection_notes' => 'nullable|string',
        ]);

        // Find battery serial if exists
        $batterySerial = BatterySerial::where('serial_number', $validated['serial_number'])->first();
        if ($batterySerial) {
            $validated['battery_serial_id'] = $batterySerial->id;
            $validated['product_id'] = $validated['product_id'] ?? $batterySerial->product_id;
            $validated['sale_id'] = $validated['sale_id'] ?? $batterySerial->sale_id;
            $validated['purchase_date'] = $validated['purchase_date'] ?? $batterySerial->purchase_date;
            $validated['warranty_expiry_date'] = $validated['warranty_expiry_date'] ?? $batterySerial->warranty_expiry_date;
            
            // Mark battery serial as in warranty claim
            $batterySerial->update(['status' => 'warranty_claim']);
        }

        $validated['claim_number'] = 'CLM-' . strtoupper(uniqid());
        $validated['status'] = 'pending_inspection';

        $claim = WarrantyClaim::create($validated);

        return response()->json($claim->load(['product', 'batterySerial']), 201);
    }

    public function show(WarrantyClaim $warrantyClaim)
    {
        return response()->json($warrantyClaim->load(['product', 'batterySerial', 'sale']));
    }

    public function update(Request $request, WarrantyClaim $warrantyClaim)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:pending_inspection,sent_to_manufacturer,approved,replaced,rejected',
            'claim_type' => 'nullable|string|in:replacement,repair,prorata_refund',
            'inspection_notes' => 'nullable|string',
            'replacement_serial_number' => 'nullable|string',
        ]);

        if (isset($validated['status']) && in_array($validated['status'], ['approved', 'replaced', 'rejected'])) {
            $validated['resolved_at'] = now();
        }

        // If replacement serial number provided, update battery serial status
        if (!empty($validated['replacement_serial_number'])) {
            $replacementSerial = BatterySerial::where('serial_number', $validated['replacement_serial_number'])->first();
            if ($replacementSerial) {
                $replacementSerial->update([
                    'status' => 'sold',
                    'customer_name' => $warrantyClaim->customer_name,
                    'customer_phone' => $warrantyClaim->customer_phone,
                    'vehicle_number' => $warrantyClaim->vehicle_number,
                    'purchase_date' => now()->toDateString(),
                ]);
            }
        }

        $warrantyClaim->update($validated);

        return response()->json($warrantyClaim->load(['product', 'batterySerial']));
    }

    public function checkWarranty(Request $request)
    {
        $serialNumber = $request->get('serial_number');
        if (!$serialNumber) {
            return response()->json(['message' => 'Serial number is required'], 422);
        }

        $batterySerial = BatterySerial::with(['product', 'sale'])->where('serial_number', $serialNumber)->first();
        
        if (!$batterySerial) {
            return response()->json([
                'exists' => false,
                'message' => 'Serial number not found in database',
            ]);
        }

        $isExpired = false;
        if ($batterySerial->warranty_expiry_date) {
            $isExpired = now()->gt($batterySerial->warranty_expiry_date);
        }

        return response()->json([
            'exists' => true,
            'battery_serial' => $batterySerial,
            'is_expired' => $isExpired,
            'warranty_expiry_date' => $batterySerial->warranty_expiry_date ? $batterySerial->warranty_expiry_date->toDateString() : null,
        ]);
    }
}
