# Administration MVP

## Audit and implementation sequence

The existing storefront uses guest orders, SQLAlchemy products/categories, product
`old_price` promotions, browser-owned shopping templates and an environment-owned
delivery origin. There was no authentication or database store directory. The
approved scope explicitly authorizes administrative authentication; guest checkout
and the frozen public design remain intact.

Implemented in dependency order: sessions/roles and Alembic migration → protected
operational endpoints → independent admin shell/forms → typed design versions and
preview → central public token loading → tests and actual Docker browser checks.
Existing uncommitted setup and My Shopping masthead work was preserved.

## Models and migration

`0004_administration`, after `0003_product_connections`, adds:

- `admin_users`: normalized unique email, name, Argon2id hash, ADMIN/MASTER, active,
  timestamps and last login.
- `admin_sessions`: SHA-256 digest of a random 256-bit session secret, user FK,
  CSRF secret and absolute expiry. Browser credentials are HttpOnly cookies.
- `admin_login_limits`: hashed account/shared proxy budget, attempts and expiry.
- `admin_audit`: actor, action, target and timestamp; no credentials/request bodies.
- `design_configs`: typed JSONB, monotonic version, author, status and timestamps.
- `stores`: exact eight pre-existing locations, addresses and coordinates.

No existing commerce table or guest order contract changes. Alembic owns all DDL.
No automatic administrator/password is seeded by default. An opt-in local presentation
bootstrap is described below. Directory values persist in PostgreSQL;
the public map consumes `/stores`, with the previous snapshot as an API-failure
fallback. Map component code, label placement, popup/selection and gesture logic
are unchanged. Zero enabled stores does not mount an empty Leaflet bounds set.

**Directory coordinates are not the checkout routing origin.** The latter remains
`STORE_LAT`/`STORE_LON`/`STORE_ADDRESS` in the API environment. Settings explains this
and is read-only. Directory editing never silently changes order routing/pricing.

## Authentication and authorization

Next's `/api/admin/[...path]` is a fixed-destination same-origin transport to
FastAPI `/api/v1/admin/*`. Only GET/POST, restricted path segments and selected
headers are forwarded; redirects are rejected and private responses are no-store.
It grants no privileges. FastAPI validates every protected request against a
non-expired session and active user; MASTER endpoints additionally check role.

Login requires the exact `WEB_ORIGIN`. Mutations additionally require the session's
`X-Admin-CSRF` secret. Cookie `paykar_admin` is HttpOnly, SameSite=Strict, path `/api`,
and Secure by default in API settings. Compose's explicit localhost development
setting disables Secure; HTTPS deployments must set `ADMIN_COOKIE_SECURE=true`.
Session length defaults to eight hours (bounded 1–24). Logout deletes the record;
account edits revoke that account's sessions. Passwords use argon2-cffi's Argon2id
defaults, with dummy verification for unknown accounts and rehash on valid login.

Failed login never identifies account existence. Eight failures per account and
64 failures per API peer/proxy in 15 minutes yield 429. PostgreSQL advisory locks
serialize budgets/hash work across workers; expired sessions/budgets are removed
at login. A proxy's shared failure budget can temporarily throttle other admins.
There is no MFA, email recovery, persistent "remember me" or customer auth.

Last-active-MASTER protection and bootstrap share a transaction advisory lock.
Role reassignment/disable cannot race away the last MASTER. Accounts are retained
for audit references; there is no destructive user/category/product delete route.

## Capabilities and API

All paths below are relative to `/api/v1/admin`.

