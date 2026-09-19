<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRecord;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $timeframe = $request->get('timeframe', '7days'); // today, 7days, month, custom
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // Determine date range for filtering
        $queryStartDate = match ($timeframe) {
            'today' => Carbon::today(),
            '7days' => Carbon::now()->subDays(7)->startOfDay(),
            'month' => Carbon::now()->startOfMonth(),
            'all_time' => Carbon::create(2000, 1, 1)->startOfDay(),
            'custom' => $startDate ? Carbon::parse($startDate)->startOfDay() : Carbon::now()->subDays(30)->startOfDay(),
            default => Carbon::now()->subDays(7)->startOfDay(),
        };

        $queryEndDate = match ($timeframe) {
            'today' => Carbon::today()->endOfDay(),
            'custom' => $endDate ? Carbon::parse($endDate)->endOfDay() : Carbon::now()->endOfDay(),
            default => Carbon::now()->endOfDay(),
        };

        // --- Today's Business Metrics ---
        $todaySales = Sale::whereDate('created_at', Carbon::today())->sum('total_amount');
        
        // Calculate Today's Profit: Sales revenue minus item purchase costs today
        $todaySaleIds = Sale::whereDate('created_at', Carbon::today())->pluck('id');
        $todayItemsCost = DB::table('sale_items')
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->whereIn('sale_items.sale_id', $todaySaleIds)
            ->sum(DB::raw('COALESCE(sale_items.quantity, 1) * COALESCE(products.purchase_price, products.price * 0.75, 0)'));
        $todayProfit = max(0, $todaySales - $todayItemsCost);

        // Pending Payments (Unpaid or partial balance due in Sales + pending payments in Services)
        $pendingSalesBalance = Sale::where('payment_status', 'pending')
            ->orWhere('payment_status', 'partial')
            ->sum('balance_due');
        if ($pendingSalesBalance == 0) {
            $pendingSalesBalance = Sale::where('payment_status', 'pending')->sum('total_amount');
        }

        // Today's Exchanges Count & Value
        $todayExchangesCount = ExchangeRecord::whereDate('created_at', Carbon::today())->count();
        $todayExchangesValue = ExchangeRecord::whereDate('created_at', Carbon::today())->sum('valuation_amount');

        // Today's Service Orders Count
        $todayServicesCount = Service::whereDate('created_at', Carbon::today())->count();

        // Low Stock Count
        $lowStockCount = Product::where('stock', '<=', DB::raw('min_stock'))->count();
        $lowStockItems = Product::where('stock', '<=', DB::raw('min_stock'))->get();

        // Outstanding Customer Balance across all time
        $outstandingCustomerBalance = Sale::whereIn('payment_status', ['pending', 'partial', 'credit'])
            ->sum(DB::raw('CASE WHEN balance_due > 0 THEN balance_due ELSE total_amount END'));

        // --- Timeframe Selected Analytics ---
        $timeframeSales = Sale::whereBetween('created_at', [$queryStartDate, $queryEndDate])->sum('total_amount');

        // Payment Method Breakdown
        $paymentMethodsRaw = Sale::whereBetween('created_at', [$queryStartDate, $queryEndDate])
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('payment_method')
            ->get();
        $paymentMethodBreakdown = [
            'cash' => ['count' => 0, 'total' => 0],
            'upi' => ['count' => 0, 'total' => 0],
            'card' => ['count' => 0, 'total' => 0],
            'split' => ['count' => 0, 'total' => 0],
            'pending' => ['count' => 0, 'total' => 0],
        ];
        foreach ($paymentMethodsRaw as $pm) {
            $methodKey = strtolower($pm->payment_method ?: 'cash');
            if (isset($paymentMethodBreakdown[$methodKey])) {
                $paymentMethodBreakdown[$methodKey] = [
                    'count' => (int)$pm->count,
                    'total' => (float)$pm->total,
                ];
            } else {
                $paymentMethodBreakdown[$methodKey] = [
                    'count' => (int)$pm->count,
                    'total' => (float)$pm->total,
                ];
            }
        }

        // GST vs Non-GST Breakdown
        $gstSales = Sale::whereBetween('created_at', [$queryStartDate, $queryEndDate])
            ->where('gst_enabled', true);
        $gstSalesCount = (clone $gstSales)->count();
        $gstTotalAmount = (clone $gstSales)->sum('total_amount');
        $gstTaxAmount = $gstTotalAmount - ($gstTotalAmount / 1.18);

        $nonGstSales = Sale::whereBetween('created_at', [$queryStartDate, $queryEndDate])
            ->where('gst_enabled', false);
        $nonGstSalesCount = (clone $nonGstSales)->count();
        $nonGstTotalAmount = (clone $nonGstSales)->sum('total_amount');

        // Top Selling Batteries
        $topSellingBatteries = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.created_at', [$queryStartDate, $queryEndDate])
            ->whereNotNull('sale_items.product_id')
            ->select(
                'products.brand',
                'products.model',
                'products.ah',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.price * sale_items.quantity) as total_revenue')
            )
            ->groupBy('products.brand', 'products.model', 'products.ah')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // Trend Charts Data (Daily breakdown for Sales and Profit)
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $dateExpression = $isSqlite ? "date(created_at)" : "DATE(created_at)";

        $dailySalesRaw = Sale::select(
            DB::raw("$dateExpression as date_label"),
            DB::raw('SUM(total_amount) as sales'),
            DB::raw('COUNT(*) as count')
        )
        ->whereBetween('created_at', [$queryStartDate, $queryEndDate])
        ->groupBy('date_label')
        ->orderBy('date_label', 'ASC')
        ->get();

        $trendData = [];
        foreach ($dailySalesRaw as $row) {
            $date = $row->date_label;
            $daySaleIds = Sale::whereDate('created_at', $date)->pluck('id');
            $dayItemsCost = DB::table('sale_items')
                ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
                ->whereIn('sale_items.sale_id', $daySaleIds)
                ->sum(DB::raw('COALESCE(sale_items.quantity, 1) * COALESCE(products.purchase_price, products.price * 0.75, 0)'));
            
            $salesVal = (float)$row->sales;
            $profitVal = max(0, $salesVal - $dayItemsCost);

            $trendData[] = [
                'date' => Carbon::parse($date)->format('M d'),
                'sales' => $salesVal,
                'profit' => $profitVal,
                'count' => (int)$row->count,
            ];
        }

        // Staff specific stats
        $pendingServicesQuery = Service::where('status', 'pending');
        if ($user->role === 'staff') {
            $pendingServicesQuery->where('assigned_to', $user->id);
        }
        $pendingServices = $pendingServicesQuery->count();

        $assignedJobs = [];
        $myActiveJobs = 0;
        $completedToday = 0;
        if ($user->role === 'staff') {
            $assignedJobs = Service::where('assigned_to', $user->id)
                ->where('status', '!=', 'completed')
                ->latest()
                ->get();
            $myActiveJobs = Service::where('assigned_to', $user->id)
                ->where('status', 'In Progress')
                ->count();
            $completedToday = Service::where('assigned_to', $user->id)
                ->where('status', 'Completed')
                ->whereDate('resolved_at', Carbon::today())
                ->count();
        }

        $unassignedTasks = Service::whereNull('assigned_to')->where('status', 'pending')->count();
        $pendingServicePayments = Service::where('status', 'Completed')->where('payment_status', 'pending')->count();
        $escalatedTasks = Service::whereNotNull('assigned_to')
            ->where('status', 'In Progress')
            ->where('updated_at', '<', now()->subMinutes(30))
            ->count();

        return response()->json([
            // Summary Cards
            'todaySales' => (float)$todaySales,
            'todayProfit' => (float)$todayProfit,
            'pendingPayments' => (float)$pendingSalesBalance,
            'todayExchangesCount' => (int)$todayExchangesCount,
            'todayExchangesValue' => (float)$todayExchangesValue,
            'todayServicesCount' => (int)$todayServicesCount,
            'lowStockCount' => (int)$lowStockCount,
            'outstandingCustomerBalance' => (float)$outstandingCustomerBalance,

            // Selected Timeframe Analytics
            'timeframe' => $timeframe,
            'timeframeSales' => (float)$timeframeSales,
            'paymentMethodBreakdown' => $paymentMethodBreakdown,
            'gstBreakdown' => [
                'gstSalesCount' => $gstSalesCount,
                'gstTotalAmount' => (float)$gstTotalAmount,
                'gstTaxAmount' => (float)$gstTaxAmount,
                'nonGstSalesCount' => $nonGstSalesCount,
                'nonGstTotalAmount' => (float)$nonGstTotalAmount,
            ],
            'topSellingBatteries' => $topSellingBatteries,
            'trendData' => $trendData,

            // Legacy / Staff items for backwards compatibility
            'totalStock' => Product::sum('stock'),
            'pendingServices' => $pendingServices,
            'assignedJobs' => $assignedJobs,
            'monthlyProfit' => Sale::whereMonth('created_at', now()->month)->sum('total_amount') * 0.2,
            'weeklySales' => $trendData,
            'lowStockItems' => $lowStockItems,
            'serviceStats' => [
                'unassigned' => $unassignedTasks,
                'pendingPayments' => $pendingServicePayments,
                'escalated' => $escalatedTasks,
            ],
            'myActiveJobs' => $myActiveJobs,
            'completedToday' => $completedToday,
        ]);
    }
}
