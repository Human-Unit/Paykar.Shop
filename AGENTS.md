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
