<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Battery Shop Report</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
        .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; font-size: 14px; }
        
        .summary-grid { width: 100%; margin-bottom: 30px; }
        .summary-card { background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; }
        .summary-card p { margin: 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .summary-card h3 { margin: 5px 0 0; color: #1e293b; font-size: 18px; }

        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #1e293b; border-left: 4px solid #2563eb; padding-left: 10px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        th { background: #f1f5f9; color: #475569; text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
        td { padding: 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .row-even { background: #ffffff; }
        .row-odd { background: #f8fafc; }
        
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
        .badge-sale { background: #dcfce7; color: #166534; }
        .badge-exchange { background: #dbeafe; color: #1e40af; }
        .badge-service { background: #f3e8ff; color: #6b21a8; }
        
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .amount { text-align: right; font-weight: bold; }
    </style>
</head>
<body>
    <div className="header">
        <h1>Battery Shop Management</h1>
        <p>Business Activity Report</p>
        <p>Generated on: {{ date('F d, Y h:i A') }}</p>
    </div>

    <table className="summary-grid">
        <tr>
            <td width="25%">
                <div className="summary-card">
                    <p>Total Revenue</p>
                    <h3>₹{{ number_format($summary['totalSales'], 2) }}</h3>
                </div>
            </td>
            <td width="25%">
                <div className="summary-card">
                    <p>Total GST</p>
                    <h3>₹{{ number_format($summary['totalGST'], 2) }}</h3>
                </div>
            </td>
            <td width="25%">
                <div className="summary-card">
                    <p>Est. Profit</p>
                    <h3>₹{{ number_format($summary['totalProfit'], 2) }}</h3>
                </div>
            </td>
            <td width="25%">
                <div className="summary-card">
                    <p>Total Invoices</p>
                    <h3>{{ $summary['invoiceCount'] }}</h3>
                </div>
            </td>
        </tr>
    </table>

    <div className="section-title">Invoice History</div>
    <table>
        <thead>
            <tr>
                <th width="15%">Invoice #</th>
                <th width="15%">Date</th>
                <th width="20%">Customer</th>
                <th width="10%">Type</th>
                <th width="25%">Items Summary</th>
                <th width="15%" className="amount">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoices as $index => $invoice)
            <tr className="{{ $index % 2 == 0 ? 'row-even' : 'row-odd' }}">
                <td style="color: #2563eb; font-weight: bold;">{{ $invoice['invoice_number'] }}</td>
                <td>{{ date('d M, Y', strtotime($invoice['date'])) }}</td>
                <td>{{ $invoice['customer_name'] }}</td>
                <td>
                    <span className="badge badge-{{ strtolower($invoice['type']) === 'sale' ? 'sale' : (strtolower($invoice['type']) === 'exchange' ? 'exchange' : 'service') }}">
                        {{ $invoice['type'] }}
                    </span>
                </td>
                <td>{{ $invoice['items_summary'] }}</td>
                <td className="amount">₹{{ number_format($invoice['total'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div className="footer">
        © {{ date('Y') }} Battery Shop Management System. This is a computer-generated report.
    </div>
</body>
</html>
