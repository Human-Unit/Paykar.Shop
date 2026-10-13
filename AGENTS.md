# Working instructions

- This assignment has a 3-day deadline. Prioritize a working, presentable product.
- Keep the stack: Next.js, TypeScript, App Router, Tailwind CSS; Python 3.12, FastAPI, Pydantic, SQLAlchemy 2.x, asyncpg, Alembic; PostgreSQL and Docker Compose.
- Keep the FastAPI backend simple. Catalog routes may use SQLAlchemy directly; add services only for shared business rules.
- Alembic is the only migration authority. Do not add database init SQL or create_all as an alternative.
- Do not introduce infrastructure without a real need. No microservices, Redis, Kafka, Kubernetes, payment gateways, or complex authentication.
- Guest checkout is the intended order flow. Do not add accounts yet.
- Keep openrouteservice keys exclusively in the FastAPI environment. Never expose secrets through NEXT_PUBLIC variables or browser requests.
- Routing metrics and delivery pricing are separate. Use configurable DELIVERY_FLAT_PRICE until explicitly instructed otherwise.
- Day 3 authorizes focused UX polish, hardening and submission verification. Scope is frozen after the complete final regression passes; fix only P0/P1 regressions afterward. Do not add auth, admin, payments or unrelated features.
- Obtain routing before opening the order transaction. Lock products in deterministic ID order, calculate Decimal totals from the database and preserve item snapshots.
- Distinguish mocked provider tests from real ORS/browser verification. Never claim live routing passed from mock results.
- Run relevant formatting, tests, lint, typecheck, and builds after changes. Report blocked checks honestly.
- Backend checks: compileall, pytest, Ruff check/format, Alembic upgrade/current against PostgreSQL. Frontend: npm lint/typecheck/build. Run browser smoke tests for shopping changes.
- Preserve unrelated work. Do not silently change the stack or expand the current phase.
- Do not commit unless explicitly requested. Do not push to remote repositories.
- When `/graphify` is invoked, read the installed graphify SKILL.md before taking other actions.

## Paykar Admin & Master Console Rules

The original assignment is complete. Later explicitly authorized administration,
design editing and grocery measurement work extends that baseline; unrelated
features remain frozen. Preserve accepted storefront and commerce behavior.

- Keep three distinct surfaces: expressive storefront, dense operational Admin,
  and controlled preview-first Master Design. Do not make Admin a marketing page.
- Use predictable index → detail → edit/create workflows. Large product,
  promotion and store edits belong on detail pages; small edits use accessible
  drawers. Keep resource state in URLs and handle growing lists on the server.
- Reuse admin headers, filter bars, tables, status badges, drawers and save bars.
  Group navigation by Operations, Catalog, Locations, Master and System. Hide
  Master links from ADMIN, and enforce every privileged operation in the backend.
- Keep dangerous actions separate, explicitly worded and confirmed. Every
  mutation needs pending, success/error and refreshed-state feedback. Never
  fabricate analytics, store metadata, orders or templates.
- Prepare reusable boundaries for later bulk/grid/global-search work; do not
  introduce those features without an explicit scoped requirement.
- Inline Master Mode edits the real storefront through explicitly registered
  safe regions. No arbitrary DOM/CSS/HTML/JavaScript editing, code injection or
  general page builder. Keep region/token allowlists in backend/frontend parity.
- Reuse the existing typed design JSON, immutable versions, CSRF/session checks,
  publish/restore APIs and public design consumer. Resolve global → page → section.
  Scoped reset must preserve other scopes. Restore creates a new draft.
- Draft/local previews apply only in the verified MASTER tab. Public responses
  contain published configuration only. Save is never Publish; publication is
  explicit and confirmed. Preserve edits on collapse and storefront navigation.
- Lazy-load editor JavaScript only after backend role verification. Editor failure
  must leave published/default storefront usable. Use a desktop drawer and mobile
  bottom sheet with keyboard focus, Escape, dirty-state warnings and reduced motion.
- Keep canonical Paykar Default visually identical, including breakpoint behavior.
  Bind new tokens with exact existing CSS fallbacks; do not retheme bespoke shaders.
- Verify the rebuilt Docker service at localhost:3000. Cover MASTER/ADMIN/public
  isolation, draft reload/publication/restore, locale/theme, responsive editing and
  shopping regressions. Report real API checks separately from intercepted failures.
- Read `docs/admin/admin-ux-rules.md` and
  `docs/admin/inline-master-design-mode.md` before extending these surfaces.
- Do not commit or push unless separately requested.
