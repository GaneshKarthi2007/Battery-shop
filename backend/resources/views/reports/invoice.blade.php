<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Tax Invoice - {{ $sale->id }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 11px; line-height: 1.4; }
        .invoice-box { max-width: 800px; margin: auto; padding: 15px; border: 1px solid #e2e8f0; background: #fff; }
        .header-table { width: 100%; border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 15px; }
        .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; letter-spacing: -0.5px; }
        .logo-accent { color: #16a34a; }
        .subtitle { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .shop-info { font-size: 10px; color: #475569; line-height: 1.3; }
        
        .inv-title { text-align: right; }
        .inv-badge { font-size: 16px; font-weight: bold; color: #16a34a; text-transform: uppercase; margin-bottom: 4px; }
        .inv-meta { font-size: 10px; color: #64748b; }
        
        .customer-table { width: 100%; margin-bottom: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
        .customer-title { font-size: 11px; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .items-table th { background: #0f172a; color: #ffffff; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
        .items-table td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .items-table .row-even { background: #ffffff; }
        .items-table .row-odd { background: #f8fafc; }
        .serial-tag { display: inline-block; font-family: monospace; background: #e0f2fe; color: #0369a1; padding: 2px 5px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-top: 2px; }
        
        .totals-table { width: 100%; margin-bottom: 15px; }
        .totals-left { width: 55%; vertical-align: top; font-size: 10px; color: #475569; }
        .totals-right { width: 45%; vertical-align: top; }
        .summary-row { display: table; width: 100%; border-bottom: 1px solid #f1f5f9; padding: 4px 0; }
        .summary-label { display: table-cell; font-weight: bold; color: #64748b; text-align: left; }
        .summary-val { display: table-cell; font-weight: bold; color: #0f172a; text-align: right; }
        .grand-total { background: #16a34a; color: #ffffff; padding: 8px; border-radius: 4px; margin-top: 6px; }
        .grand-total .summary-label, .grand-total .summary-val { color: #ffffff; font-size: 13px; font-weight: 900; }
        
        .terms-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 9px; color: #475569; margin-top: 15px; }
        .terms-title { font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 3px; }
        .footer-note { text-align: center; margin-top: 15px; font-size: 9px; color: #94a3b8; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <!-- Header -->
        <table class="header-table">
            <tr>
                <td width="60%">
                    <div class="logo-title">SMR <span class="logo-accent">BATTERY SHOP</span></div>
                    <div class="subtitle">Powering Your Journey</div>
                    <div class="shop-info">
                        GSTIN: 33AAAAA0000A1Z5 | Phone: +91 98765 43210<br/>
                        123 Main Road, Battery Market, Salem - 636001, Tamil Nadu
                    </div>
                </td>
                <td width="40%" class="inv-title">
                    <div class="inv-badge">{{ $sale->type === 'Quotation' ? 'QUOTATION' : ($sale->gst_enabled ? 'TAX INVOICE' : 'CASH BILL') }}</div>
                    <div class="inv-meta">Invoice #: <strong>INV-{{ str_pad($sale->id, 5, '0', STR_PAD_LEFT) }}</strong></div>
                    <div class="inv-meta">Date: <strong>{{ $sale->created_at->format('d/m/Y h:i A') }}</strong></div>
                    <div class="inv-meta">Payment Mode: <strong>{{ strtoupper($sale->payment_method ?: 'CASH') }}</strong></div>
                </td>
            </tr>
        </table>

        <!-- Customer & Vehicle Info -->
        <table class="customer-table">
            <tr>
                <td width="50%">
                    <div class="customer-title">Billed To</div>
                    <div><strong>Customer Name:</strong> {{ $sale->customer_name }}</div>
                    <div><strong>Mobile Number:</strong> {{ $sale->customer_phone ?: 'N/A' }}</div>
                    @if($sale->installation_address)
                    <div><strong>Address / Installation:</strong> {!! nl2br(e($sale->installation_address)) !!}</div>
                    @endif
                </td>
                <td width="50%">
                    <div class="customer-title">Vehicle & Usage Details</div>
                    @if($sale->vehicle_details)
                    <div><strong>Vehicle Info:</strong> {{ $sale->vehicle_details }}</div>
                    @endif
                    <div><strong>Category:</strong> {{ $sale->product_category ?: 'Automotive / Power' }}</div>
                    <div><strong>Sale Type:</strong> {{ $sale->type ?: 'Sale' }}</div>
                </td>
            </tr>
        </table>

        <!-- Line Items -->
        <table class="items-table">
            <thead>
                <tr>
                    <th width="5%">#</th>
                    <th width="40%">Item Description & Serial #</th>
                    <th width="15%">Warranty</th>
                    <th width="10%" class="text-right">Qty</th>
                    <th width="15%" class="text-right">Rate (&#8377;)</th>
                    <th width="15%" class="text-right">Total (&#8377;)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sale->items as $index => $item)
                <tr class="{{ $index % 2 == 0 ? 'row-even' : 'row-odd' }}">
                    <td>{{ $index + 1 }}</td>
                    <td>
                        @if($item->product)
                            <strong>{{ $item->product->brand }} {{ $item->product->model }}</strong> 
                            ({{ $item->product->ah }} {{ $item->product->type }})
                            @if(!empty($serialsByProduct[$item->product_id]))
                                <div>
                                    @foreach($serialsByProduct[$item->product_id] as $sn)
                                        <span class="serial-tag">S/N: {{ $sn->serial_number }}</span>
                                    @endforeach
                                </div>
                            @endif
                        @elseif($item->service)
                            <strong>Service Charge:</strong> {{ $item->service->complaint_type ?: 'Battery Service' }}
                        @else
                            <strong>Item</strong>
                        @endif
                    </td>
                    <td>
                        @if($item->product && $item->product->warranty_months)
                            {{ $item->product->warranty_months }} Months
                        @elseif($item->product && $item->product->warranty)
                            {{ $item->product->warranty }}
                        @else
                            Standard
                        @endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">&#8377;{{ number_format($item->price, 2) }}</td>
                    <td class="text-right">&#8377;{{ number_format($item->price * $item->quantity, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals & Payment Summary -->
        <table class="totals-table">
            <tr>
                <td class="totals-left">
                    <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">Payment Breakdown:</div>
                    @if($sale->payment_method === 'Split')
                        <div>Cash Paid: &#8377;{{ number_format($sale->cash_amount ?: 0, 2) }}</div>
                        <div>UPI Paid: &#8377;{{ number_format($sale->upi_amount ?: 0, 2) }}</div>
                    @else
                        <div>Method: {{ $sale->payment_method ?: 'Cash' }}</div>
                    @endif
                    
                    @if($sale->balance_due > 0)
                        <div style="color: #dc2626; font-weight: bold; margin-top: 4px;">Outstanding Balance Due: &#8377;{{ number_format($sale->balance_due, 2) }}</div>
                    @else
                        <div style="color: #16a34a; font-weight: bold; margin-top: 4px;">Status: PAID IN FULL</div>
                    @endif
                </td>
                <td class="totals-right">
                    @php
                        $subtotal = $sale->items->sum(fn($i) => $i->price * $i->quantity);
                        $discount = $sale->discount_amount ?: 0;
                        $taxable = max(0, $subtotal - $discount);
                        $cgst = $sale->gst_enabled ? ($taxable * 0.09) : 0;
                        $sgst = $sale->gst_enabled ? ($taxable * 0.09) : 0;
                        $grandTotal = $sale->total_amount;
                    @endphp
                    <div class="summary-row">
                        <span class="summary-label">Subtotal:</span>
                        <span class="summary-val">&#8377;{{ number_format($subtotal, 2) }}</span>
                    </div>
                    @if($discount > 0)
                    <div class="summary-row">
                        <span class="summary-label">Discount:</span>
                        <span class="summary-val" style="color: #dc2626;">-&#8377;{{ number_format($discount, 2) }}</span>
                    </div>
                    @endif
                    @if($sale->gst_enabled)
                    <div class="summary-row">
                        <span class="summary-label">CGST (9%):</span>
                        <span class="summary-val">&#8377;{{ number_format($cgst, 2) }}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">SGST (9%):</span>
                        <span class="summary-val">&#8377;{{ number_format($sgst, 2) }}</span>
                    </div>
                    @endif
                    <div class="grand-total summary-row">
                        <span class="summary-label">Grand Total:</span>
                        <span class="summary-val">&#8377;{{ number_format($grandTotal, 2) }}</span>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Terms & Conditions -->
        <div class="terms-box">
            <div class="terms-title">Terms & Conditions & Warranty Policy:</div>
            1. Warranty claims must be accompanied by this original Tax Invoice and physical battery with intact serial number.<br/>
            2. Physical damage, broken terminal posts, or electrical shorting due to vehicle wiring defects are excluded from warranty.<br/>
            3. Pro-rata replacement discount is applicable as per manufacturer policy after free-replacement period expires.
        </div>

        <div class="footer-note">
            Thank you for your business! SMR Battery Shop — Powering Your Journey.<br/>
            This is a computer-generated tax invoice.
        </div>
    </div>
</body>
</html>
