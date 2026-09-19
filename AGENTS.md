# AGENTS.md — Battery Shop Management (Workspace Root)

> **Single source of truth for every AI agent (Claude Code, Antigravity, Cursor, Copilot, Codex, etc.) working anywhere in this repository.**
> `CLAUDE.md` and `ANTIGRAVITY.md` in this folder are thin pointers back to this file. Read this first.

## What this repo is

**Battery Shop Management** is a battery shop point-of-sale, service tracking, and inventory system. It is a two-folder project — a React SPA that consumes a Laravel REST API.

| Folder | Purpose | Stack | Has its own `AGENTS.md` |
|--------|---------|-------|--------------------------|
| `backend/` | REST API, business logic, auth, persistence | Laravel 12, PHP 8.2+, MySQL/SQLite, Sanctum | ✅ `backend/AGENTS.md` |
| `frontend/` | Admin / Staff / Developer SPA | React 18, Vite 6, TypeScript, Tailwind v4, Radix UI, MUI | ✅ `frontend/AGENTS.md` |

**Before working inside `backend/` or `frontend/`, open that folder's own `AGENTS.md`** — it has the stack-specific commands, conventions, and the exact unit-test form required there.

---

## 🔒 THE GOLDEN RULE — non-negotiable, every agent, every feature

**Every time you build or change a feature, you MUST write/update unit tests for it in the form prescribed by that subproject's `AGENTS.md`, and the tests MUST pass before the work is considered done.**

This rule is mandatory and applies to all AI agents and all human contributors. A feature without tests is an unfinished feature. Concretely, for **every** change you make:

1. **Write the test(s)** in the prescribed form for that subproject (Feature/Unit test in `backend/`, Vitest + React Testing Library in `frontend/`).
2. **Build / type-check** the subproject and confirm it compiles with no errors.
3. **Run the test suite** and confirm everything is green — including your new tests.
4. **Update docs** if the change touches anything documented (API endpoints, env vars, commands, architecture) — see `README.md`.
5. **Only then** is the change complete. Never commit red or untested feature code.

> Scope note: bug fixes get a regression test that fails before the fix and passes after. Pure refactors with no behavior change still must keep the existing suite green. Trivial non-code edits (typos, comments, docs) are exempt from new tests but must not break the build.

---

## Subproject quick reference

### `backend/` — Laravel API
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate     # first-time
php artisan migrate
composer test                                        # → php artisan test  (PHPUnit: Feature + Unit)
php artisan test --filter=ServiceTest                # single test
php artisan serve                                    # http://localhost:8000
```
Tests live in `backend/tests/Feature` and `backend/tests/Unit`, run against sqlite `:memory:`. See `backend/AGENTS.md`.

### `frontend/` — Admin / Staff SPA (React 18)
```bash
cd frontend
npm install
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build
npm run lint           # ESLint
npm run preview        # preview production build
# npm run test         # Vitest — set up as part of your feature if not yet wired (see frontend/AGENTS.md)
```

---

## Architecture at a glance

```
frontend/  ──►  backend/  (Laravel REST API)  ──►  MySQL / SQLite
   React 18 SPA         ├─ Auth: Sanctum bearer tokens
                        ├─ Roles: `role` column on users (admin, staff, developer, ...)
                        ├─ Routes: /api/* (single versionless namespace in routes/api.php)
                        └─ Media: local storage + WatermarkService for GPS-tagged photos
```

- The backend is the **single source of truth**. The frontend never embeds business logic that belongs in the API.
- Auth is Sanctum token-based. The frontend stores `auth_token` in `localStorage` and attaches it as `Authorization: Bearer …` via `src/app/api/client.ts`.
- Role-based access is enforced client-side by `ProtectedRoute` (see `frontend/src/app/components/ProtectedRoute.tsx`) and server-side by the controllers reading `user.role`.

## Domain modules

The system covers these business areas — respect module boundaries when adding features:

- **Sales / Checkout / Invoicing** (`BatterySales`, `Checkout`, `BatteryInvoice`, `SalesController`)
- **Battery Exchange** (`BatteryExchange`, `ExchangeController`, `ExchangeRecord`)
- **Service Management & Jobs** (`ServiceManagement`, `NewService`, `ServiceDetails`, `AssignedJobs`, `AvailableJobs`, `CompletedJobs`, `TasksWorkspace`, `ServiceController`, `Service`, `ServiceProcessFlow`)
- **Inventory / Products** (`Inventory`, `ProductController`, `Product`)
- **UPI Payments** (`UPIPayment`, `UpiPaymentController`, `UpiPayment`)
- **GPS Photos** (`GpsCamera`, `GpsPhotoDashboard`, `GpsPhotoController`, `GpsPhoto`, `WatermarkService`)
- **Notifications** (`Notifications`, `NotificationController`, `Notification`)
- **Reports** (`Reports`, `ReportController`)
- **User / Staff Management** (`UserManagement`, `UserController`, `User`)
- **Developer / Settings** (`DeveloperSettings`, `Settings`, `Profile`, `DeveloperContext`)

## Cross-cutting conventions for agents

- **Stay in scope.** Touch only the subproject(s) relevant to the task. Do not reach across `backend/` ↔ `frontend/` boundaries unless the task is explicitly full-stack.
- **Match surrounding code.** Follow the existing naming, structure, and idioms of the file you are editing — don't introduce a new style.
- **No secrets in code.** Use `.env` (backend) / Vite `import.meta.env` (frontend, `VITE_API_BASE_URL`). Never hardcode credentials or tokens.
- **Don't commit unless asked.** When you do, keep commits scoped and green (build + tests passing).
- **Keep docs in sync.** `README.md` is the human overview; update it when architecture, modules, or APIs change.

## Files an agent should know about (root)

- `README.md` — short human-readable overview of the project layout and setup.
- `Jenkinsfile` — CI pipeline definition.
- `init_db.php`, `push_to_github.ps1` — utility scripts.
- `backend/`, `frontend/` — the two apps, each with its own `AGENTS.md` / `CLAUDE.md` / `ANTIGRAVITY.md`.
