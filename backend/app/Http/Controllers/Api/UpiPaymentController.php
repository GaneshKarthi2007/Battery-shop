<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UpiPayment;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ExchangeRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UpiPaymentController extends Controller
{
    /**
     * Create a new pending UPI payment record.
     * Frontend calls this when it loads the UPI payment page.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount'        => 'required|numeric|min:0',
            'sale_data'     => 'required|array',
            'invoice_state' => 'nullable|array',
        ]);

        $payment = UpiPayment::create([
            'amount'        => $validated['amount'],
            'sale_data'     => $validated['sale_data'],
            'invoice_state' => $validated['invoice_state'] ?? [],
            'status'        => 'pending',
        ]);

        return response()->json($payment, 201);
    }

    /**
     * Poll payment status.
     * Frontend calls this every 3 s.
     */
    public function status(UpiPayment $upiPayment)
    {
        return response()->json([
            'id'     => $upiPayment->id,
            'status' => $upiPayment->status,
        ]);
    }

    /**
     * Staff / counter confirms UPI payment received.
     * This marks status -> received.
     */
    public function confirm(Request $request, UpiPayment $upiPayment)
    {
        if ($upiPayment->status !== 'pending') {
            return response()->json(['message' => 'Payment already processed.'], 409);
        }

        $upiPayment->update([
            'status'  => 'received',
            'upi_ref' => $request->input('upi_ref'),
        ]);

        return response()->json(['status' => 'received']);
    }

    /**
     * Finalise sale after frontend detects confirmed status.
     * Creates the Sale + SaleItems + marks exchange record consumed.
     */
    public function finalise(UpiPayment $upiPayment)
    {
        if ($upiPayment->status !== 'received') {
            return response()->json(['message' => 'Payment not yet confirmed.'], 422);
        }

        $saleData = $upiPayment->sale_data;

        DB::beginTransaction();
        try {
            $sale = Sale::create([
                'customer_name'        => $saleData['customer_name'] ?? 'Walk-in Customer',
                'customer_phone'       => $saleData['customer_phone'] ?? null,
                'vehicle_details'      => $saleData['vehicle_details'] ?? null,
                'installation_address' => $saleData['installation_address'] ?? null,
                'product_category'     => $saleData['product_category'] ?? null,
                'total_amount'         => $saleData['total_amount'],
                'extra_charges'        => $saleData['extra_charges'] ?? 0,
                'discount_amount'      => $saleData['discount_amount'] ?? 0,
                'payment_method'       => 'UPI',
            ]);

            foreach ($saleData['items'] as $item) {
                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'] ?? null,
                    'service_id' => $item['service_id'] ?? null,
                    'quantity'   => $item['quantity'],
                    'price'      => $item['price'],
                ]);
            }

            if (!empty($saleData['exchange_record_id'])) {
                ExchangeRecord::where('id', $saleData['exchange_record_id'])
                    ->update(['status' => 'consumed']);
            }

            $upiPayment->update(['status' => 'finalised']);

            DB::commit();

            return response()->json(['sale_id' => $sale->id], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
