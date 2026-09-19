<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BatterySerial;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesController extends Controller
{
    public function index()
    {
        return response()->json(Sale::with(['items.product', 'items.service', 'batterySerials'])->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'nullable|string',
            'vehicle_details' => 'nullable|string',
            'installation_address' => 'nullable|string',
            'product_category' => 'nullable|string',
            'type' => 'sometimes|string|in:Sale,Exchange,Quotation',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|required_without:items.*.service_id|exists:products,id',
            'items.*.service_id' => 'nullable|required_without:items.*.product_id|exists:services,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.serial_numbers' => 'nullable|array',
            'items.*.serial_numbers.*' => 'string',
            'total_amount' => 'required|numeric',
            'extra_charges' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'exchange_record_id' => 'nullable|exists:exchange_records,id',
            'payment_method' => 'sometimes|string',
            'cash_amount' => 'nullable|numeric',
            'upi_amount' => 'nullable|numeric',
            'gst_enabled' => 'sometimes|boolean',
        ]);

        return DB::transaction(function () use ($validated) {
            $isQuotation = ($validated['type'] ?? 'Sale') === 'Quotation';

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
                'cash_amount' => $validated['cash_amount'] ?? null,
                'upi_amount' => $validated['upi_amount'] ?? null,
                'gst_enabled' => $validated['gst_enabled'] ?? true,
            ]);

            // Handle exchange record consumption
            if (!$isQuotation && !empty($validated['exchange_record_id'])) {
                \App\Models\ExchangeRecord::where('id', $validated['exchange_record_id'])
                    ->update(['status' => 'consumed']);
            }

            $processedServices = [];
            foreach ($validated['items'] as $itemData) {
                // Stock deduction for products
                if (!$isQuotation && !empty($itemData['product_id'])) {
                    $product = Product::lockForUpdate()->find($itemData['product_id']);
                    
                    if ($product->stock < $itemData['quantity']) {
                        throw new \Exception("Insufficient stock for product: {$product->brand} {$product->model}");
                    }

                    $product->decrement('stock', $itemData['quantity']);
                    $product->update([
                        'stock_status' => $product->stock == 0 ? 'out_of_stock' : ($product->stock <= $product->min_stock ? 'low_stock' : 'in_stock')
                    ]);

                    // Handle serial numbers
                    $serialNumbers = $itemData['serial_numbers'] ?? [];
                    $warrantyMonths = $product->warranty_months ?: 24;
                    $warrantyExpiryDate = now()->addMonths($warrantyMonths)->toDateString();

                    foreach ($serialNumbers as $sn) {
                        if (!empty($sn)) {
                            BatterySerial::updateOrCreate(
                                ['serial_number' => trim($sn)],
                                [
                                    'product_id' => $product->id,
                                    'purchase_price' => $product->purchase_price ?? 0,
                                    'selling_price' => $itemData['price'],
                                    'status' => 'sold',
                                    'purchase_date' => now()->toDateString(),
                                    'sale_id' => $sale->id,
                                    'customer_name' => $sale->customer_name,
                                    'customer_phone' => $sale->customer_phone,
                                    'vehicle_number' => $sale->vehicle_details,
                                    'warranty_expiry_date' => $warrantyExpiryDate,
                                ]
                            );
                        }
                    }
                }

                $sale->items()->create([
                    'product_id' => $itemData['product_id'] ?? null,
                    'service_id' => $itemData['service_id'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                ]);

                // Linked service resets
                if (!empty($itemData['service_id']) && !in_array($itemData['service_id'], $processedServices)) {
                    $service = \App\Models\Service::find($itemData['service_id']);
                    if ($service && $service->status === 'Converted to Order') {
                        $service->update([
                            'status' => 'Completed',
                            'status_updated_at' => now(),
                            'payment_status' => 'pending'
                        ]);
                    }
                    $processedServices[] = $itemData['service_id'];
                }
            }

            return response()->json($sale->load('items.product', 'items.service', 'batterySerials'), 201);
        });
    }

    public function show(Sale $sale)
    {
        return response()->json($sale->load('items.product', 'items.service', 'batterySerials'));
    }

    public function update(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'gst_enabled' => 'required|boolean',
        ]);

        $sale->update([
            'gst_enabled' => $validated['gst_enabled']
        ]);

        return response()->json($sale);
    }

    public function downloadPdf(Sale $sale)
    {
        $sale->load(['items.product', 'items.service', 'batterySerials']);
        
        $serialsByProduct = [];
        foreach ($sale->batterySerials as $ser) {
            $serialsByProduct[$ser->product_id][] = $ser;
        }

        $pdf = Pdf::loadView('reports.invoice', [
            'sale' => $sale,
            'serialsByProduct' => $serialsByProduct,
        ]);

        return $pdf->download('invoice_INV-'.str_pad($sale->id, 5, '0', STR_PAD_LEFT).'.pdf');
    }
}
