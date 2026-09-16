<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Service;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $data = $this->getReportData($request);
        return response()->json($data);
    }

    public function downloadPdf(Request $request)
    {
        $data = $this->getReportData($request);
        
        $pdf = Pdf::loadView('reports.report', [
            'invoices' => $data['invoices'],
            'summary' => $data['summary']
        ]);

        return $pdf->download('report_'.date('Y-m-d').'.pdf');
    }

    public function download(Request $request)
    {
        $data = $this->getReportData($request);
        $invoices = $data['invoices'];

        $csvHeader = ['Invoice #', 'Date', 'Customer', 'Type', 'Items Summary', 'Base Amount', 'GST (18%)', 'Total Amount'];
        
        $callback = function() use ($invoices, $csvHeader) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $csvHeader);

            foreach ($invoices as $invoice) {
                fputcsv($file, [
                    $invoice['invoice_number'],
                    $invoice['date'],
                    $invoice['customer_name'],
                    $invoice['type'],
                    $invoice['items_summary'],
                    $invoice['amount'],
                    $invoice['gst'],
                    $invoice['total'],
                ]);
            }

            fclose($file);
        };

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="report_'.date('Y-m-d').'.csv"',
        ];

        return response()->stream($callback, 200, $headers);
    }

    private function getReportData(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $type = $request->query('type', 'All');
        $search = $request->query('search');

        // Map "Bills" filter alias to "Sale"
        $effectiveType = $type === 'Bills' ? 'Sale' : $type;

        $invoices = collect();

        // 1. Fetch Sales (Sale, Exchange, Quotation)
        if ($effectiveType === 'All' || in_array($effectiveType, ['Sale', 'Exchange', 'Quotation'])) {
            $salesQuery = Sale::with('items.product');

            if ($from) $salesQuery->whereDate('created_at', '>=', $from);
            if ($to) $salesQuery->whereDate('created_at', '<=', $to);
            if ($effectiveType !== 'All') $salesQuery->where('type', $effectiveType);
            
            if ($search) {
                $salesQuery->where(function($q) use ($search) {
                    $q->where('customer_name', 'like', "%{$search}%")
                      ->orWhere('id', 'like', "%{$search}%");
                });
            }

            $sales = $salesQuery->get();

            foreach ($sales as $sale) {
                $itemsSummary = $sale->items->map(function($item) {
                    $brand = $item->product ? $item->product->brand : 'Product';
                    $model = $item->product ? $item->product->model : '';
                    return "{$item->quantity}x {$brand} {$model}";
                })->implode(', ');

                $amount = $sale->total_amount / 1.18;
                $gst = $sale->total_amount - $amount;

                $prefix = match($sale->type) {
                    'Quotation' => 'QTN-',
                    'Exchange' => 'EXC-',
                    default => 'INV-',
                };

                $invoices->push([
                    'id' => 'sale-' . $sale->id,
                    'raw_id' => $sale->id,
                    'invoice_number' => $prefix . str_pad($sale->id, 5, '0', STR_PAD_LEFT),
                    'date' => $sale->created_at->toISOString(),
                    'customer_name' => $sale->customer_name,
                    'customer_phone' => $sale->customer_phone,
                    'vehicle_details' => $sale->vehicle_details,
                    'payment_method' => $sale->payment_method,
                    'type' => $sale->type ?: 'Sale',
                    'items_summary' => $itemsSummary,
                    'amount' => round($amount, 2),
                    'gst' => round($gst, 2),
                    'total' => round($sale->total_amount, 2),
                    'items' => $sale->items,
                ]);
            }
        }

        // 2. Fetch Services
        if ($effectiveType === 'All' || $effectiveType === 'Service') {
            $servicesQuery = Service::query();

            if ($from) $servicesQuery->whereDate('created_at', '>=', $from);
            if ($to) $servicesQuery->whereDate('created_at', '<=', $to);
            
            if ($search) {
                $servicesQuery->where(function($q) use ($search) {
                    $q->where('customer_name', 'like', "%{$search}%")
                      ->orWhere('id', 'like', "%{$search}%");
                });
            }

            $services = $servicesQuery->get();

            foreach ($services as $service) {
                $amount = $service->service_charge / 1.18;
                $gst = $service->service_charge - $amount;

                $invoices->push([
                    'id' => 'service-' . $service->id,
                    'raw_id' => $service->id,
                    'invoice_number' => 'SRV-' . str_pad($service->id, 5, '0', STR_PAD_LEFT),
                    'date' => $service->created_at->toISOString(),
                    'customer_name' => $service->customer_name,
                    'customer_phone' => $service->contact_number,
                    'vehicle_details' => $service->vehicle_details,
                    'payment_method' => 'Service',
                    'type' => 'Service',
                    'items_summary' => $service->complaint_type ?: $service->vehicle_details,
                    'amount' => round($amount, 2),
                    'gst' => round($gst, 2),
                    'total' => round($service->service_charge, 2),
                    'items' => [],
                ]);
            }
        }

        // Sort by date descending
        $sortedInvoices = $invoices->sortByDesc('date')->values();

        // Calculate Summary
        $summary = [
            'totalSales' => $invoices->sum('total'),
            'totalGST' => $invoices->sum('gst'),
            'totalProfit' => $invoices->sum('total') * 0.2, // Estimated 20% margin
            'invoiceCount' => $invoices->count(),
            'salesByType' => [
                'Sale' => $invoices->where('type', 'Sale')->sum('total'),
                'Exchange' => $invoices->where('type', 'Exchange')->sum('total'),
                'Service' => $invoices->where('type', 'Service')->sum('total'),
                'Quotation' => $invoices->where('type', 'Quotation')->sum('total'),
            ],
        ];

        return [
            'invoices' => $sortedInvoices,
            'summary' => $summary,
        ];
    }
}
