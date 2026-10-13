# Inline Master Design Mode

## Implementation plan

1. Extend the existing typed design JSON with optional allowlisted page and section overrides. Keep current global keys, defaults, endpoints, version history and JSONB storage. Add validation and precedence tests first.
2. Register explicit storefront regions without adding layout wrappers. Extend the existing public design consumer with scope CSS and a verified-session gate. Load the editor only for MASTER; keep published/default fallback independent of editor failures.
3. Add the persistent inline drawer/bottom sheet, semantic controls, selection mode, scope reset, isolated preview, save and explicit publish. Preserve draft/local state across collapse and storefront navigation. Retain the advanced console for history and restore.
4. Group admin navigation, reuse header/status/filter/table/save primitives, persist large-list state in URLs and add bounded server-side search/sort. Improve advanced-console controls without replacing existing operational forms or permissions.
5. Document extension/security rules, run full frontend/backend checks, rebuild the actual Docker services, and verify role isolation, publication, responsive editing and shopping regressions. No commit or push.

## Protected baseline

The current approved storefront, grocery measurement behavior, presentation bootstrap, checkout, maps, templates and storage remain unchanged at Paykar Default. Existing pending work is preserved. No arbitrary CSS, HTML, JavaScript, component-tree inspection or page builder is introduced.

## Architecture and access

`StorefrontDesign` remains the single public design consumer. Its small no-store
`GET /api/admin/auth/design-access` gate checks the real HttpOnly backend session.
Public visitors and ADMIN receive `{enabled:false}`; only verified MASTER gets
identity/CSRF and causes the separate inline editor JavaScript to load. The
Master draft/publish/history endpoints still enforce role and mutation CSRF.
No client-supplied role or browser-storage flag grants access.

The default/published fetch is independent of editing. Network failure retains
the last valid published configuration or canonical default. Invalid local
controls disable Save/Publish and revert visual preview to published fallback.
A React error boundary removes failed editor UI and local preview without
removing the storefront. Role expiry is checked on bounded focus refresh; failed
authorized mutations also leave preview mode.

## Typed hierarchy and storage

Existing global keys (`colors`, `typography`, `layout`, `radius`, `effects`,
`motion`) remain at the JSON root. Optional `pages` and `sections` contain sparse
maps of allowlisted dotted token paths. Old JSON requires no conversion; the
Pydantic defaults add empty maps. Existing `design_configs.config` JSONB stores
all scopes, so this feature needs no migration or second theme store.

Example:

```json
{
  "pages": { "home": { "radius.panel": 30 } },
  "sections": { "home.hero": { "colors.brand": "#127744" } }
}
```

The example illustrates only the optional fields, not a full frontend config.
Effective values resolve canonical defaults → global → page → section. Full
snapshots preserve other scopes when saving. Scope CSS compares effective values
to its parent, including a canonical value overriding a non-default parent.
Responsive gutters/type/spacing retain bounded media overrides.

Reset removes only the selected page/section override so it inherits its parent.
Global Paykar Default resets global tokens while preserving page/section maps.
To return every scope to baseline, reset populated scopes as well. There is no
unlabelled destructive “reset everything” action.

## Registry and bindings

`design-registry.ts` is the central client metadata registry: page IDs/route
matching, region IDs, human labels and explicitly supported token paths.
Control names/descriptions/groups live there; values/defaults and safe ranges
come from `design-config.ts`, the shared design-control authority. Backend
`PaykarDesign` independently enforces matching IDs/tokens/ranges and strict scoped
types. Unknown regions/tokens, injected colors, fractional integer values,
non-finite numbers and out-of-range values fail validation.

Components opt in with `designRegionProps("home.hero")` on an existing semantic
root. This typed registration changes no layout wrappers. Current regions:

- Home: Hero, featured offer, Offers, My shopping preview, Stores, order journey.
- Promotions: masthead and sale-product collection.
- My Shopping: masthead, recent orders and personal templates (when real data exists).

Other storefront pages have page scope, not arbitrary element editing.
Selection recognizes only registered attributes and checks the current page;
normal links/actions work unless explicit selection mode intercepts a region click.
Outlines occupy no layout space and disappear when collapsed. Absent personal
sections are not fabricated for editing.

