# CLAUDE.md — Battery Shop Management (Workspace Root)

This file guides **Claude Code** working anywhere in this repository.

👉 **The canonical, single source of truth is [`AGENTS.md`](./AGENTS.md). Read it first.** Everything Claude needs — repo layout, commands, architecture, and conventions — lives there, so that every AI agent (Claude, Antigravity, Cursor, Copilot, …) follows the exact same rules.

When you enter a subproject, also read that subproject's own file:
- `backend/AGENTS.md` (Laravel API)
- `frontend/AGENTS.md` (Admin / Staff SPA)

## 🔒 The Golden Rule (restated — do not skip)

**Every time you build or change a feature, you MUST write/update unit tests for it in the form prescribed by that subproject's `AGENTS.md`, and all tests MUST pass before the work is done.** A feature without tests is unfinished. Full details and the per-stack test form are in `AGENTS.md`.
