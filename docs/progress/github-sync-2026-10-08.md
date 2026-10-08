# GitHub synchronization — 2026-10-08

The user authorized fetching GitHub updates, integrating them with all pending local work, and pushing the result to `main`.

## Integration

- Checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop-main`.
- Remote: `https://github.com/Human-Unit/Paykar.Shop.git`.
- Starting local HEAD: `9b72b2a`; previously known remote `main`: `5275238`.
- Fetch discovered `ffc170d` (whole-somoni price normalization) and `6660ebc` (whole-somoni price presets) on remote `main`.
- Pending hero refinement, UI coherence Phases 1–3, audit documents and screenshot evidence were preserved in `00ea4ca`.
- Merged remote `main` without conflicts in `5dcbc55`. No history was rewritten. Other feature refs were fetched, not merged wholesale into `main`.
- Integration follow-up aligns the filter dialog's numeric keyboard hint and RU/TJ/EN validation copy with the incoming integer-price behavior. Frontend tests now assert outward rounding, reload persistence and integer validation. Backend facet tests verify whole-somoni boundaries and product coverage; inclusive adjacent presets may share a boundary.

The earlier Phase 1–3 report records pre-synchronization evidence. This note records the additional checks after integrating the incoming backend/query changes. No later UI phase was started.

## Verification

All final checks passed:

- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`.
- `npm run test:navigation` (4), `test:recommendations` (3), `test:catalog` (14), `test:shopping` (6): **27 tests, no skips**.
- Backend Ruff check and format check on `app/api/routes/products.py` and `tests/test_catalog.py`.
- Alembic upgrade against a temporary dedicated PostgreSQL 17 test database; full `pytest -q -p no:cacheprovider`: **137 passed, no skips**. Production database was not used for integration tests.
- Docker Compose builds for API/web and recreation of the local API/web services.
- Real local API/browser smoke at 390px and 1440px: legacy decimal bounds normalize outward; whole-price apply/reload; numeric keyboard hint; trigger focus restoration; integer API facet boundaries; product Add → cart → checkout-link access; fresh My Shopping retains curated sets without empty personal sections. No new order created and no browser page errors.
- Staged credential scan against configured secret values and private-key/GitHub-token patterns: PASS. No environment/credential file staged.
- `git diff --cached --check` and final working-tree whitespace check: PASS.

Initial failures were resolved before publication: two frontend assertions still expected decimal bounds; previously untracked audit Markdown contained whitespace errors. The first backend harness attempt could not write the Ruff cache on its read-only source mount; using `/tmp` resolved it. Its next run omitted the existing `/seed` mount and had two shopping-test fixture failures; adding the same read-only seed mount used by Compose produced all 137 passes. These were not production changes.

Nonblocking existing warnings: Node module-type advisory in frontend test scripts; Starlette/AnyIO deprecation warning in backend tests.

The temporary test database container is removed after verification. The combined source and evidence are published by a normal `git push origin main`; no force push is used. Remote HEAD and local working-tree status are checked after the push.