Region controls are deliberately narrower than global controls. They bind
existing CSS variables or add optional variables with exact approved fallbacks.
For example, the shopping masthead supports heading scale rather than pretending
it has a decorative watermark. No shader uniforms, map coordinates, business
content or arbitrary CSS values are exposed. Bespoke gradients/JS animation are
not comprehensively tokenized by the pre-existing global system.

## Draft, publication and navigation

Open MASTER at the viewport edge. The editor loads the latest draft newer than
the current publication, otherwise the published/default configuration. This
avoids accidentally reviving an older abandoned draft after a newer publication.
Local control edits immediately preview in this tab only. Saved drafts are
immutable database versions and survive reload; no draft is sent by the public
endpoint. Publish requires a valid clean saved draft and explicit confirmation.
Restore in the advanced console creates another draft; it never rewrites history.

Collapse retains config, dirty state, saved version, selected region and local
preview. Storefront route changes retain edits/open state but clear selection and
update page context. Internal storefront navigation needs no discard warning
because state survives. Full document exit, reload or navigation to Admin warns
when unsaved; saved drafts alone do not warn. “Show published design” temporarily
pauses preview without discarding controls.

Desktop uses a 400px drawer with a reflowed storefront and preview container
rules for the hero. At ≤1100px it becomes a bottom sheet; this also prevents
tablet content from becoming a cramped desktop preview. Header/footer actions
remain visible while controls scroll. The inline dialog is non-modal so normal
storefront interaction remains available. Escape first exits selection, then
collapses and restores focus to MASTER. Reduced motion disables editor motion;
existing shopper reduced-motion behavior takes precedence over tokens.

## Advanced console and extension rules

`/admin/master/design` retains global controls, representative preview, version
history and privileged audit. Controls use shared semantic collapsible groups
and a sticky save bar. It preserves page/section overrides when changing global
values; inline links lead to full console/history. Named preset boundary exists
through canonical Paykar Default; extra presets, import/export and scheduling
remain future work.

Add a region only after identifying real, safe variable consumers and exact
default fallbacks. Extend client/backend allowlists together and test both.
Never accept user-defined selectors/HTML/CSS/JS. Do not create auth from editor
state, bypass CSRF, publish on Save, fabricate records for preview, or introduce
a parallel theme implementation.

## Verification report — 2026-10-13

Implementation and QA used `D:/Workshop/Paykar/Test_Task_Paykar_Shop-main`, branch
`main`, starting/current commit `31d2efe`. No staging, commit or push occurred.
Existing presentation-bootstrap and grocery-measurement changes remain pending
and were preserved. QA used the rebuilt production Docker service at
`http://localhost:3000`, not a separate preview server.

### Admin changes and shared primitives

- Grouped sidebar: Operations / Catalog / Locations / MASTER-only Master / System.
- Standard header/create action, URL filters/search/sort, server-side lists,
  table/primary row actions and pagination. Copied URLs survive reload.
- Products/promotions/stores use detail/edit pages; inventory/categories/admin
  edits use native modal drawers. Existing write validation and stock conflict
  checks remain authoritative. Dirty cancel/navigation is confirmed.
- Shared `AdminHeader`, `DataTable`, `FilterBar`, `StatusBadge`, `SaveBar`,
  `AdminDrawer` and semantic `DesignControls`. Escape/discard returns drawer
  focus to its initiating button. Selection/grid/bulk/global search remain future
  extension boundaries, not new operational features.

### Routes and endpoints

- UI: `/admin/products/{id|new}`, `/admin/promotions/{id|new}`,
  `/admin/stores/{id}`. Existing order-detail and design/history routes retained.
- API additions under `/api/v1/admin`: `GET auth/design-access`,
  `GET products/{id}`, `GET stores/{id}`.
- Existing read endpoints extended with bounded query/sort/page parameters;
  categories/stores/administrators keep the legacy array when page is omitted.
- Existing design save/publish/restore endpoints and JSONB storage reused.
  Optional pages/sections are the only design-schema extension. No new design
  migration, theme store, auth system, dependency or public write endpoint.

### Automated command results

