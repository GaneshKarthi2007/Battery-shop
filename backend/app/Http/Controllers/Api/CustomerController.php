<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRecord;
use App\Models\Sale;
use App\Models\Service;
use App\Models\WarrantyClaim;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');

        // Extract unique customer names and phone numbers from sales, services, exchanges
        $salesCustomers = Sale::select(
            'customer_name',
            'customer_phone',
            DB::raw('COUNT(id) as total_sales'),
            DB::raw('SUM(total_amount) as total_purchases'),
            DB::raw('SUM(balance_due) as total_outstanding')
        )
        ->whereNotNull('customer_name')
        ->where('customer_name', '!=', '')
        ->groupBy('customer_name', 'customer_phone');

        if ($search) {
            $salesCustomers->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $customers = $salesCustomers->orderBy('customer_name')->get();

        // Enhance with count of services, exchanges, and warranty claims
        $customerProfiles = $customers->map(function ($cust) {
            $phone = $cust->customer_phone;
            $name = $cust->customer_name;

            $servicesCount = Service::where('customer_name', $name)
                ->orWhere(function ($q) use ($phone) {
                    if ($phone) $q->where('customer_phone', $phone);
                })->count();

            $exchangesCount = ExchangeRecord::where('customer_name', $name)
                ->orWhere(function ($q) use ($phone) {
                    if ($phone) $q->where('customer_phone', $phone);
                })->count();

            $claimsCount = WarrantyClaim::where('customer_name', $name)
                ->orWhere(function ($q) use ($phone) {
                    if ($phone) $q->where('customer_phone', $phone);
                })->count();

            $batteriesPurchased = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where('sales.customer_name', $name)
                ->sum('sale_items.quantity');

            return [
                'name' => $cust->customer_name,
                'phone' => $cust->customer_phone ?: 'N/A',
                'total_purchases' => (float)$cust->total_purchases,
                'total_outstanding' => (float)$cust->total_outstanding,
                'total_sales_count' => (int)$cust->total_sales,
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
        // $identifier can be customer phone or customer name (url decoded)
        $identifier = urldecode($identifier);

        $sales = Sale::with(['items.product', 'batterySerials'])
            ->where('customer_phone', $identifier)
            ->orWhere('customer_name', $identifier)
            ->latest()
            ->get();

        $services = Service::where('customer_phone', $identifier)
            ->orWhere('customer_name', $identifier)
            ->latest()
            ->get();

        $exchanges = ExchangeRecord::where('customer_phone', $identifier)
            ->orWhere('customer_name', $identifier)
            ->latest()
            ->get();

        $warrantyClaims = WarrantyClaim::with(['product', 'batterySerial'])
            ->where('customer_phone', $identifier)
            ->orWhere('customer_name', $identifier)
            ->latest()
            ->get();

        $totalPurchases = $sales->sum('total_amount');
        $outstanding = $sales->sum('balance_due');
        $batteriesPurchased = $sales->flatMap(fn($s) => $s->items)->sum('quantity');

        $customerName = $sales->first()?->customer_name ?? $services->first()?->customer_name ?? $identifier;
        $customerPhone = $sales->first()?->customer_phone ?? $services->first()?->customer_phone ?? $identifier;
        $vehicleNumber = $sales->first()?->vehicle_number ?? $services->first()?->vehicle_number ?? 'N/A';

        return response()->json([
            'profile' => [
                'name' => $customerName,
                'phone' => $customerPhone,
                'vehicle_number' => $vehicleNumber,
                'total_purchases' => (float)$totalPurchases,
                'total_outstanding' => (float)$outstanding,
                'batteries_purchased' => (int)$batteriesPurchased,
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
}
