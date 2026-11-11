<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ExchangeRecord;
use App\Models\Sale;
use App\Models\Service;
use App\Models\WarrantyClaim;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function nextLogId()
    {
        return response()->json([
            'next_log_id' => Customer::getNextLogId(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'vehicle_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'log_id' => 'nullable|string',
            'customer_code' => 'nullable|string',
        ]);

        $manualLogId = $request->input('log_id') ?? $request->input('customer_code');
        if (!empty($manualLogId)) {
            $clean = preg_replace('/\D/', '', (string)$manualLogId);
            if ($clean === '') {
                return response()->json(['message' => 'Log ID must be an integer.'], 422);
            }
            $customerCode = (string)(int)$clean;
            if (Customer::where('customer_code', $customerCode)->exists()) {
                return response()->json(['message' => "Customer Log ID #{$customerCode} is already in use."], 422);
            }
        } else {
            $customerCode = (string) Customer::getNextLogId();
        }

        $customer = Customer::create([
            'customer_code' => $customerCode,
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'vehicle_number' => $validated['vehicle_number'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return response()->json($customer, 201);
    }

    public function index(Request $request)
    {
        $search = trim($request->get('search', ''));

        // First, ensure all customers from sales and services exist in master with solid log IDs
        $this->syncMasterCustomersFromTransactions();

        $query = Customer::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('customer_code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('vehicle_number', 'like', "%{$search}%");

                // If user enters pure numbers e.g. "1" or "15", also match customer_code suffix / integer
                $numericSuffix = preg_replace('/\D/', '', $search);
                if ($numericSuffix !== '') {
                    $intVal = (string)(int)$numericSuffix;
                    $q->orWhere('customer_code', $intVal)
                      ->orWhere('id', (int)$intVal)
                      ->orWhere('customer_code', 'CUST-' . str_pad($intVal, 5, '0', STR_PAD_LEFT));
                }
            });
        }

        $customers = $query->orderBy('id', 'desc')->get();

        // Enrich with sales, services, exchanges, and warranty summaries
        $customerProfiles = $customers->map(function ($cust) {
            $phone = $cust->phone;
            $name = $cust->name;
            $code = $cust->customer_code;

            // Sales metrics
            $salesQuery = Sale::query();
            if ($code) {
                $salesQuery->where(function ($q) use ($code, $phone, $name) {
                    $q->where('customer_code', $code);
                    if ($phone) $q->orWhere('customer_phone', $phone);
                    $q->orWhere('customer_name', $name);
                });
            } else {
                $salesQuery->where(function ($q) use ($phone, $name) {
                    if ($phone) $q->where('customer_phone', $phone);
                    $q->orWhere('customer_name', $name);
                });
            }

            $salesTotal = (float)$salesQuery->sum('total_amount');
            $salesOutstanding = (float)$salesQuery->sum('balance_due');
            $salesCount = (int)$salesQuery->count();

            // Services count
            $servicesCount = Service::where(function ($q) use ($code, $phone, $name) {
                if ($code) $q->where('customer_code', $code);
                if ($phone) $q->orWhere('contact_number', $phone);
                $q->orWhere('customer_name', $name);
            })->count();

            // Exchanges count
            $exchangesCount = ExchangeRecord::where(function ($q) use ($phone, $name) {
                if ($phone) $q->where('customer_phone', $phone);
                $q->orWhere('customer_name', $name);
            })->count();

            // Warranty claims count
            $claimsCount = WarrantyClaim::where(function ($q) use ($phone, $name) {
                if ($phone) $q->where('customer_phone', $phone);
                $q->orWhere('customer_name', $name);
            })->count();

            // Batteries purchased count
            $batteriesPurchased = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where(function ($q) use ($code, $phone, $name) {
                    if ($code) $q->where('sales.customer_code', $code);
                    if ($phone) $q->orWhere('sales.customer_phone', $phone);
                    $q->orWhere('sales.customer_name', $name);
                })
                ->sum('sale_items.quantity');

            return [
                'id' => $cust->id,
                'customer_code' => $cust->customer_code,
                'log_id' => $cust->customer_code,
                'name' => $cust->name,
                'phone' => $cust->phone ?: 'N/A',
                'vehicle_number' => $cust->vehicle_number ?: 'N/A',
                'address' => $cust->address,
                'total_purchases' => $salesTotal,
                'total_outstanding' => $salesOutstanding,
                'total_sales_count' => $salesCount,
                'batteries_purchased' => (int)$batteriesPurchased,
                'exchanges_count' => (int)$exchangesCount,
                'services_count' => (int)$servicesCount,
                'claims_count' => (int)$claimsCount,
            ];
        });

        return response()->json($customerProfiles);
    }

    public function show(Request $request, string $identifier)
    {
        $identifier = trim(urldecode($identifier));
        $cleanDigits = preg_replace('/\D/', '', $identifier);

        // 1. First look up in Customer master by customer_code (log ID), phone, name, or numeric ID
        $query = Customer::where('customer_code', $identifier)
            ->orWhere('phone', $identifier)
            ->orWhere('name', $identifier);

        if ($cleanDigits !== '') {
            $intId = (string)(int)$cleanDigits;
            $query->orWhere('customer_code', $intId)
                  ->orWhere('id', (int)$intId)
                  ->orWhere('customer_code', 'CUST-' . str_pad($intId, 5, '0', STR_PAD_LEFT));
        }

        $customer = $query->first();

        $code = $customer?->customer_code;
        $name = $customer?->name;
        $phone = $customer?->phone;

        // If no master customer record found yet, extract and register
        if (!$customer) {
            $customer = Customer::ensureCustomer($identifier, is_numeric($identifier) ? $identifier : null);
            $code = $customer?->customer_code;
            $name = $customer?->name;
            $phone = $customer?->phone;
        }

        // Fetch all sales for this customer
        $sales = Sale::with(['items.product', 'batterySerials'])
            ->where(function ($q) use ($code, $identifier, $phone, $name) {
                if ($code) $q->where('customer_code', $code);
                if ($phone) $q->orWhere('customer_phone', $phone);
                if ($name) $q->orWhere('customer_name', $name);
                $q->orWhere('customer_phone', $identifier)
                  ->orWhere('customer_name', $identifier);
            })
            ->latest()
            ->get();

        // Fetch all services for this customer
        $services = Service::where(function ($q) use ($code, $identifier, $phone, $name) {
            if ($code) $q->where('customer_code', $code);
            if ($phone) $q->orWhere('contact_number', $phone);
            if ($name) $q->orWhere('customer_name', $name);
            $q->orWhere('contact_number', $identifier)
              ->orWhere('customer_name', $identifier);
        })
        ->latest()
        ->get();

        // Fetch exchanges
        $exchanges = ExchangeRecord::where(function ($q) use ($identifier, $phone, $name) {
            if ($phone) $q->where('customer_phone', $phone);
            if ($name) $q->orWhere('customer_name', $name);
            $q->orWhere('customer_phone', $identifier)
              ->orWhere('customer_name', $identifier);
        })
        ->latest()
        ->get();

        // Fetch warranty claims
        $warrantyClaims = WarrantyClaim::with(['product', 'batterySerial'])
            ->where(function ($q) use ($identifier, $phone, $name) {
                if ($phone) $q->where('customer_phone', $phone);
                if ($name) $q->orWhere('customer_name', $name);
                $q->orWhere('customer_phone', $identifier)
                  ->orWhere('customer_name', $identifier);
            })
            ->latest()
            ->get();

        $totalPurchases = (float)$sales->sum('total_amount');
        $outstanding = (float)$sales->sum('balance_due');
        $batteriesPurchased = (int)$sales->flatMap(fn($s) => $s->items)->sum('quantity');

        $customerName = $customer?->name ?? $sales->first()?->customer_name ?? $services->first()?->customer_name ?? $identifier;
        $customerPhone = $customer?->phone ?? $sales->first()?->customer_phone ?? $services->first()?->contact_number ?? $identifier;
        $vehicleNumber = $customer?->vehicle_number ?? $sales->first()?->vehicle_details ?? $services->first()?->vehicle_details ?? 'N/A';
        $customerCode = $customer?->customer_code ?? ('CUST-' . str_pad($customer?->id ?? 1, 5, '0', STR_PAD_LEFT));

        return response()->json([
            'profile' => [
                'id' => $customer?->id,
                'customer_code' => $customerCode,
                'log_id' => $customerCode,
                'name' => $customerName,
                'phone' => $customerPhone,
                'vehicle_number' => $vehicleNumber,
                'total_purchases' => $totalPurchases,
                'total_outstanding' => $outstanding,
                'batteries_purchased' => $batteriesPurchased,
                'exchanges_count' => $exchanges->count(),
                'services_count' => $services->count(),
                'claims_count' => $warrantyClaims->count(),
            ],
            'sales' => $sales,
            'services' => $services,
            'exchanges' => $exchanges,
            'warranty_claims' => $warrantyClaims,
        ]);
    }

    /**
     * Ensure any untracked customers from sales or services exist in master table.
     */
    protected function syncMasterCustomersFromTransactions(): void
    {
        // Check for sales without matching customer
        $distinctSales = Sale::select('customer_name', 'customer_phone', 'vehicle_details')
            ->whereNotNull('customer_name')
            ->where('customer_name', '!=', '')
            ->distinct()
            ->get();

        foreach ($distinctSales as $s) {
            Customer::ensureCustomer($s->customer_name, $s->customer_phone, $s->vehicle_details);
        }

        // Check for services without matching customer
        $distinctServices = Service::select('customer_name', 'contact_number', 'vehicle_details')
            ->whereNotNull('customer_name')
            ->where('customer_name', '!=', '')
            ->distinct()
            ->get();

        foreach ($distinctServices as $srv) {
            Customer::ensureCustomer($srv->customer_name, $srv->contact_number, $srv->vehicle_details);
        }
    }
}
