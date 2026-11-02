<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MiscTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MiscTransactionController extends Controller
{
    /**
     * Display a listing of miscellaneous transactions.
     */
    public function index(Request $request)
    {
        // Seed initial sample data if table is completely empty
        $this->seedInitialTransactionsIfEmpty();

        $query = MiscTransaction::query();

        if ($request->filled('type') && in_array(strtolower($request->type), ['cash', 'journal'])) {
            $query->whereRaw('LOWER(type) = ?', [strtolower($request->type)]);
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('particular', 'like', $search)
                  ->orWhere('entry_number', 'like', $search)
                  ->orWhere('debit_ledger', 'like', $search)
                  ->orWhere('credit_ledger', 'like', $search)
                  ->orWhere('bank_name', 'like', $search)
                  ->orWhere('cheque_no', 'like', $search);
            });
        }

        if ($request->filled('entry_number')) {
            $query->where('entry_number', 'like', '%' . trim($request->entry_number) . '%');
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('bank_name')) {
            $query->where('bank_name', 'like', '%' . trim($request->bank_name) . '%');
        }

        if ($request->filled('cheque_no')) {
            $query->where('cheque_no', 'like', '%' . trim($request->cheque_no) . '%');
        }

        if ($request->filled('amount')) {
            $amount = (float) $request->amount;
            $query->where(function ($q) use ($amount) {
                $q->where('debit_amount', $amount)
                  ->orWhere('credit_amount', $amount);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $transactions = $query->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $transactions,
            'summary' => [
                'total_debit' => $transactions->sum('debit_amount'),
                'total_credit' => $transactions->sum('credit_amount'),
                'count' => $transactions->count(),
            ],
        ]);
    }

    /**
     * Store a newly created transaction.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'type' => 'required|in:Cash,Journal,cash,journal',
            'particular' => 'required|string|max:500',
            'credit_entries' => 'required|array|min:1',
            'credit_entries.*.ledger' => 'required|string',
            'credit_entries.*.amount' => 'required|numeric|min:0',
            'credit_entries.*.balance' => 'nullable|numeric',
            'debit_entries' => 'required|array|min:1',
            'debit_entries.*.ledger' => 'required|string',
            'debit_entries.*.amount' => 'required|numeric|min:0',
            'debit_entries.*.balance' => 'nullable|numeric',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240',
            'bank_name' => 'nullable|string|max:150',
            'cheque_no' => 'nullable|string|max:100',
            'cheque_date' => 'nullable|date',
            'status' => 'nullable|string|max:50',
        ]);

        $type = ucfirst(strtolower($validated['type']));
        $creditTotal = collect($validated['credit_entries'])->sum('amount');
        $debitTotal = collect($validated['debit_entries'])->sum('amount');

        $creditLedgers = collect($validated['credit_entries'])->pluck('ledger')->filter()->unique()->join(', ');
        $debitLedgers = collect($validated['debit_entries'])->pluck('ledger')->filter()->unique()->join(', ');

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('misc-transactions', 'public');
        }

        $count = MiscTransaction::count();
        $entryNumber = 'TXN-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);

        $transaction = MiscTransaction::create([
            'entry_number' => $entryNumber,
            'date' => $validated['date'],
            'type' => $type,
            'particular' => $validated['particular'],
            'debit_amount' => $debitTotal,
            'credit_amount' => $creditTotal,
            'debit_ledger' => $debitLedgers ?: 'N/A',
            'credit_ledger' => $creditLedgers ?: 'N/A',
            'credit_entries' => $validated['credit_entries'],
            'debit_entries' => $validated['debit_entries'],
            'attachment_path' => $attachmentPath,
            'bank_name' => $validated['bank_name'] ?? null,
            'cheque_no' => $validated['cheque_no'] ?? null,
            'cheque_date' => $validated['cheque_date'] ?? null,
            'status' => $validated['status'] ?? 'Settled',
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Transaction saved successfully',
            'data' => $transaction,
        ], 201);
    }

    /**
     * Display the specified transaction.
     */
    public function show(MiscTransaction $miscTransaction)
    {
        return response()->json([
            'status' => 'success',
            'data' => $miscTransaction,
        ]);
    }

    /**
     * Remove the specified transaction.
     */
    public function destroy(MiscTransaction $miscTransaction)
    {
        if ($miscTransaction->attachment_path) {
            Storage::disk('public')->delete($miscTransaction->attachment_path);
        }

        $miscTransaction->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Transaction deleted successfully',
        ]);
    }

    /**
     * Seed initial reference sample transactions if table is empty.
     */
    protected function seedInitialTransactionsIfEmpty(): void
    {
        if (MiscTransaction::count() > 0) {
            return;
        }

        $initialRows = [
            [
                'entry_number' => 'TXN-00001',
                'date' => '2026-10-29',
                'type' => 'Cash',
                'particular' => 'KVT BSNL BILL',
                'debit_amount' => 1000.00,
                'credit_amount' => 0.00,
                'debit_ledger' => 'TELEPHONE EXPENSES',
                'credit_ledger' => 'CASH',
                'credit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
                'debit_entries' => [['ledger' => 'TELEPHONE EXPENSES', 'amount' => 1000.00]],
            ],
            [
                'entry_number' => 'TXN-00002',
                'date' => '2026-10-29',
                'type' => 'Journal',
                'particular' => 'BID ADVANCE-BSC02-MANI MALATHI-1 8/A-TMB LTD-CHQ NO:2430158',
                'debit_amount' => 1628250.00,
                'credit_amount' => 1628250.00,
                'debit_ledger' => 'PROCESSING_CHIT_PAYMENT',
                'credit_ledger' => 'TMB LTD',
                'credit_entries' => [['ledger' => 'TMB LTD', 'amount' => 1628250.00]],
                'debit_entries' => [['ledger' => 'PROCESSING_CHIT_PAYMENT', 'amount' => 1628250.00]],
                'bank_name' => 'TMB LTD',
                'cheque_no' => '2430158',
            ],
            [
                'entry_number' => 'TXN-00003',
                'date' => '2026-10-28',
                'type' => 'Journal',
                'particular' => 'BID ADVANCE-BSB04-SEETHALAKSHMI.S-15/A-TMB LTD-CHQ NO:02430157',
                'debit_amount' => 820000.00,
                'credit_amount' => 820000.00,
                'debit_ledger' => 'PROCESSING_CHIT_PAYMENT',
                'credit_ledger' => 'TMB LTD',
                'credit_entries' => [['ledger' => 'TMB LTD', 'amount' => 820000.00]],
                'debit_entries' => [['ledger' => 'PROCESSING_CHIT_PAYMENT', 'amount' => 820000.00]],
                'bank_name' => 'TMB LTD',
                'cheque_no' => '02430157',
            ],
            [
                'entry_number' => 'TXN-00004',
                'date' => '2026-10-28',
                'type' => 'Journal',
                'particular' => 'SHANTHI K - NO NAME',
                'debit_amount' => 107750.00,
                'credit_amount' => 107750.00,
                'debit_ledger' => 'TMB LTD',
                'credit_ledger' => 'ADVANCE FROM SUBSCRIPTION',
                'credit_entries' => [['ledger' => 'ADVANCE FROM SUBSCRIPTION', 'amount' => 107750.00]],
                'debit_entries' => [['ledger' => 'TMB LTD', 'amount' => 107750.00]],
            ],
            [
                'entry_number' => 'TXN-00005',
                'date' => '2026-10-27',
                'type' => 'Cash',
                'particular' => 'SARASWATHI POOJA FLOWER',
                'debit_amount' => 2000.00,
                'credit_amount' => 0.00,
                'debit_ledger' => 'OFFICE CONSUMABLES',
                'credit_ledger' => 'CASH',
                'credit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
                'debit_entries' => [['ledger' => 'OFFICE CONSUMABLES', 'amount' => 2000.00]],
            ],
            [
                'entry_number' => 'TXN-00006',
                'date' => '2026-10-26',
                'type' => 'Journal',
                'particular' => 'MUTHUKRISHNAN R PAY',
                'debit_amount' => 146250.00,
                'credit_amount' => 146250.00,
                'debit_ledger' => 'ADVANCE FROM SUBSCRIPTION',
                'credit_ledger' => 'TMB LTD',
                'credit_entries' => [['ledger' => 'TMB LTD', 'amount' => 146250.00]],
                'debit_entries' => [['ledger' => 'ADVANCE FROM SUBSCRIPTION', 'amount' => 146250.00]],
            ],
            [
                'entry_number' => 'TXN-00007',
                'date' => '2026-10-26',
                'type' => 'Cash',
                'particular' => 'SUZUKI SHOWROOM ADVANCE',
                'debit_amount' => 2000.00,
                'credit_amount' => 0.00,
                'debit_ledger' => 'VEHICLE EXPENSES',
                'credit_ledger' => 'CASH',
                'credit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
                'debit_entries' => [['ledger' => 'VEHICLE EXPENSES', 'amount' => 2000.00]],
            ],
            [
                'entry_number' => 'TXN-00008',
                'date' => '2026-10-22',
                'type' => 'Cash',
                'particular' => 'POOJA EXPENSES FLOWER',
                'debit_amount' => 4620.00,
                'credit_amount' => 0.00,
                'debit_ledger' => 'OFFICE CONSUMABLES',
                'credit_ledger' => 'CASH',
                'credit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
                'debit_entries' => [['ledger' => 'OFFICE CONSUMABLES', 'amount' => 4620.00]],
            ],
            [
                'entry_number' => 'TXN-00009',
                'date' => '2026-10-22',
                'type' => 'Cash',
                'particular' => 'RENGOVER CAR DIESEL',
                'debit_amount' => 4000.00,
                'credit_amount' => 0.00,
                'debit_ledger' => 'VEHICLE EXPENSES',
                'credit_ledger' => 'CASH',
                'credit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
                'debit_entries' => [['ledger' => 'VEHICLE EXPENSES', 'amount' => 4000.00]],
            ],
            [
                'entry_number' => 'TXN-00010',
                'date' => '2026-10-21',
                'type' => 'Cash',
                'particular' => 'SRI MUTHARAMMAN TRADERS SGST',
                'debit_amount' => 0.00,
                'credit_amount' => 900.00,
                'debit_ledger' => 'CASH',
                'credit_ledger' => 'SGST',
                'credit_entries' => [['ledger' => 'SGST', 'amount' => 900.00]],
                'debit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
            ],
            [
                'entry_number' => 'TXN-00011',
                'date' => '2026-10-21',
                'type' => 'Cash',
                'particular' => 'SIVA PERUMAL CGST',
                'debit_amount' => 0.00,
                'credit_amount' => 900.00,
                'debit_ledger' => 'CASH',
                'credit_ledger' => 'CGST',
                'credit_entries' => [['ledger' => 'CGST', 'amount' => 900.00]],
                'debit_entries' => [['ledger' => 'CASH', 'amount' => 0.00]],
            ],
            [
                'entry_number' => 'TXN-00012',
                'date' => '2026-10-18',
                'type' => 'Journal',
                'particular' => 'EB BILL',
                'debit_amount' => 15104.54,
                'credit_amount' => 15104.54,
                'debit_ledger' => 'E.B Bill Expenses',
                'credit_ledger' => 'TMB LTD',
                'credit_entries' => [['ledger' => 'TMB LTD', 'amount' => 15104.54]],
                'debit_entries' => [['ledger' => 'E.B Bill Expenses', 'amount' => 15104.54]],
            ],
        ];

        foreach ($initialRows as $row) {
            MiscTransaction::create(array_merge($row, [
                'status' => 'Settled',
            ]));
        }
    }
}

