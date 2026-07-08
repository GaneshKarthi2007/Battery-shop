# ANTIGRAVITY.md — Battery Shop Management (Workspace Root)

This file guides **Google Antigravity** (and any agent that reads `antigravity.md`/`agy`) working anywhere in this repository.

👉 **The canonical, single source of truth is [`AGENTS.md`](./AGENTS.md). Read it first.** It holds the repo layout, commands, architecture, and conventions shared by every AI agent so they all follow identical rules.

When you enter a subproject, also read that subproject's own file:
- `backend/ANTIGRAVITY.md` (Laravel API)
- `frontend/ANTIGRAVITY.md` (Admin / Staff SPA)

## 🔒 The Golden Rule (restated — do not skip)

**Every time you build or change a feature, you MUST write/update unit tests for it in the form prescribed by that subproject's `AGENTS.md`, and all tests MUST pass before the work is done.** A feature without tests is unfinished. Full details and the per-stack test form are in `AGENTS.md`.
