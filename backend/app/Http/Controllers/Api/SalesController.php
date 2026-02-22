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
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated) {
            $totalAmount = 0;
            $saleItems = [];

            foreach ($validated['items'] as $itemData) {
                $product = Product::lockForUpdate()->find($itemData['product_id']);
                
                if ($product->stock < $itemData['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->brand} {$product->model}");
                }

                $price = $product->price * $itemData['quantity'];
                $totalAmount += $price;

                $saleItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                ];

                $product->decrement('stock', $itemData['quantity']);
            }

            $sale = Sale::create([
                'customer_name' => $validated['customer_name'],
                'total_amount' => $totalAmount,
            ]);

            $sale->items()->createMany($saleItems);

            return response()->json($sale->load('items.product'), 201);
        });
    }

    public function show(Sale $sale)
    {
        return response()->json($sale->load('items.product'));
    }
}
