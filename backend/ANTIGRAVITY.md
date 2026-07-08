# ANTIGRAVITY.md — Battery Shop Backend (Laravel API)

This file guides **Google Antigravity** (and any agent reading `antigravity.md`/`agy`) working in `backend/`.

👉 **The canonical, single source of truth is [`AGENTS.md`](./AGENTS.md). Read it first.** It has the commands, architecture, and the exact test form for this Laravel API, shared by every AI agent. Monorepo-wide rules: [`../AGENTS.md`](../AGENTS.md).

## 🔒 The Golden Rule (restated — do not skip)

**Every time you build or change a feature here, you MUST write/update tests for it and they MUST pass (`composer test`) before the change is done.** Endpoints → Feature tests with `Sanctum::actingAs($user)`; services (e.g. `WatermarkService`) → Unit tests. A feature without tests is unfinished. Full form in `AGENTS.md`.
