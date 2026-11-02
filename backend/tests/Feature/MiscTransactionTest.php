<?php

namespace Tests\Feature;

use App\Models\MiscTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MiscTransactionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'role' => 'admin',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_misc_transactions(): void
    {
        $response = $this->getJson('/api/misc-transactions');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_list_misc_transactions_and_seeds_defaults(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/misc-transactions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data',
            'summary' => [
                'total_debit',
                'total_credit',
                'count',
            ],
        ]);

        $this->assertGreaterThan(0, count($response->json('data')));
    }

    public function test_can_filter_transactions_by_type(): void
    {
        // First request seeds initial data
        $this->actingAs($this->user)->getJson('/api/misc-transactions');

        $response = $this->actingAs($this->user)->getJson('/api/misc-transactions?type=Cash');
        $response->assertStatus(200);
        foreach ($response->json('data') as $row) {
            $this->assertEquals('Cash', $row['type']);
        }

        $journalResponse = $this->actingAs($this->user)->getJson('/api/misc-transactions?type=Journal');
        $journalResponse->assertStatus(200);
        foreach ($journalResponse->json('data') as $row) {
            $this->assertEquals('Journal', $row['type']);
        }
    }

    public function test_can_create_journal_transaction(): void
    {
        $payload = [
            'date' => '2026-11-02',
            'type' => 'Journal',
            'particular' => 'OFFICE COMPUTER REPAIR AND UPS BATTERY MAINTENANCE',
            'credit_entries' => [
                ['ledger' => 'BANK OF BARODA', 'amount' => 4500.00, 'balance' => 4500.00],
            ],
            'debit_entries' => [
                ['ledger' => 'OFFICE CONSUMABLES', 'amount' => 4500.00, 'balance' => 4500.00],
            ],
            'bank_name' => 'BANK OF BARODA',
            'cheque_no' => '542198',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/misc-transactions', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Transaction saved successfully',
        ]);

        $this->assertDatabaseHas('misc_transactions', [
            'particular' => 'OFFICE COMPUTER REPAIR AND UPS BATTERY MAINTENANCE',
            'type' => 'Journal',
            'debit_amount' => 4500.00,
            'credit_amount' => 4500.00,
            'debit_ledger' => 'OFFICE CONSUMABLES',
            'credit_ledger' => 'BANK OF BARODA',
        ]);
    }

    public function test_can_create_cash_transaction(): void
    {
        $payload = [
            'date' => '2026-11-02',
            'type' => 'Cash',
            'particular' => 'TEA AND SNACKS EXPENSES FOR WORKSHOP',
            'credit_entries' => [
                ['ledger' => 'CASH', 'amount' => 350.00],
            ],
            'debit_entries' => [
                ['ledger' => 'OFFICE CONSUMABLES', 'amount' => 350.00],
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/misc-transactions', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('misc_transactions', [
            'particular' => 'TEA AND SNACKS EXPENSES FOR WORKSHOP',
            'type' => 'Cash',
            'credit_amount' => 350.00,
        ]);
    }

    public function test_validation_fails_on_missing_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/misc-transactions', [
            'date' => '2026-11-02',
            // missing type, particular, entries
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['type', 'particular', 'credit_entries', 'debit_entries']);
    }

    public function test_can_delete_transaction(): void
    {
        $transaction = MiscTransaction::create([
            'entry_number' => 'TXN-99999',
            'date' => '2026-11-02',
            'type' => 'Cash',
            'particular' => 'TEMPORARY TEST TO DELETE',
            'debit_amount' => 100.00,
            'credit_amount' => 100.00,
            'debit_ledger' => 'TEST DEBIT',
            'credit_ledger' => 'TEST CREDIT',
            'credit_entries' => [['ledger' => 'TEST CREDIT', 'amount' => 100.00]],
            'debit_entries' => [['ledger' => 'TEST DEBIT', 'amount' => 100.00]],
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/misc-transactions/{$transaction->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('misc_transactions', [
            'id' => $transaction->id,
        ]);
    }
}
