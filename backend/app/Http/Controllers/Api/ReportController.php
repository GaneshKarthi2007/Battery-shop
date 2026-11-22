<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Service;
use App\Models\MiscTransaction;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $this->checkAccess($request);
        $data = $this->getReportData($request);
        return response()->json($data);
    }

    public function downloadPdf(Request $request)
    {
        $this->checkAccess($request);
        $data = $this->getReportData($request);
        
        $pdf = Pdf::loadView('reports.report', [
            'invoices' => $data['invoices'],
            'summary' => $data['summary']
        ]);

        return $pdf->download('report_'.date('Y-m-d').'.pdf');
    }

    public function download(Request $request)
    {
        $this->checkAccess($request);
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

    /**
     * General Ledger Report: credit and debit statements filtered by date and ledger.
     */
    public function generalLedger(Request $request)
    {
        $this->checkAccess($request);

        // Ensure sample transactions exist if table is fresh
        if (MiscTransaction::count() === 0 && class_exists(MiscTransactionController::class)) {
            app(MiscTransactionController::class)->index(new Request());
        }

        $ledger = $request->query('ledger', 'All');
        $from = $request->query('from') ?: $request->query('date_from');
        $to = $request->query('to') ?: $request->query('date_to');
        $type = $request->query('type', 'All');
        $search = $request->query('search');

        // 1. Gather all unique ledgers in the system
        $allTransactions = MiscTransaction::all();
        $ledgerSet = collect([
            'CASH', 'TMB LTD', 'HDFC BANK', 'SBI BANK', 'SALES REVENUE',
            'TELEPHONE EXPENSES', 'OFFICE CONSUMABLES', 'VEHICLE EXPENSES',
            'E.B Bill Expenses', 'PROCESSING_CHIT_PAYMENT', 'ADVANCE FROM SUBSCRIPTION',
            'SGST', 'CGST', 'PURCHASE ACCOUNT', 'RENT EXPENSES', 'BATTERY SCRAP EXPENSES', 'MISC EXPENSES'
        ]);

        foreach ($allTransactions as $tx) {
            if ($tx->debit_ledger) {
                foreach (explode(',', $tx->debit_ledger) as $l) {
                    $l = trim($l);
                    if ($l && $l !== 'N/A') $ledgerSet->push($l);
                }
            }
            if ($tx->credit_ledger) {
                foreach (explode(',', $tx->credit_ledger) as $l) {
                    $l = trim($l);
                    if ($l && $l !== 'N/A') $ledgerSet->push($l);
                }
            }
            if (is_array($tx->debit_entries)) {
                foreach ($tx->debit_entries as $entry) {
                    if (!empty($entry['ledger'])) $ledgerSet->push(trim($entry['ledger']));
                }
            }
            if (is_array($tx->credit_entries)) {
                foreach ($tx->credit_entries as $entry) {
                    if (!empty($entry['ledger'])) $ledgerSet->push(trim($entry['ledger']));
                }
            }
        }
        $availableLedgers = $ledgerSet->unique()->sort()->values();

        // 2. Calculate Opening Balance before $from
        $openingBalance = 0.0;
        if ($from && $ledger !== 'All') {
            $priorTransactions = MiscTransaction::whereDate('date', '<', $from)->get();
            foreach ($priorTransactions as $tx) {
                $debitPart = $this->calculateLedgerAmount($tx, $ledger, 'debit');
                $creditPart = $this->calculateLedgerAmount($tx, $ledger, 'credit');
                $openingBalance += ($debitPart - $creditPart);
            }
        }

        // 3. Query Transactions in Period
        $query = MiscTransaction::query();
        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }
        if ($type && $type !== 'All') {
            $query->whereRaw('LOWER(type) = ?', [strtolower($type)]);
        }
        if ($search) {
            $term = '%' . trim($search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('particular', 'like', $term)
                  ->orWhere('entry_number', 'like', $term)
                  ->orWhere('debit_ledger', 'like', $term)
                  ->orWhere('credit_ledger', 'like', $term)
                  ->orWhere('bank_name', 'like', $term)
                  ->orWhere('cheque_no', 'like', $term);
            });
        }

        $periodTransactions = $query->orderBy('date', 'asc')->orderBy('id', 'asc')->get();

        // 4. Filter by ledger & compute running balance
        $entries = collect();
        $runningBalance = $openingBalance;
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($periodTransactions as $tx) {
            if ($ledger !== 'All') {
                $hasDebit = $this->hasLedgerEntry($tx, $ledger, 'debit');
                $hasCredit = $this->hasLedgerEntry($tx, $ledger, 'credit');

                if (!$hasDebit && !$hasCredit) {
                    continue;
                }

                $debitAmount = $this->calculateLedgerAmount($tx, $ledger, 'debit');
                $creditAmount = $this->calculateLedgerAmount($tx, $ledger, 'credit');

                if ($debitAmount == 0 && $creditAmount == 0) {
                    if ($hasDebit) $debitAmount = (float) $tx->debit_amount;
                    if ($hasCredit) $creditAmount = (float) ($tx->credit_amount ?: $tx->debit_amount);
                }

                $contraLedger = $hasDebit ? $tx->credit_ledger : $tx->debit_ledger;
            } else {
                $debitAmount = (float) $tx->debit_amount;
                $creditAmount = (float) $tx->credit_amount;
                $contraLedger = $tx->credit_ledger ?: $tx->debit_ledger ?: 'N/A';
            }

            $totalDebit += $debitAmount;
            $totalCredit += $creditAmount;
            $runningBalance += ($debitAmount - $creditAmount);

            $dateStr = $tx->date;
            if ($dateStr instanceof \DateTimeInterface) {
                $dateStr = $dateStr->format('Y-m-d');
            }

            $entries->push([
                'id' => $tx->id,
                'entry_number' => $tx->entry_number,
                'date' => $dateStr,
                'type' => $tx->type,
                'particular' => $tx->particular,
                'debit_ledger' => $tx->debit_ledger,
                'credit_ledger' => $tx->credit_ledger,
                'contra_ledger' => $contraLedger ?: 'N/A',
                'debit' => round($debitAmount, 2),
                'credit' => round($creditAmount, 2),
                'running_balance' => round(abs($runningBalance), 2),
                'balance_type' => $runningBalance >= 0 ? 'Dr' : 'Cr',
                'bank_name' => $tx->bank_name,
                'cheque_no' => $tx->cheque_no,
                'status' => $tx->status ?: 'Settled',
                'attachment_url' => $tx->attachment_url,
            ]);
        }

        $closingBalance = $runningBalance;
        $closingBalanceType = $closingBalance >= 0 ? 'Dr' : 'Cr';

        return response()->json([
            'ledger' => $ledger,
            'date_from' => $from,
            'date_to' => $to,
            'opening_balance' => round(abs($openingBalance), 2),
            'opening_balance_type' => $openingBalance >= 0 ? 'Dr' : 'Cr',
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'closing_balance' => round(abs($closingBalance), 2),
            'closing_balance_type' => $closingBalanceType,
            'count' => $entries->count(),
            'available_ledgers' => $availableLedgers,
            'entries' => $entries,
        ]);
    }

    /**
     * Download General Ledger report in CSV format.
     */
    public function downloadGeneralLedger(Request $request)
    {
        $this->checkAccess($request);
        $json = $this->generalLedger($request)->getData(true);
        $entries = $json['entries'] ?? [];
        $ledgerName = $json['ledger'] ?? 'All';

        $csvHeader = [
            'Entry #',
            'Date',
            'Type',
            'Particulars',
            'Contra / Account Ledger',
            'Debit Ledger',
            'Credit Ledger',
            'Debit Amount (INR)',
            'Credit Amount (INR)',
            'Running Balance',
            'Dr/Cr',
            'Bank / Cheque',
            'Status'
        ];

        $callback = function () use ($entries, $csvHeader) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $csvHeader);

            foreach ($entries as $e) {
                $bankCheque = trim(($e['bank_name'] ?? '') . ' ' . (!empty($e['cheque_no']) ? 'Chq:' . $e['cheque_no'] : ''));
                fputcsv($file, [
                    $e['entry_number'],
                    $e['date'],
                    $e['type'],
                    $e['particular'],
                    $e['contra_ledger'],
                    $e['debit_ledger'],
                    $e['credit_ledger'],
                    $e['debit'],
                    $e['credit'],
                    $e['running_balance'],
                    $e['balance_type'],
                    $bankCheque ?: 'N/A',
                    $e['status'],
                ]);
            }
            fclose($file);
        };

        $safeLedger = preg_replace('/[^a-zA-Z0-9_-]/', '_', $ledgerName);
        $filename = "General_Ledger_{$safeLedger}_" . date('Y-m-d') . ".csv";

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function hasLedgerEntry($tx, string $ledger, string $side): bool
    {
        $ledgerLower = strtolower(trim($ledger));
        $field = $side === 'debit' ? 'debit_ledger' : 'credit_ledger';
        if (str_contains(strtolower($tx->{$field} ?? ''), $ledgerLower)) {
            return true;
        }

        $entriesField = $side === 'debit' ? 'debit_entries' : 'credit_entries';
        if (is_array($tx->{$entriesField})) {
            foreach ($tx->{$entriesField} as $e) {
                if (isset($e['ledger']) && strtolower(trim($e['ledger'])) === $ledgerLower) {
                    return true;
                }
            }
        }
        return false;
    }

    private function calculateLedgerAmount($tx, string $ledger, string $side): float
    {
        $ledgerLower = strtolower(trim($ledger));
        $entriesField = $side === 'debit' ? 'debit_entries' : 'credit_entries';
        $sum = 0.0;
        $found = false;

        if (is_array($tx->{$entriesField})) {
            foreach ($tx->{$entriesField} as $e) {
                if (isset($e['ledger']) && strtolower(trim($e['ledger'])) === $ledgerLower) {
                    $sum += (float) ($e['amount'] ?? 0);
                    $found = true;
                }
            }
        }

        if (!$found) {
            $field = $side === 'debit' ? 'debit_ledger' : 'credit_ledger';
            if (str_contains(strtolower($tx->{$field} ?? ''), $ledgerLower)) {
                $amountField = $side === 'debit' ? 'debit_amount' : 'credit_amount';
                $amount = (float) ($tx->{$amountField} ?? 0);
                if ($amount == 0 && $tx->type === 'Cash' && $side === 'credit') {
                    $amount = (float) ($tx->debit_amount ?? 0);
                }
                return $amount;
            }
        }

        return $sum;
    }

    private function checkAccess(Request $request)
    {
        $role = $request->user()->role ?? '';
        if (!in_array($role, ['admin', 'developer', 'manager'])) {
            abort(403, 'Unauthorized. Only admins, developers, and managers can access reports.');
        }
    }
}
