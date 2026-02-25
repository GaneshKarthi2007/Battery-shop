<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRecord;
use Illuminate\Http\Request;

class ExchangeController extends Controller
{
    public function index()
    {
        return response()->json(ExchangeRecord::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'nullable|string',
            'customer_address' => 'nullable|string',
            'battery_brand' => 'required|string',
            'battery_model' => 'nullable|string',
            'valuation_amount' => 'required|numeric',
        ]);

        $record = ExchangeRecord::create($validated);

        return response()->json($record, 201);
    }

    public function show(ExchangeRecord $exchangeRecord)
    {
        return response()->json($exchangeRecord);
    }

    public function update(Request $request, ExchangeRecord $exchangeRecord)
    {
        $validated = $request->validate([
            'customer_name' => 'sometimes|string',
            'customer_phone' => 'nullable|string',
            'customer_address' => 'nullable|string',
            'battery_brand' => 'sometimes|string',
            'battery_model' => 'nullable|string',
            'valuation_amount' => 'sometimes|numeric',
            'status' => 'sometimes|string|in:pending,consumed',
        ]);

        $exchangeRecord->update($validated);

        return response()->json($exchangeRecord);
    }

    public function destroy(ExchangeRecord $exchangeRecord)
    {
        $exchangeRecord->delete();
        return response()->json(null, 204);
    }

    public function pendingExchanges(Request $request)
    {
        $query = ExchangeRecord::where('status', 'pending');
        
        if ($request->has('customer_name')) {
            $query->where('customer_name', 'like', '%' . $request->customer_name . '%');
        }

        return response()->json($query->latest()->get());
    }
}
