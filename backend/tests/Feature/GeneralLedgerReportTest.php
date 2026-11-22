<?php

namespace Tests\Feature;

use App\Models\MiscTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GeneralLedgerReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_general_ledger_report(): void
    {
        $this->getJson('/api/reports/general-ledger')->assertStatus(401);
    }

    public function test_staff_cannot_access_general_ledger_report(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $this->getJson('/api/reports/general-ledger')->assertStatus(403);
    }

    public function test_admin_can_fetch_general_ledger_report_for_all_ledgers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        MiscTransaction::create([
            'entry_number' => 'TXN-00001',
            'date' => '2026-10-29',
            'type' => 'Cash',
            'particular' => 'OFFICE INTERNET BILL',
            'debit_amount' => 1500.00,
            'credit_amount' => 0.00,
            'debit_ledger' => 'TELEPHONE EXPENSES',
            'credit_ledger' => 'CASH',
            'credit_entries' => [['ledger' => 'CASH', 'amount' => 1500.00]],
            'debit_entries' => [['ledger' => 'TELEPHONE EXPENSES', 'amount' => 1500.00]],
            'status' => 'Settled',
        ]);

        $response = $this->getJson('/api/reports/general-ledger');

        $response->assertOk()
            ->assertJsonStructure([
                'ledger',
                'opening_balance',
                'opening_balance_type',
                'total_debit',
                'total_credit',
                'closing_balance',
                'closing_balance_type',
                'count',
                'available_ledgers',
                'entries',
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('count'));
    }

    public function test_admin_can_filter_general_ledger_by_date_and_specific_ledger(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Transaction prior to date filter (contributes to opening balance for CASH)
        MiscTransaction::create([
            'entry_number' => 'TXN-00001',
            'date' => '2026-10-01',
            'type' => 'Cash',
            'particular' => 'INITIAL CASH CAPITAL DEPOSIT',
            'debit_amount' => 50000.00,
            'credit_amount' => 0.00,
            'debit_ledger' => 'CASH',
            'credit_ledger' => 'CAPITAL ACCOUNT',
            'credit_entries' => [['ledger' => 'CAPITAL ACCOUNT', 'amount' => 50000.00]],
            'debit_entries' => [['ledger' => 'CASH', 'amount' => 50000.00]],
            'status' => 'Settled',
        ]);

        // Transaction inside date filter
        MiscTransaction::create([
            'entry_number' => 'TXN-00002',
            'date' => '2026-10-15',
            'type' => 'Cash',
            'particular' => 'PRINTING & STATIONERY EXPENSES',
            'debit_amount' => 2000.00,
            'credit_amount' => 0.00,
            'debit_ledger' => 'OFFICE CONSUMABLES',
            'credit_ledger' => 'CASH',
            'credit_entries' => [['ledger' => 'CASH', 'amount' => 2000.00]],
            'debit_entries' => [['ledger' => 'OFFICE CONSUMABLES', 'amount' => 2000.00]],
            'status' => 'Settled',
        ]);

        $response = $this->getJson('/api/reports/general-ledger?ledger=CASH&from=2026-10-10&to=2026-10-20');

        $response->assertOk();
        $this->assertEquals('CASH', $response->json('ledger'));
        // Opening balance from TXN-00001 (50000 Dr)
        $this->assertEquals(50000, $response->json('opening_balance'));
        $this->assertEquals('Dr', $response->json('opening_balance_type'));

        // Inside the period: 1 transaction (2000 Credit from CASH)
        $this->assertEquals(1, $response->json('count'));
        $this->assertEquals(2000, $response->json('total_credit'));
        $this->assertEquals(48000, $response->json('closing_balance'));
        $this->assertEquals('Dr', $response->json('closing_balance_type'));
    }

    public function test_can_download_general_ledger_csv(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        MiscTransaction::create([
            'entry_number' => 'TXN-00001',
            'date' => '2026-10-15',
            'type' => 'Cash',
            'particular' => 'PETTY EXPENSE',
            'debit_amount' => 500.00,
            'credit_amount' => 0.00,
            'debit_ledger' => 'OFFICE CONSUMABLES',
            'credit_ledger' => 'CASH',
            'credit_entries' => [['ledger' => 'CASH', 'amount' => 500.00]],
            'debit_entries' => [['ledger' => 'OFFICE CONSUMABLES', 'amount' => 500.00]],
            'status' => 'Settled',
        ]);

        $response = $this->get('/api/reports/general-ledger/download?ledger=CASH');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
