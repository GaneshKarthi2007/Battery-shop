<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalSalesToday = Sale::whereDate('created_at', today())->sum('total_amount');
        $totalStock = Product::sum('stock');
        $pendingServices = Service::where('status', 'pending')->count();
        
        // Simple mock for monthly profit (revenue based for now)
        $monthlyProfit = Sale::whereMonth('created_at', now()->month)->sum('total_amount') * 0.2;

        $weeklySales = Sale::select(
            DB::raw('DATE_FORMAT(created_at, "%W") as day'),
            DB::raw('SUM(total_amount) as sales'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(7))
        ->groupBy('day')
        ->orderBy('created_at')
        ->get();

        $lowStockItems = Product::where('stock', '<', DB::raw('min_stock'))->get();

        return response()->json([
            'todaySales' => $totalSalesToday,
            'totalStock' => $totalStock,
            'pendingServices' => $pendingServices,
            'monthlyProfit' => $monthlyProfit,
            'weeklySales' => $weeklySales,
            'lowStockItems' => $lowStockItems,
        ]);
    }
}