| Command (frontend commands run from `apps/web`)                                                                                                        | Result                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `npm run format:check`                                                                                                                                 | PASS                                          |
| `npm run lint`                                                                                                                                         | PASS, zero lint warnings                      |
| `npm run typecheck`                                                                                                                                    | PASS                                          |
| `npm run build`                                                                                                                                        | PASS; final frontend also built inside Docker |
| `node --test tests/*.test.mjs`                                                                                                                         | PASS, 60 tests, 0 skipped                     |
| `docker compose -p test_task_paykar_shop run --rm --no-deps -v D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/apps/api:/app api python tools/verify.py` | PASS                                          |
| backend verifier: compileall, Ruff check, Ruff format                                                                                                  | PASS                                          |
| backend verifier: full `pytest -q`                                                                                                                     | PASS, 196 tests, 0 skipped                    |
| backend verifier: Alembic upgrade/current/check in owned PostgreSQL verification database                                                              | PASS; database removed afterward              |
| `docker compose -p test_task_paykar_shop exec -T api alembic current`                                                                                  | `0005_grocery_measurement (head)`             |
| `docker compose -p test_task_paykar_shop exec -T api alembic check`                                                                                    | No new upgrade operations                     |
| `docker compose -p test_task_paykar_shop up -d --build --wait` (final frontend fix rebuilt with `... --wait web`)                                      | PASS                                          |
| `docker compose -p test_task_paykar_shop ps -a`                                                                                                        | API/web/PostgreSQL healthy; seed exited 0     |
| `git diff --check`                                                                                                                                     | PASS                                          |

Added 7 frontend tests (registry/precedence/reset/injection/state and normalized
admin list URLs) and 17 backend cases (scoped validation, role gate, isolated
save/publish/restore, bounded reads and optional-paging compatibility). Existing
grocery, shopping, checkout, catalog, navigation and map tests all passed.

Node reports the existing module-type warning for direct TypeScript tests.
Starlette reports one existing AnyIO deprecation warning. Git reports pending
CRLF normalization on several files; whitespace validation passes.

### Actual browser checks and evidence

Browser plugin unavailable: its required Browser skill/runtime is not present in
the session skill catalog. Used locally cached Playwright Chromium, no repository
dependency added. Temporary scripts/evidence are outside committed source:

`C:/Users/ahmad/AppData/Local/Temp/paykar-inline-evidence/`

`node C:/Users/ahmad/AppData/Local/Temp/paykar-inline-qa.cjs`: PASS, 60 structured
checks, zero page errors. `node C:/Users/ahmad/AppData/Local/Temp/paykar-inline-edge-qa.cjs`:
PASS, 18 structured checks plus responsive screenshots, zero page errors.

| Browser surface/flow   | Coverage and observed result                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MASTER lifecycle       | Real login, fixed tab, drawer, registered-region selection, immediate private preview, collapse persistence, saved draft reload, explicit publish, reset/republication, scope isolation: PASS |
| ADMIN/public isolation | Real ADMIN login: no tab/Design nav, Master API 403. Incognito unchanged by draft; no inline-editor JS downloaded. Published config only: PASS                                                |
| History                | Restore creates a new draft; public config unchanged until explicit publish: PASS                                                                                                             |
| Responsive             | Drawer/sheet at 390/768/1024/1440, no document overflow; desktop hero recomposes only while editor open: PASS                                                                                 |
| Localization/theme     | Public My Shopping 24 width × locale × theme cases; MASTER real-template preview in RU/TJ/EN dark/light, plus all four viewport screenshots: PASS                                             |
| Storefront routes      | Home, Catalog, bananas product, Cart, Checkout, Offers, Stores, My Shopping at 390/1440: meaningful content, correct navigation, no editor for public, no overflow: PASS                      |
| Shopping actions       | Real catalog product navigation/favorite/add/quantity/cart reload; template creation/edit/add-all in isolated browser storage with editor present: PASS                                       |
| Checkout failure       | Intercepted route quote and failed order submission; cart retained; edited address invalidates quote: PASS. No real order created and no live ORS claim                                       |
| Map                    | Real list selection/popup, marker selection/list synchronization with editor available: PASS. Map implementation untouched                                                                    |
| Admin operations       | URL reload/search/sort, mouse row detail, full product edit/discard, quick stock drawer Escape/discard/focus: PASS. No real product/stock mutation                                            |
| Recovery/accessibility | Injected load failure/Retry, failed Save retaining controls, invalid input blocking Save/Publish, Escape selection then collapse/focus, reduced-motion and mobile touch navigation: PASS      |
| Console                | No page/framework/hydration errors. Unused CSS/font preload warnings remain; injected HTTP failures are expected QA states                                                                    |

Manually inspected screenshots at all four widths. Representative captures:
`master-hero-preview-1440.png`, `advanced-console-1440.png`,
`master-shopping-{390,768,1024,1440}.png`,
`master-real-template-{390,768,1024,1440}.png`, `public-home-1440.png`.
Evidence JSON: `results.json`, `edge-results.json`.

