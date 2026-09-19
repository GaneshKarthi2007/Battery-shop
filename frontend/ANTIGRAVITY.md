# ANTIGRAVITY.md — Battery Shop Frontend (Admin / Staff SPA)

This file guides **Google Antigravity** (and any agent reading `antigravity.md`/`agy`) working in `frontend/`.

👉 **The canonical, single source of truth is [`AGENTS.md`](./AGENTS.md). Read it first.** It has the commands, architecture, and the exact Vitest test form for this React 18 SPA, shared by every AI agent. Monorepo-wide rules: [`../AGENTS.md`](../AGENTS.md).

## 🔒 The Golden Rule (restated — do not skip)

**Every time you build or change a feature here, you MUST write/update unit tests (Vitest + React Testing Library) and they MUST pass (`npm run test`) before the change is done.** Components/pages → render/interaction tests; hooks → `renderHook`; api modules → mock `fetch` (or `vi.mock` the module); utils → input→output tests. If Vitest isn't wired up yet, set it up as part of the feature. A feature without tests is unfinished. Full form in `AGENTS.md`.
