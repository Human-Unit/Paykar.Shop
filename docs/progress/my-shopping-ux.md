# My Shopping UX — acceptance

Date: 2026-10-07. Baseline main: 518d6541762110c70c2b6161292b403997dd9fbe.
Repository: D:\Workshop\Paykar\Test_Task_Paykar_Shop-main.
Running production frontend: http://localhost:3000.

## Implemented

- Reused the compact homepage ShoppingDiscovery block already placed after everyday products and before the order phone showcase.
- Replaced its separate history/templates links with one primary Open my shopping action to /my-shopping.
- The existing reactive shopping storage supplies real order-ID and personal-template counts. Zero counts are omitted completely; fresh visitors see positive explanatory copy. Nonzero counts use localized plural forms.
- Removed the redundant history/templates/curated navigation row from /my-shopping.
- Order history renders only when at least one valid stored order UUID exists. Its loading and failure messages remain.
- Personal templates render only when at least one validated template exists. If none exist, the introduction offers Create your own template at /my-shopping/templates/new.
- Curated sets remain available in every case. Fresh visitors see a useful introduction, one creation action and all five existing curated cards, without empty personal sections.
- Replaced technical introductory copy with a shopping value proposition. Current-price/stock guidance appears beside history; browser-local template guidance appears beside actual personal templates.
- Used a scoped 28px section rhythm so the next useful section follows the introduction clearly without large empty gaps.
- Kept history/templates/curated section IDs when their sections exist. Missing personal hashes still resolve to the normal page without placeholder sections or redirects.
- Added all new copy and count forms through the existing RU/TJ/EN dictionary.
- Documented the reusable [design principle](../design-principles.md) and updated homepage access instructions in README.

## Files changed

- apps/web/src/components/my-shopping.tsx
- apps/web/src/components/my-shopping.module.css
- apps/web/src/lib/translations.json
- README.md
- docs/design-principles.md
- This report and its browser evidence directory.

No storage schema, cart, Saved, checkout, order, routing, payment, backend or database code changed. No fake orders or personal templates are injected into the shipped interface.

## Conditional layout results

| Browser data   | History            | Personal templates             | Useful starting content                      |
| -------------- | ------------------ | ------------------------------ | -------------------------------------------- |
| Fresh          | Hidden             | Hidden                         | Create-template action and five curated sets |
| History only   | Actual order shown | Hidden                         | Contextual create action and curated sets    |
| Templates only | Hidden             | Actual personal template shown | Existing create button and curated sets      |
| Both           | Actual order shown | Actual personal template shown | Curated sets retained                        |

All four scenarios passed in a real Chromium browser against the Docker production frontend. History used an existing persisted test order. Personal templates were created through the actual editor UI in isolated browser contexts. Browser-local test data was discarded with those contexts; existing user browser storage was not cleared. No new orders were placed and no PostgreSQL stock was mutated.

## Automated commands actually executed

From apps/web, all PASS:

```text
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run test:catalog
npm run test:shopping
```

The production build generated 22 static pages. Catalog tests: 13 passed. Shopping tests: 6 passed. No test failures or skips. The existing Node MODULE_TYPELESS_PACKAGE_JSON warning remains non-failing and unchanged.

git diff --check also passed.

Rebuilt only the web service while keeping the existing healthy API and PostgreSQL services:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up --build -d --no-deps web
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env ps
```

Docker production web build/start passed. All three services are healthy. Secrets were not printed.

## Automated browser acceptance

Browser: Chromium 154.0.8037.98 through Playwright.
Evidence: [browser-results.json](my-shopping-ux/browser-results.json) and [screenshots](my-shopping-ux/screenshots/).

PASS:

- Four personal-data layouts and correct homepage counts.
- One homepage primary action, direct page navigation and placement before the phone showcase.
- Fresh page contains no empty history/templates, zero counts or redundant section navigation.
- RU/TJ/EN × dark/light × 320/390/768/1440px: 24 responsive cases, zero horizontal overflow, contained/stacked homepage actions and useful curated content in the initial viewport.
- The introduction-to-first-section gap measures 28px. Existing personal sections do not leave empty placeholders.
- Full-data page also passes at 320/390/768px.
- Fresh and populated #history, #templates and #curated deep links resolve correctly.
- Actual header language switching updates counts: 3 заказа · 2 шаблона; 3 orders · 2 templates; 3 фармоиш · 2 қолаб. Tajik uses html lang=tg.
- Repeat order uses the real shopping preview endpoint and adds current available products to the cart.
- Saving an order reveals the personal templates section immediately without reload.
- Personal editing, current-price/stock preview, personal bulk add, curated bulk add, and cart/template persistence after reload remain functional.
- Homepage counts update immediately when test-context personal storage changes.
- No unhandled browser page exceptions.

### Failures remain visible

Four separate failure scenarios passed:

- Simulated curated API 503: visible error and retry; template creation remains available.
- Missing order: real API 404, history remains visible with the unavailable-order error; curated content remains usable.
- Simulated preview 503: visible preview and bulk-add errors; failed add preserves the cart.
- Simulated storage quota failure: existing storage warning remains visible; the UI does not falsely claim persistent success.

Only failure cases used intentionally simulated API/quota errors. Normal shopping acceptance used real endpoints. Existing shopping unit tests continue to cover missing/unavailable products and stock/capacity limits.

### Verification corrections

The first read-only test-order lookup encountered Windows pipeline encoding of Cyrillic regex text; the corrected ASCII test-order filter succeeded. An initial browser helper waited for curated content already present on the homepage instead of waiting for Next navigation; it was corrected to await the target URL and page heading. A failure-test helper initially matched Next's route announcer as an additional alert; alert assertions were scoped to main. All corrected acceptance runs passed. These were verification helper issues, not remaining application failures.

## Remaining issues and publication

No known remaining issues from the requested acceptance checks. Existing non-failing Node module warnings remain. This focused task did not repeat the full checkout/ORS acceptance suite.

Implementation and acceptance were completed without staging, committing or pushing. The user subsequently authorized publication to main; the release commit is reported separately after the push.
