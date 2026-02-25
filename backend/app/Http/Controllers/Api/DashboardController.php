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
    public function index(Request $request)
    {
        $user = $request->user();
        $totalSalesToday = Sale::whereDate('created_at', today())->sum('total_amount');
        $totalStock = Product::sum('stock');
        
        $pendingServicesQuery = Service::where('status', 'pending');
        if ($user->role === 'staff') {
            $pendingServicesQuery->where('assigned_to', $user->id);
        }
        $pendingServices = $pendingServicesQuery->count();

        $assignedJobs = [];
        if ($user->role === 'staff') {
            $assignedJobs = Service::where('assigned_to', $user->id)
                ->where('status', '!=', 'completed')
                ->latest()
                ->get();
        }
        
        // Simple mock for monthly profit (revenue based for now)
        $monthlyProfit = Sale::whereMonth('created_at', now()->month)->sum('total_amount') * 0.2;

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $dayExpression = $isSqlite 
            ? "strftime('%w', created_at)" 
            : "DATE_FORMAT(created_at, '%W')";

        $weeklySales = Sale::select(
            DB::raw("$dayExpression as day"),
            DB::raw('SUM(total_amount) as sales'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(7))
        ->groupBy('day')
        ->orderBy('created_at')
        ->get();

        // Convert SQLite numeric days (0-6) to Names if necessary, or just return as is
        if ($isSqlite) {
            $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            $weeklySales->transform(function ($item) use ($days) {
                $item->day = $days[(int)$item->day];
                return $item;
            });
        }

        $lowStockItems = Product::where('stock', '<', DB::raw('min_stock'))->get();

        return response()->json([
            'todaySales' => $totalSalesToday,
            'totalStock' => $totalStock,
            'pendingServices' => $pendingServices,
            'assignedJobs' => $assignedJobs,
            'monthlyProfit' => $monthlyProfit,
            'weeklySales' => $weeklySales,
            'lowStockItems' => $lowStockItems,
        ]);
    }
}
