# AGENTS.md — Battery Shop Frontend (Admin / Staff SPA)

> **Single source of truth for every AI agent working in `frontend/`.**
> `CLAUDE.md` and `ANTIGRAVITY.md` here are thin pointers to this file. Read this first.
> For monorepo-wide rules see the root [`../AGENTS.md`](../AGENTS.md).

## What this is

The **Battery Shop Management** admin / staff / developer dashboard — a React 18 SPA (Vite + TypeScript) that consumes the Laravel API in `../backend`.

- **Core:** React 18, React Router 7, TypeScript 5, Vite 6
- **UI:** Tailwind CSS v4 (`@tailwindcss/vite`), Radix UI primitives, MUI (`@mui/material` + `@mui/icons-material`), Emotion, `lucide-react`, `motion`, `sonner` toasts, `next-themes`
- **HTTP/State:** custom `fetch`-based client at `src/app/api/client.ts` (Bearer token from `localStorage`), React Context (`src/app/contexts/*`)
- **Forms / data:** `react-hook-form`, `react-day-picker`, `date-fns`, `recharts`
- **Domain-specific:** `leaflet` (maps), `html2pdf.js` (invoices), `browser-image-compression`, `react-slick`, `react-dnd`, `embla-carousel-react`, custom `AudioRecorder` + `ServiceGpsCamera` components

---

## 🔒 THE GOLDEN RULE — non-negotiable

**Every time you build or change a feature in this app, you MUST write/update unit tests for it, and they MUST pass before the change is done.** A feature without tests is unfinished. This applies to every AI agent and every contributor.

### The required workflow — Change → Test → Verify

1. **Write the test(s)** in the prescribed form (see *Test Conventions* below) using **Vitest + React Testing Library**.
   - New/changed **page or component** (`src/app/pages/`, `src/app/components/`) → render test asserting it shows the right thing and responds to user interaction.
   - New/changed **hook** (`src/app/hooks/`, e.g. `useCamera`, `useGeolocation`) → test with `renderHook` covering its states.
   - New/changed **api function** (`src/app/api/`, e.g. `client.ts`, `gpsPhotoApi.ts`) → test with `fetch` **mocked** (`vi.stubGlobal('fetch', vi.fn())`), asserting URL, method, headers, and response handling.
   - New/changed **util** (`src/app/utils/`, e.g. `cn.ts`) → plain unit test of inputs → outputs.
   - **Bug fix** → a test that **fails before** your fix and **passes after**.
2. **Type-check & build:** `npm run build` (`tsc -b && vite build`) must succeed with no errors.
3. **Run tests:** `npm run test` must be green, including your new tests.
4. **Lint:** `npm run lint` clean.
5. **Done only when green.** Never commit failing or untested feature code.

> The test runner for this repo is **Vitest**. If it is not wired up yet in your checkout, **set it up as part of your feature** (see *Setting up Vitest* below) — that is part of doing the work, not a reason to skip tests.

---

## Commands

```bash
npm install
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build  → dist/
npm run preview      # preview production build
npm run lint         # ESLint (flat config, typescript-eslint)
npm run test         # Vitest  (add script if missing — see below)
```

Environment: create `.env` (or `.env.local`) with `VITE_API_BASE_URL=http://localhost:8000/api` for local dev. The API base URL is read once by `src/app/api/client.ts`.

---

## Architecture

```
src/
  main.tsx                     ← Vite entrypoint, mounts <RouterProvider router={router} />
  styles/                      ← global CSS (Tailwind entry)
  app/
    App.tsx
    routes.tsx                 ← createBrowserRouter — every route lives here
    api/
      client.ts                ← fetch wrapper with Bearer-token injection
      gpsPhotoApi.ts           ← domain API modules; add more alongside
    contexts/
      AuthContext.tsx          ← login/logout, current user, token in localStorage
      NotificationContext.tsx  ← in-app notification stream
      ThemeContext.tsx         ← light/dark via next-themes
      DeveloperContext.tsx     ← feature flags / dev tools
    layouts/
      RoleBasedLayout.tsx      ← switches shell based on user.role
      MainLayout.tsx
      DeveloperLayout.tsx
    components/
      ProtectedRoute.tsx       ← auth + role gate for routes
      AudioRecorder/, service/, ui/, figma/, ServiceGpsCamera.tsx, Button.tsx, Input.tsx
    pages/                     ← one file per screen (BatterySales, BatteryExchange,
                                   ServiceManagement, NewService, ServiceDetails,
                                   AssignedJobs, AvailableJobs, CompletedJobs, TasksWorkspace,
                                   Inventory, Reports, Settings, Profile, UserManagement,
                                   UPIPayment, GpsCamera, GpsPhotoDashboard, Notifications,
                                   DeveloperSettings, Checkout, BatteryInvoice, Login, …)
    hooks/                     ← useCamera, useGeolocation, …
    utils/                     ← cn.ts (tailwind-merge helper), pure functions
```

