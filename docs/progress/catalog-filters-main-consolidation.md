# Expanded catalog filters and main consolidation

Date: 2026-10-06. Active checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

## Data audit and implementation

The actual PostgreSQL catalog has 40 active products, 8 real sale-price relationships, 7 categories, and two sale units (`шт.` and `упак.`). The only seeded nested category is `fruit` under `produce`. The product schema has no brand, manufacturer, country, dietary, weight, volume, or package-size fields. These attributes were not inferred from names or fabricated.

The existing `GET /api/v1/products` endpoint now composes search, recursive category/subcategory, exact price bounds, stock, sale, minimum discount, exact sale unit, sorting, and pagination. `min_discount` is derived from `old_price` and `price` using multiplication rather than division, so null/zero original prices cannot cause a division error. Reversed ranges and invalid/negative/non-finite/over-precision prices return 422. No new schema migration or infrastructure was introduced for filtering.

Optional `include_facets=true` returns real units and mutually exclusive price presets based on the current search/category/subcategory price quartiles. Presets write the existing `min_price`/`max_price` parameters. Facets remain independent of stock, sale, unit, and price selections. Normal requests execute count and page queries; facet requests add one aggregate query, regardless of page size. Integration tests assert that query bound.

The catalog uses URL state for the applied filters and maintains legacy `/catalog/[slug]` entry points. New interactions use `/catalog?category=...`; search, category switching, sort, pagination, and filter removal preserve unrelated constraints. Changing a category removes an incompatible child category. Clear all restores `/catalog` with default sorting. Both catalog search and header search compose with filters when used in the catalog.

The editorial UI keeps category pills, a visible filtered count, quick stock/sale controls, active removable chips, and a native dialog for secondary controls. A server-backed, debounced preview supplies the sheet's exact result count; pending/error states never display a fabricated count. Native dialog focus/escape behavior and page scroll locking are retained. New copy lives in the centralized RU/TJ/EN dictionary.

The pre-existing Phase 4 header hid the menu on desktop and removed the theme control. During preservation/regression review, the menu was restored for all widths and its existing language controls were joined by the existing theme control. This preserves access to preferences and public navigation after the reduced desktop navigation.

## Preservation and repository policy

Initial branch: `phase3/general-shopping-redesign`; initial HEAD/local main/tracking main: `33a6521`. The Phase 2 branch pointed to the same base. Thirty modified/untracked files contained the mixed Phase 2, Phase 3, Phase 4, and favicon work. No reset, clean, or discard was used.

Commit `2cff287` preserves that complete mixed state. Backup branch `backup/paykar-before-filter-consolidation-20261006` points to it. The older `backup/paykar-before-remote-merge` and safety stash remain untouched. Configured-secret scanning found no configured secrets in changed files; root `.env` is ignored.

Fetching found new `origin/main` history (`0c86e42`) and a distinct Phase 1 branch (`d48c271`) containing price filtering, mobile filters, tests, and discovery documentation. The standalone line-ending branch is an alternative lineage and is not blindly merged; main already carries its normalization intent. Phase 0 is already an ancestor of fetched main.

Root `AGENTS.md` prohibits remote pushes. The requested consolidation authorizes preservation/merge commits, but its push clause defers to this prohibition. No push, force push, history rewrite, branch deletion, or stash deletion is authorized or performed.

## Verification before consolidation

- Frontend lint, typecheck, production build, and format check passed.
- `npm run test:catalog`: 8 source-level URL/hierarchy/grouping tests passed. They check URL round trips and changes, not a real browser's Back/Forward behavior.
- Backend: 128 tests passed against an isolated migrated PostgreSQL database, with no skipped tests; one upstream Starlette/AnyIO deprecation warning remains.
- Ruff check/format and compileall passed using the project's Python 3.12 Docker image.
- Local host Python is 3.14 and lacks Ruff; direct host Ruff commands failed. Docker provides the declared project tooling and is used for backend verification.
- The first full backend run had 94 passes and 32 fixture errors because the isolated test database was named `_tests` instead of the required `_test`. Renaming that newly created test database to `paykar_filters_test` resolved the fixture safeguard failures. No demo data was used for tests.
- Initial frontend typecheck found one nullable translation argument; it was fixed and rerun successfully.
- Initial Ruff found the pre-existing payment timezone alias/import issue. It was normalized to the project's Python 3.12 `datetime.UTC` spelling without changing behavior; the safety commit preserves the original edit.

## Browser acceptance

**BLOCKED.** The Browser skill was loaded and its prescribed connection/recovery attempted. Selection returned `No browser is available`; browser discovery returned `[]`. The user was asked to connect the browser while independent work continued. No alternate browser-control surface was used.

Actual rendered checks at 320, 390, 768, 1024, 1440, and 1920 remain pending: filter sheet, result count/active chips, search/filter/sort/pagination composition, reload, browser Back/Forward, quick add, RU/TJ/EN, light/dark, horizontal overflow, console errors, and final shopping smoke. Source tests, API tests, HTTP smoke, and successful builds do not substitute for these checks.

