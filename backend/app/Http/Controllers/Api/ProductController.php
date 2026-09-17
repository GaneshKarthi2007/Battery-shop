<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BatterySerial;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with(['serials' => function ($q) {
            $q->where('status', 'available');
        }])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string',
            'model' => 'required|string',
            'type' => 'required|string',
            'ah' => 'required|string',
            'voltage' => 'nullable|string',
            'vehicle_compatibility' => 'nullable|string',
            'price' => 'required|numeric',
            'purchase_price' => 'nullable|numeric',
            'warranty_months' => 'nullable|integer',
            'purchase_date' => 'nullable|date',
            'stock' => 'required|integer',
            'min_stock' => 'required|integer',
            'supplier_name' => 'nullable|string',
            'warranty' => 'nullable|string',
            'serials' => 'nullable|array',
            'serials.*' => 'string',
        ]);

        $serials = $validated['serials'] ?? [];
        unset($validated['serials']);

        // Determine stock status
        $stock = (int)$validated['stock'];
        $minStock = (int)$validated['min_stock'];
        $validated['stock_status'] = $stock == 0 ? 'out_of_stock' : ($stock <= $minStock ? 'low_stock' : 'in_stock');

        $product = Product::create($validated);

        // Add serial numbers if provided
        foreach ($serials as $serialNum) {
            if (!empty($serialNum)) {
                BatterySerial::create([
                    'product_id' => $product->id,
                    'serial_number' => trim($serialNum),
                    'purchase_price' => $validated['purchase_price'] ?? 0,
                    'selling_price' => $validated['price'],
                    'status' => 'available',
                    'purchase_date' => $validated['purchase_date'] ?? now()->toDateString(),
                ]);
            }
        }

        return response()->json($product->load('serials'), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('serials'));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'brand' => 'sometimes|string',
            'model' => 'sometimes|string',
            'type' => 'sometimes|string',
            'ah' => 'sometimes|string',
            'voltage' => 'nullable|string',
            'vehicle_compatibility' => 'nullable|string',
            'price' => 'sometimes|numeric',
            'purchase_price' => 'nullable|numeric',
            'warranty_months' => 'nullable|integer',
            'purchase_date' => 'nullable|date',
            'stock' => 'sometimes|integer',
            'min_stock' => 'sometimes|integer',
            'supplier_name' => 'nullable|string',
            'warranty' => 'nullable|string',
            'serials' => 'nullable|array',
            'serials.*' => 'string',
        ]);

        $serials = $validated['serials'] ?? null;
        unset($validated['serials']);

        if (isset($validated['stock']) || isset($validated['min_stock'])) {
            $stock = (int)($validated['stock'] ?? $product->stock);
            $minStock = (int)($validated['min_stock'] ?? $product->min_stock);
            $validated['stock_status'] = $stock == 0 ? 'out_of_stock' : ($stock <= $minStock ? 'low_stock' : 'in_stock');
        }

        $product->update($validated);

        if ($serials !== null) {
            foreach ($serials as $serialNum) {
                if (!empty($serialNum)) {
                    BatterySerial::firstOrCreate(
                        ['serial_number' => trim($serialNum)],
                        [
                            'product_id' => $product->id,
                            'purchase_price' => $product->purchase_price ?? 0,
                            'selling_price' => $product->price,
                            'status' => 'available',
                            'purchase_date' => $product->purchase_date ?? now()->toDateString(),
                        ]
                    );
                }
            }
        }

        return response()->json($product->load('serials'));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    public function addSerial(Request $request, Product $product)
    {
        $validated = $request->validate([
            'serial_number' => 'required|string|unique:battery_serials,serial_number',
            'purchase_price' => 'nullable|numeric',
            'purchase_date' => 'nullable|date',
        ]);

        $serial = BatterySerial::create([
            'product_id' => $product->id,
            'serial_number' => trim($validated['serial_number']),
            'purchase_price' => $validated['purchase_price'] ?? $product->purchase_price ?? 0,
            'selling_price' => $product->price,
            'status' => 'available',
            'purchase_date' => $validated['purchase_date'] ?? now()->toDateString(),
        ]);

        // Increment stock
        $product->increment('stock');
        $product->update([
            'stock_status' => $product->stock <= $product->min_stock ? 'low_stock' : 'in_stock'
        ]);

        return response()->json($serial, 201);
    }
}