### Conventions
- **All HTTP goes through `src/app/api/client.ts`.** Don't call `fetch` or `axios` directly in components; add or extend a module under `src/app/api/` (mirror the pattern of `gpsPhotoApi.ts`).
- **Auth tokens** are attached automatically by `client.ts` from `localStorage.auth_token`. Don't re-implement token handling in components or hooks.
- **Route gating** goes through `ProtectedRoute` with `allowedRoles={[…]}`. Don't scatter role checks inside pages.
- **Role-aware shell:** `RoleBasedLayout` picks the correct chrome based on `user.role`. Add new roles there, not per-page.
- **No business logic that belongs in the backend.** The API is the source of truth; the SPA renders and orchestrates.
- **Match existing folder placement:** a new service screen goes under `pages/` (top-level file) with reusable pieces under `components/service/`. Follow the naming already in `routes.tsx`.
- **Styling:** prefer Tailwind utility classes + Radix primitives + the `cn()` helper from `utils/cn.ts`. Use MUI only where existing pages already use it.
- Keep **components presentational**, push data-fetching into hooks/api modules so they can be unit-tested in isolation.

---

## Test Conventions (the prescribed form)

Tool: **Vitest** + **@testing-library/react** + **@testing-library/user-event**, JSDOM environment. Tests live in `src/**/*.test.tsx` / `*.test.ts` (colocated) or under a top-level `test/unit/` folder mirroring `src/`.

**Component test skeleton:**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BatterySales } from '@/app/pages/BatterySales';

describe('BatterySales', () => {
  it('shows the product list and fires onCheckout when clicked', async () => {
    const onCheckout = vi.fn();
    render(<BatterySales onCheckout={onCheckout} />);
    expect(screen.getByRole('heading', { name: /battery sales/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /checkout/i }));
    expect(onCheckout).toHaveBeenCalled();
  });
});
```

**API-module test skeleton (mock `fetch`, since `client.ts` uses it):**
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/app/api/client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    }));
    localStorage.setItem('auth_token', 'test-token');
  });

  it('sends a Bearer token and returns parsed JSON', async () => {
    const result = await apiClient.get<{ id: number }>('/products');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual({ id: 1 });
  });
});
```

**Hook test skeleton:**
```ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGeolocation } from '@/app/hooks/useGeolocation';

it('exposes coordinates once geolocation resolves', async () => {
  const { result } = renderHook(() => useGeolocation());
  // …drive the mock navigator.geolocation and assert result.current
});
```

**Util test skeleton:**
```ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/app/utils/cn';

it('merges tailwind classes', () => {
  expect(cn('px-2', 'px-4')).toBe('px-4');
});
```

Rules:
- Mock all network (`vi.stubGlobal('fetch', …)` or `vi.mock` a service module); never hit the real backend in unit tests.
- Test behavior users care about (rendered text, roles, interactions), not implementation details.
- Cover loading / empty / error states for data-driven components.
- Keep tests deterministic — fake timers/dates where logic depends on `Date`.

### Setting up Vitest (if not already present)
```bash
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/coverage-v8
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`. In `vite.config.ts` add a `test` block: `environment: 'jsdom'`, `globals: true`, `setupFiles: './test/setup.ts'` (import `@testing-library/jest-dom`). Configure the `@` alias to point at `src/` if it isn't already.

---

## Don'ts
- Don't bypass `apiClient` or duplicate auth/token logic in components.
- Don't put backend business logic in the SPA.
- Don't scatter role checks in pages — use `ProtectedRoute` + `RoleBasedLayout`.
- Don't ship a feature without Vitest tests green (`npm run test`).
- Don't break `npm run build` or `npm run lint`.