## Main verification and final state

Local `main` was fast-forwarded first to fetched `origin/main` (`0c86e42755501ef92079da9a888e308570caec07`) and then to the completed remote Phase 1 history (`d48c271`). Merge commit `14dbf93` integrates `phase3/general-shopping-redesign`, including safety snapshot `2cff287` and expanded-filter commit `dd4fec0`. Three overlapping catalog files were reconciled: the expanded implementation was preserved and the remote Phase 1 regression test was retained. The remote discovery stylesheet and progress documents were preserved as well.

`git merge-base --is-ancestor` confirmed that fetched main, Phase 0, remote Phase 1, local Phase 2, local Phase 3, and both backup branches are all ancestors of consolidated main. Phase 4 was mixed uncommitted work, not a separate branch; its implementation is preserved by `2cff287`. The standalone line-ending branch was not merged because its `.gitattributes` content already matches fetched main.

### Checks executed from main

| Check                                                                         | Actual result                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `npm run lint`                                                                | PASS                                                         |
| `npm run typecheck`                                                           | PASS                                                         |
| `npm run build`                                                               | PASS; 20 application routes                                  |
| `npm run format:check`                                                        | PASS after formatting the preserved remote stylesheet        |
| `npm run test:catalog`                                                        | PASS; 8 tests, 0 skips                                       |
| `pytest -q` with `TEST_DATABASE_URL` targeting isolated `paykar_filters_test` | PASS; 129 tests, 0 skips; rerun inside the rebuilt API image |
| `ruff check --no-cache .`                                                     | PASS using Python 3.12 Docker tooling                        |
| `ruff format --check .`                                                       | PASS; 45 files                                               |
| `python -m compileall -q app`                                                 | PASS                                                         |
| `docker compose exec -T api alembic upgrade head`                             | PASS                                                         |
| `docker compose exec -T api alembic current`                                  | `0003_product_connections (head)`                            |
| `docker compose config --quiet`                                               | PASS                                                         |
| `docker compose up --build -d`                                                | PASS; PostgreSQL, API, and web healthy                       |
| Final web image rebuild after localization/format fixes                       | PASS                                                         |
| Live API and database health                                                  | `ok`; `connected`                                            |
| Independent live catalog comparison                                           | PASS; 18 cases against 40 actual products                    |
| Final HTTP page smoke                                                         | PASS; 9 URLs returned 200                                    |
| New catalog/header translation-key audit                                      | PASS; no missing RU/TJ/EN keys                               |

The live comparison checks filtered IDs, totals, sorting, pagination, zero results, and invalid-query 422 responses against an independent Decimal/category calculation over current catalog data. It covers nested categories, search, exact prices, stock, sales, 10/20/30 percent discounts, both real units, and composed conditions. Current full-catalog price presets are up to 8.00, 8.01–14.00, 14.01–18.00, and 18.01 upward. Existing black-tea connections still return `oat-cookies`, `honey`, and `wafers`. Machine-readable results are in [catalog-filters-main-evidence.json](catalog-filters-main-evidence.json).

HTTP smoke covered `/`, `/catalog`, a composed catalog URL, `/catalog/produce`, `/product/black-tea`, `/cart`, `/checkout`, `/delivery`, and `/stores`. This proves route delivery, not browser rendering or shopping interactions. Neither a real ORS request nor a new live order/payment transaction was performed for this filter task; backend regressions passed.

The post-merge format check initially failed on the preserved remote discovery stylesheet. Its wrapping was corrected and the check passed. A final dictionary audit also found and added the missing catalog-search placeholder in all three languages. The final evidence commit records these two small fixes and this report.

### Remaining acceptance and repository state

The final approved browser connection retry still returned `No browser is available`. All six target viewport checks and interactive acceptance remain **BLOCKED**, including quick add, history navigation, persisted preferences, console inspection, and no-overflow measurement. No automated or manual browser acceptance is claimed.

Non-failing warnings remain: one upstream Starlette/AnyIO deprecation, a Node module-type warning in the URL tests, and the production dependency install's report of five high-severity advisories. No unrelated dependency upgrade or automatic audit fix was attempted.

All preservation, filtering, and consolidation commits are on local `main`; the final small fixes and evidence are recorded together in the following verification commit. The final response reports its exact HEAD and the subsequent clean-worktree check. Remote main was verified with `git ls-remote` at `0c86e42755501ef92079da9a888e308570caec07`; local main contains that history but is ahead, so remote synchronization is not claimed. No push was performed, as required by root `AGENTS.md`. Backups, remote branches, and the existing stash remain untouched.

**CATALOG FILTERS + MAIN CONSOLIDATION — BLOCKED:** implementation, local integration, and automated/runtime checks pass; mandatory browser acceptance remains unavailable.