| Method / endpoint                                                 | Permission            | Behavior                                           |
| ----------------------------------------------------------------- | --------------------- | -------------------------------------------------- |
| POST `auth/login`                                                 | origin-checked public | Create session cookie                              |
| GET `auth/me`, POST `auth/logout`                                 | ADMIN/MASTER          | Identity/CSRF; revoke session                      |
| GET `overview`                                                    | ADMIN/MASTER          | Actual product/category/order/store/sale counts    |
| GET `products`                                                    | ADMIN/MASTER          | Search name/SKU, category, stock, sale, pagination |
| GET `product-assets`                                              | ADMIN/MASTER          | Approved existing image-path allowlist             |
| POST `products`, `products/{id}`                                  | ADMIN/MASTER          | Create/edit actual product fields                  |
| POST `inventory/{id}`                                             | ADMIN/MASTER          | Expected-stock guarded absolute adjustment         |
| GET/POST `categories`, POST `categories/{id}`                     | ADMIN/MASTER          | Create/edit; validate parent/cycles                |
| GET `orders`, `orders/{uuid}`                                     | ADMIN/MASTER          | Paginated list and complete read-only snapshot     |
| GET `stores`, POST `stores/{id}`                                  | ADMIN/MASTER          | Persist directory fields; coordinate bounds        |
| GET `settings`                                                    | ADMIN/MASTER          | Sanitized non-secret runtime settings              |
| GET/POST `master/administrators`, POST `…/{id}`                   | MASTER                | Create/edit/enable/disable/role/password           |
| GET `master/audit`                                                | MASTER                | Latest 100 privileged actions                      |
| GET/POST `master/design`, POST `…/{id}/publish`, `…/{id}/restore` | MASTER                | Version lifecycle                                  |

Public GET `/api/v1/stores` returns enabled directory locations. Public GET
`/api/v1/design/public` returns only version and validated published tokens.

Products/promotions use the same product record, not parallel promotion data.
Previous price must exceed current price or be blank. Image choices are the 40
approved existing catalog assets in `app/data/product_assets.json`; empty uses
the existing fallback. Adding a new asset is deliberately a code-reviewed manifest
update, not an upload service. Existing Russian product names are edited as stored;
no unsupported localized-name columns are fabricated.

Product and inventory updates lock the product and require `expected_stock`.
If checkout changed stock since loading, saving returns 409 and requires reload.
Other simultaneous administrative field edits use last completed write; full
optimistic record revision control is a future extension. Categories validate
hierarchy under a shared lock. Orders remain read-only because no supported
operational transition service existed. No new revenue/BI metrics are invented.

## Frontend

Routes: `/admin`, `/admin/login`, `/admin/products`, `/admin/categories`,
`/admin/promotions`, `/admin/orders`, `/admin/orders/[id]`, `/admin/stores`,
`/admin/inventory`, `/admin/settings`, `/admin/master/administrators`,
`/admin/master/design`, `/admin/master/design/history`.

The public shell yields to the independent admin shell only on exact `/admin`
path boundaries. Operational Admin is English for MVP, has its own light neutral
palette and locale attribute, semantic tables, grouped forms, pending/error/retry/empty
feedback, keyboard focus and a modal mobile navigation drawer. Design Console
and Inline Master keep the distinct dark tool palette. No auth storage is
placed in localStorage. Public RU/TJ/EN preferences and cart/templates are untouched.

## Bootstrap

Run `python scripts/dev.py admin:create` against the desired Compose project/env
file. It wraps interactive `docker compose exec api python tools/create_admin.py`.
Password is entered twice without echo, never passed in argv; first user must be
MASTER. Existing emails are not overwritten. For direct CLI use, optional
`--email`, `--name`, `--role ADMIN|MASTER` select non-secret fields. Additional
accounts and deliberate password reset are available to MASTER in the UI.

For a local presentation, `PRESENTATION_ADMIN_ENABLED=true` enables the Docker
startup bootstrap after Alembic migrations. Supply `PRESENTATION_ADMIN_EMAIL`,
`PRESENTATION_ADMIN_NAME` and `PRESENTATION_ADMIN_PASSWORD` in the ignored `.env`;
there is no default password. The account is always MASTER and is created only
when the administrator table is empty, under the same advisory lock as interactive
bootstrap. Existing accounts, including disabled ones, are never changed. Invalid
enabled configuration stops startup without logging credentials. See the
[presentation setup](../../README.md#presentation-startup) for full instructions.

## Extension boundaries

Read-only admin summaries include actual status counts, low-stock/image/measurement
attention, five latest orders and current-day order values (UTC+05:00, excluding
cancelled orders). These values are not paid revenue. Product reads support
problem/active/empty views, low-stock and measurement-mode filters. Write contracts
and lifecycle remain unchanged. See [Admin UX rules](admin-ux-rules.md).

No customer authentication, payments, warehouse, CMS, arbitrary CSS/HTML/JS,
drag-and-drop editing or new WebGL. Keep administrator sessions independent of
guest capability-order links. Deployment still requires TLS, non-development
database credentials and a deliberate administrative-access policy.
