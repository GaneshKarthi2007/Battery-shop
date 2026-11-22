<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>General Ledger - {{ $ledger }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 15px;
            font-size: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #d97706;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #b45309;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header h2 {
            margin: 4px 0 0;
            color: #1e293b;
            font-size: 13px;
            font-weight: bold;
        }
        .header p {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 9px;
        }

        .summary-table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            text-align: center;
            border-radius: 4px;
        }
        .summary-card .label {
            font-size: 8px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        .summary-card .value {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
        }
        .summary-card .value.debit { color: #2563eb; }
        .summary-card .value.credit { color: #059669; }
        .summary-card .value.closing { color: #d97706; }

        table.ledger-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 15px;
        }
        table.ledger-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 6px;
            border: 1px solid #cbd5e1;
            font-size: 8px;
            text-align: left;
        }
        table.ledger-table th.right, table.ledger-table td.right {
            text-align: right;
        }
        table.ledger-table th.center, table.ledger-table td.center {
            text-align: center;
        }
        table.ledger-table td {
            padding: 5px 6px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        tr.even { background: #ffffff; }
        tr.odd { background: #f8fafc; }
        tr.opening-row {
            background: #f0fdf4;
            font-weight: bold;
            color: #166534;
        }
        tr.totals-row {
            background: #f8fafc;
            font-weight: bold;
            border-top: 2px solid #0f172a;
        }
        tr.totals-row td {
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
            font-size: 10px;
        }

        .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SMR BATTERY SHOP MANAGEMENT</h1>
        <h2>GENERAL LEDGER STATEMENT - {{ strtoupper($ledger) }}</h2>
        <p>Period: {{ $date_from ?: 'Beginning' }} to {{ $date_to ?: date('d-m-Y') }} | Generated: {{ date('d-m-Y h:i A') }}</p>
    </div>

    <!-- 4 Summary Cards matching requirements -->
    <table class="summary-table">
        <tr>
            <td width="25%" style="padding-right: 6px;">
                <div class="summary-card">
                    <div class="label">Opening Balance</div>
                    <div class="value">&#8377;{{ number_format($opening_balance, 2) }} {{ $opening_balance_type }}</div>
                </div>
            </td>
            <td width="25%" style="padding: 0 4px;">
                <div class="summary-card">
                    <div class="label">Total Outgoing (Debit)</div>
                    <div class="value debit">&#8377;{{ number_format($total_outgoing, 2) }}</div>
                </div>
            </td>
            <td width="25%" style="padding: 0 4px;">
                <div class="summary-card">
                    <div class="label">Total Income (Credit)</div>
                    <div class="value credit">&#8377;{{ number_format($total_income, 2) }}</div>
                </div>
            </td>
            <td width="25%" style="padding-left: 6px;">
                <div class="summary-card">
                    <div class="label">Closing Balance</div>
                    <div class="value closing">&#8377;{{ number_format($closing_balance, 2) }} {{ $closing_balance_type }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Ledger Table matching reference image -->
    <table class="ledger-table">
        <thead>
            <tr>
                <th width="4%" class="center">S.No.</th>
                <th width="10%">Date</th>
                <th width="11%">A/c / Entry #</th>
                <th width="24%">Particulars</th>
                <th width="15%">Account / Contra</th>
                <th width="11%" class="right">Debit (Outgoing)</th>
                <th width="11%" class="right">Credit (Income)</th>
                <th width="14%" class="right">Balance</th>
            </tr>
        </thead>
        <tbody>
            <!-- Opening Balance Row in Green -->
            <tr class="opening-row">
                <td class="center">-</td>
                <td>{{ $date_from ?: '-' }}</td>
                <td style="color: #64748b;">-</td>
                <td style="color: #166534;">Opening Balance</td>
                <td>-</td>
                <td class="right">{{ $opening_balance_type === 'Dr' && $opening_balance > 0 ? number_format($opening_balance, 2) : '' }}</td>
                <td class="right" style="color: #166534;">{{ $opening_balance_type === 'Cr' && $opening_balance > 0 ? number_format($opening_balance, 2) : '' }}</td>
                <td class="right" style="color: #166534;">{{ number_format($opening_balance, 2) }}{{ $opening_balance_type }}</td>
            </tr>

            <!-- Transaction rows -->
            @foreach($entries as $index => $row)
            <tr class="{{ $index % 2 == 0 ? 'even' : 'odd' }}">
                <td class="center">{{ $index + 1 }}</td>
                <td>{{ $row['date'] }}</td>
                <td style="font-weight: bold; color: #b45309;">{{ $row['entry_number'] }}</td>
                <td>
                    {{ $row['particular'] }}
                    @if(!empty($row['comments']))
                        <div style="font-size: 7.5px; color: #64748b;">{{ $row['comments'] }}</div>
                    @endif
                </td>
                <td style="color: #475569;">{{ $row['contra_ledger'] }}</td>
                <td class="right" style="color: #2563eb; font-weight: bold;">
                    {{ $row['debit'] > 0 ? number_format($row['debit'], 2) : '' }}
                </td>
                <td class="right" style="color: #059669; font-weight: bold;">
                    {{ $row['credit'] > 0 ? number_format($row['credit'], 2) : '' }}
                </td>
                <td class="right" style="font-weight: bold;">
                    {{ number_format($row['running_balance'], 2) }}{{ $row['balance_type'] }}
                </td>
            </tr>
            @endforeach

            <!-- Total Row -->
            <tr class="totals-row">
                <td colspan="5" style="text-align: right; text-transform: uppercase;">Total</td>
                <td class="right" style="color: #2563eb;">{{ number_format($total_outgoing, 2) }}</td>
                <td class="right" style="color: #059669;">{{ number_format($total_income, 2) }}</td>
                <td class="right" style="color: #b45309;">{{ number_format($closing_balance, 2) }}{{ $closing_balance_type }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        SMR Battery Shop Management System &bull; General Ledger Report &bull; Page 1 of 1
    </div>
</body>
</html>
