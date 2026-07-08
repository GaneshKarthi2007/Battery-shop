# AGENTS.md — Battery Shop Backend (Laravel API)

> **Single source of truth for every AI agent working in `backend/`.**
> `CLAUDE.md` and `ANTIGRAVITY.md` here are thin pointers to this file. Read this first.
> For monorepo-wide rules see the root [`../AGENTS.md`](../AGENTS.md).

## What this is

The Laravel 12 REST API for **Battery Shop Management** — the **single source of truth** for all business logic, authorization, and persistence behind the SPA in `../frontend`.

- **Framework:** Laravel 12.x · **PHP** 8.2+ · **DB:** MySQL in prod, sqlite `:memory:` in tests
- **Auth:** Laravel Sanctum (bearer tokens) · **AuthZ:** simple `role` column on `users` (checked in controllers)
- **Other:** `barryvdh/laravel-dompdf` for PDF reports/invoices, custom `WatermarkService` for GPS-tagged photo overlays, Laravel Sail/Pint/Pail for local dev

---

## 🔒 THE GOLDEN RULE — non-negotiable

**Every time you build or change a feature in this backend, you MUST write/update tests for it, and they MUST pass before the change is done.** A feature without tests is unfinished. This applies to every AI agent and every contributor.

### The required workflow — Change → Test → Verify

1. **Write the test(s)** in the prescribed form (see *Test Conventions* below).
   - New/changed **controller endpoint** → a **Feature test** (`tests/Feature/...Test.php`) hitting the route with `Sanctum::actingAs($user)`.
   - New/changed **service / calculator / pure business logic** (e.g. `WatermarkService`, pricing, receipt generation) → a **Unit test** (`tests/Unit/...Test.php`) instantiating the class directly.
   - **Bug fix** → a regression test that **fails before** your fix and **passes after**.
2. **Run the suite:** `composer test` (or `php artisan test`). Everything must be green, including your new tests.
3. **Cross-check docs:** if you changed API routes, request/response shape, env vars, or DB schema, update `../README.md`.
4. **Done only when green.** Never commit failing or untested feature code.

---

## Commands

```bash
composer install
cp .env.example .env && php artisan key:generate   # first-time setup
php artisan migrate                                # run migrations
composer run dev                                   # serve + queue + pail + vite (concurrently)
php artisan serve                                  # API only, http://localhost:8000

# Tests (THE important part)
composer test                                      # = php artisan config:clear && php artisan test
php artisan test                                   # full PHPUnit suite (Feature + Unit)
php artisan test --testsuite=Unit                  # Unit suite only
php artisan test --testsuite=Feature               # Feature suite only
php artisan test --filter=ServiceTest              # a single test class/method

# Quality
./vendor/bin/pint                                  # Laravel Pint (code style)
```

Test environment is configured in `phpunit.xml`: `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, sync queue, array cache/mail. No external DB needed.

---

## Architecture

### Layout
```
app/
  Http/Controllers/Api/
    DashboardController.php
    ProductController.php        ← Inventory / products
    SalesController.php          ← Battery sales + checkout
    ServiceController.php        ← Service jobs, pickup, voice notes, receipts, revisits
    ExchangeController.php       ← Battery exchanges (pending + CRUD)
    UpiPaymentController.php     ← UPI payment lifecycle (store/status/confirm/finalise)
    GpsPhotoController.php       ← GPS-tagged photos (index/store/show/destroy)
    NotificationController.php   ← User notifications (list, mark read)
    ReportController.php         ← Reports index + CSV/PDF downloads
    UserController.php           ← Staff listing
  Models/
    User, Product, Sale, SaleItem, Service, ServiceProcessFlow,
    ExchangeRecord, UpiPayment, GpsPhoto, Receipt, Notification
  Services/
    WatermarkService.php         ← GPS photo watermarking (business logic goes here)
  Providers/
routes/
  api.php          ← every /api/* route (login + Sanctum-protected group)
  web.php, console.php
database/          ← migrations, factories, seeders
tests/Feature, tests/Unit
```

### Key conventions
- **Controllers stay thin.** Put real logic in `app/Services/<Domain>/`. Test services with Unit tests, endpoints with Feature tests. When you add a new domain service, mirror the pattern of `WatermarkService`.
- **Authorization:** endpoints live inside the `Route::middleware('auth:sanctum')->group(...)` block in `routes/api.php`. Role-restricted actions read `$request->user()->role` (values: `admin`, `staff`, `developer`, …). Assert both authenticated and unauthenticated cases in Feature tests.
- **Model conventions:** eloquent models are in `app/Models/` and use factories from `database/factories/` in tests. Use `RefreshDatabase` for anything touching the DB.
- **API surface is un-versioned.** All routes are in `routes/api.php` under `/api/…`. Don't invent a `V1/`/`V2/` namespace — add controllers directly under `app/Http/Controllers/Api/`.
- **External I/O is faked in tests:** if you add HTTP calls, storage, or push notifications, fake them (`Http::fake([...])`, `Storage::fake()`). Never hit real services in tests.
- **Media / GPS photos:** photo uploads flow through `GpsPhotoController` → `WatermarkService`. Keep image processing there, not in the controller.

---

## Test Conventions (the prescribed form)

Tests extend `Tests\TestCase` and live under `tests/Feature` or `tests/Unit`. Follow the existing style in `tests/Feature/ServiceTest.php`.

**Feature test (endpoint) skeleton — matches this project's style:**
```php
<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SomethingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthorized_users_cannot_access_endpoint(): void
    {
        $this->getJson('/api/services')->assertStatus(401);
    }

    public function test_staff_can_list_available_services(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        Service::create([
            'customer_name'  => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details'=> 'Toyota Fortuner',
            'status'         => 'Pending',
        ]);

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonFragment(['customer_name' => 'Rajesh']);
    }
}
```

**Unit test (service) skeleton:**
```php
<?php
namespace Tests\Unit;

use App\Services\WatermarkService;
use Tests\TestCase;

class WatermarkServiceTest extends TestCase
{
    public function test_it_adds_gps_metadata_to_image(): void
    {
        $service = new WatermarkService();
        $result = $service->apply(/* … */);
        $this->assertNotEmpty($result);
    }
}
```

Rules:
- Use **factories** (`Database\Factories`) for test data; use `RefreshDatabase` for anything touching the DB.
- Always assert the things that matter for this domain: **role enforcement** (expect 401 unauthenticated / 403 when wrong role), **validation errors** (expect 422), and the shape of the JSON response the frontend actually consumes.
- Use `Sanctum::actingAs($user)` (as `ServiceTest` does) rather than `actingAs($user, 'sanctum')` — match the existing project style.
- Mock external collaborators (HTTP, storage, PDF generation). Pure-logic services should be tested without booting the whole framework where possible.
- Name tests behaviorally with `test_` prefix (e.g. `test_admin_can_delete_product`).

---

## Don'ts
- Don't put business logic in controllers or in the frontend.
- Don't bypass Sanctum auth or role checks.
- Don't hit real external services in tests.
- Don't invent `Api/V1/` or `Api/V2/` namespaces — this project keeps controllers flat under `Api/`.
- Don't commit a feature without its tests green (`composer test`).
- Don't add stray `test_*.php` / `scratch_*.php` files at the project root — real tests go in `tests/`.
