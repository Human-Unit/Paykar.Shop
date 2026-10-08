# My Shopping runtime and alignment investigation

Date: 2026-10-08. Source HEAD: `cf1dea3`, branch `main`.

Status: confirmed alignment defect fixed; production build and fresh Chromium checks pass. The reported normal-browser header clipping is not reproduced and full user-browser comparison remains pending. The instruction attachment contains only text, with no broken screenshot. No commit or push was performed for this fix.

## Diagnosis

The active checkout is `D:\Workshop\Paykar\Test_Task_Paykar_Shop-main`. Docker container `test_task_paykar_shop-web-1` owns `127.0.0.1:3000`; port ownership is Docker Desktop. Process inspection found MCP/tool processes but no competing `next dev` or `next start` process, and no frontend listener on ports 3001 or 3002. Browser checks used the same `http://localhost:3000/my-shopping` origin.

The confirmed source defect was inconsistent composition width: orders had a centered 1120px carousel, but the templates section used the full 1320px page container. A single template consequently started at x=59px with its center at x=229px, while the order center was x=715px. The previous populated QA collection did not expose the sparse-collection centering problem.

Both production CSS files loaded with HTTP 200. No missing Next assets, page errors or hydration errors were observed in the retained functional QA context. Served CSS SHA-256 hashes exactly match the files in the rebuilt container (recorded in `verification.json`). No missing imports or conflicting selector override was found for the carousel. There is no evidence from these checks that a stale image, duplicate frontend, missing CSS or hydration mismatch caused the reproduced alignment defect. A cache problem in the user's inaccessible browser has not been established or ruled out.

Fresh loads and navigation from a scrolled Catalog page place My Shopping below the header. Header height is approximately 118px at 390/768px, 121px at 1024px and 123px at 1440px. On mobile the accepted sticky header has `top: -50px`, deliberately scrolling the brand row away; its stuck visible bottom is approximately 68px. The existing 84px document scroll padding clears that visible portion. Therefore no arbitrary top padding or header redesign was applied.

Full-page screenshots can place fixed tab bars inside the long document, and captures taken after scrolling can record sticky elements away from the document top. The new `viewport-*` and `templates-*` screenshots are the primary visible-viewport evidence; full-page captures are supplementary. These capture effects do not establish a normal-browser layout defect.

## Fix and files

- `apps/web/src/components/my-shopping.tsx`: mark only history and personal-template sections with the shared local composition class.
- `apps/web/src/components/my-shopping.module.css`: give those two sections the same centered 1120px maximum width. Remove their duplicate 170px anchor margin; the existing document scroll padding already clears the sticky header.
- `apps/web/src/components/shopping-carousel.module.css`: center template collections that fit using first/last flex auto margins. Those margins collapse on overflow, preserving horizontal scrolling and snap behavior. Card dimensions and styling are unchanged.

No changes to shell/header markup or styles, breadcrumbs, curated sets, template editor, homepage, product detail, checkout, backend, APIs, database or storage schema. Existing card controls, handlers, real imagery and translations are retained.

## Exact runtime

Rebuilt and recreated **web only**, using the existing Compose project and environment configuration:

```powershell
docker compose -p test_task_paykar_shop --env-file 'D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env' up -d --build --no-deps web
```

Final image: `sha256:5f1f9e63679d0ede4e584c3838db29ed5dde039214d448784611f38b96889c4d`.

Production build ID: `oQMb3KjTO8f2s0DVktpwW`. Web is healthy. API and PostgreSQL containers remained running and healthy; neither was recreated or reset during this task. No frontend artifacts needed manual deletion.

## Executed checks

Commands in `apps/web` unless indicated:

| Command | Result |
| --- | --- |
| Targeted `npx prettier --write` | PASS |
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:shopping` | PASS: 6 tests, 0 failures, 0 skips |
| `npm run test:navigation` | PASS: 4 tests, 0 failures, 0 skips |
| `npm run build` | PASS |
| `git diff --check` (repository root) | PASS |
| Compose production web build/recreation | PASS |

Tests retain the existing `MODULE_TYPELESS_PACKAGE_JSON` Node warning; it does not fail the checks.

## Fresh-browser evidence

New standalone Chromium contexts, production URL, normal motion, no injected styles or devtools overrides. The only setup script populated isolated QA storage with real existing order IDs, temporary template fixtures using actual product IDs, and language/theme preferences. No persistent order was created or user browser storage altered.

- RU and EN dark mode at 390, 768, 1024 and 1440px: 8 fresh contexts. At 1440px both personal sections now start at x=155px and are 1120px wide. Active order center error is 0px at every tested width; two real neighboring previews are visible. No page overflow or clipped actions.
- Separate fresh contexts with 1, 2 and 3 templates: each collection is centered with 0px center error and no overflow. A single item has no fabricated controls or neighbors.
- Template anchor checks at all 8 width/language combinations: headings remain below the sticky header. On mobile, template heading y is approximately 84px against a visible header bottom of 68px; desktop heading y is approximately 140px against header bottom 121–123px.
- Order Next/Previous, dots, keyboard, touch swipe, horizontal wheel input, normal smooth motion and reduced motion: PASS. Both order boundary controls disable after scrolling settles. Template Previous settles at exactly `scrollLeft = 0`; the 4px snap regression is absent.
- Real API smoke: repeat adds products to the QA cart; template edit menu links to the editor. All business handlers are unchanged by the source diff.

See [machine-readable assertions](verification.json), [before sparse desktop](screenshots/before-single-1440.png), [after sparse desktop](screenshots/after-single-1440.png), [fresh desktop viewport](screenshots/viewport-1440-en-dark.png), [desktop template viewport](screenshots/templates-1440-en-dark.png), [fresh mobile viewport](screenshots/viewport-390-en-dark.png) and [mobile template viewport](screenshots/templates-390-en-dark.png).

## Remaining acceptance limitation

Browser skill discovery returned no connected browser. Attempting to launch a fresh regular Chrome window through `Start-Process` was rejected by automatic approval review with `blocked by policy`. It was not retried through an alternative launch mechanism.

Consequently the user's normal-browser render and the exact cause of the reported header clipping are **unverified**. This is not a claim that fresh Playwright acceptance proves their Chrome session is fixed. A text question requesting the exact URL, zoom and personal-item counts is pending; the missing broken screenshot is also needed if clipping persists. Full task acceptance remains open until that user-visible comparison is confirmed.
