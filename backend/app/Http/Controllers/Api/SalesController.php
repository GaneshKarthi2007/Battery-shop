<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function index()
    {
        return response()->json(Sale::with('items.product')->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'nullable|string',
            'vehicle_details' => 'nullable|string',
            'installation_address' => 'nullable|string',
            'product_category' => 'nullable|string',
            'type' => 'sometimes|string|in:Sale,Exchange',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|required_without:items.*.service_id|exists:products,id',
            'items.*.service_id' => 'nullable|required_without:items.*.product_id|exists:services,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'extra_charges' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'exchange_record_id' => 'nullable|exists:exchange_records,id',
            'payment_method' => 'sometimes|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = Sale::create([
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'vehicle_details' => $validated['vehicle_details'] ?? null,
                'installation_address' => $validated['installation_address'] ?? null,
                'product_category' => $validated['product_category'] ?? null,
                'total_amount' => $validated['total_amount'],
                'type' => $validated['type'] ?? 'Sale',
                'extra_charges' => $validated['extra_charges'] ?? 0,
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'payment_method' => $validated['payment_method'] ?? 'Cash',
            ]);

            // Handle exchange record consumption
            if (!empty($validated['exchange_record_id'])) {
                \App\Models\ExchangeRecord::where('id', $validated['exchange_record_id'])
                    ->update(['status' => 'consumed']);
            }

            foreach ($validated['items'] as $itemData) {
                if (!empty($itemData['product_id'])) {
                    $product = Product::lockForUpdate()->find($itemData['product_id']);
                    
                    if ($product->stock < $itemData['quantity']) {
                        throw new \Exception("Insufficient stock for product: {$product->brand} {$product->model}");
                    }

                    $product->decrement('stock', $itemData['quantity']);
                }

                $sale->items()->create([
                    'product_id' => $itemData['product_id'] ?? null,
                    'service_id' => $itemData['service_id'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                ]);
            }

            return response()->json($sale->load('items.product', 'items.service'), 201);
        });
    }

    public function show(Sale $sale)
    {
        return response()->json($sale->load('items.product'));
    }
}