Initial prebuild homepage capture had incomplete reveal/loading content and is
not a reliable pixel-for-pixel baseline. Source registration is attribute-only;
default CSS generation stays empty, exact existing CSS fallbacks remain, and the
settled public screenshot was inspected for preserved composition. No fabricated
before/after pixel acceptance is claimed.

QA restored the exact previous published configuration through immutable design
versions. QA versions/audit entries remain as truthful history. The owned QA
ADMIN was removed with exact ID/email/role checks, sessions logged out. Templates,
favorites and cart fixtures existed only in disposable browser contexts; no
user browser storage or application orders were modified.

### Mismatch ledger and limitations

- Fixed: drawer trigger covered controls while open; it now hides until collapse.
- Fixed: desktop hero became cramped beside editor; scoped preview container
  recomposes hero above side panels without affecting the normal public layout.
- Fixed: ambiguous admin Sort label; explicit accessible name added.
- Fixed: quick-drawer close lost focus; initiating-control restoration verified.
- Fixed: unsupported section controls could appear ineffective; region
  allowlists narrowed to actual CSS consumers and exact defaults.
- Intentional: mobile/tablet editor overlays as a bottom sheet, leaving its
  header/footer visible and controls independently scrollable. Collapse restores
  the full shopping viewport.
- Intentional: admin/editor use existing English administrative language;
  storefront document language, persisted preference and theme remain RU/TJ/EN.
- Only registered CSS consumers are adjustable; bespoke shader uniforms, map
  content, product/business data and unrelated component geometry are protected.
- Scope reset removes that override and inherits its parent. Global reset
  preserves scoped overrides; it does not silently reset every scope.
- Draft versions are shared by verified Masters; no concurrent-editor merge or
  scheduling/import/export/preset gallery is introduced. Authentication loss
  safely exits editing; save drafts before leaving or losing the session.
- Physical devices, Firefox/Safari, a new successful order and live ORS routing
  were not exercised in this pass. Existing full backend commerce tests passed.

### Files changed for this task

Existing files:

```text
AGENTS.md
apps/api/app/api/routes/admin.py
apps/api/app/schemas/design.py
apps/api/tests/test_admin.py
apps/web/src/app/admin/layout.tsx
apps/web/src/app/layout.tsx
apps/web/src/components/admin/admin-shell.tsx
apps/web/src/components/admin/admin-workspace.tsx
apps/web/src/components/admin/admin.module.css
apps/web/src/components/admin/design-console.tsx
apps/web/src/components/home-feature-cards.module.css
apps/web/src/components/home-hero.tsx
apps/web/src/components/home-store-network.tsx
apps/web/src/components/home.tsx
apps/web/src/components/my-shopping.module.css
apps/web/src/components/my-shopping.tsx
apps/web/src/components/order-showcase.tsx
apps/web/src/components/promotions-page.module.css
apps/web/src/components/promotions-page.tsx
apps/web/src/components/shell.tsx
apps/web/src/components/storefront-design.tsx
apps/web/src/components/stores-workspace.module.css
apps/web/src/lib/design-config.ts
apps/web/src/styles/design-bindings.css
```

New files:

```text
apps/api/tests/test_inline_design.py
apps/web/src/app/admin/[resource]/[record]/page.tsx
apps/web/src/components/admin/admin-drawer.tsx
apps/web/src/components/admin/admin-primitives.tsx
apps/web/src/components/admin/design-controls.tsx
apps/web/src/components/design-region.ts
apps/web/src/components/inline-master.module.css
apps/web/src/components/inline-master.tsx
apps/web/src/lib/admin-list-state.ts
apps/web/src/lib/design-registry.ts
apps/web/tests/admin-list-state.test.mjs
apps/web/tests/inline-design.test.mjs
docs/admin/admin-ux-rules.md
docs/admin/inline-master-design-mode.md
```

Several files already had grocery-related changes before this task (notably
admin routes/workspace and My Shopping). Those changes were preserved; the
complete working-tree diff also includes the earlier bootstrap/measurement
files, translations, migration and tests. None were staged or committed. The
existing `allowImportingTsExtensions` setting supports direct TypeScript test
imports. Temporary QA scripts/screenshots, `.env`, dependencies and build caches
remain outside the tracked task scope.
