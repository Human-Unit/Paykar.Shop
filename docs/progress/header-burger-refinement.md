# Final header and burger refinement

Date: 2026-10-02.

**HEADER / BURGER REFINEMENT — IMPLEMENTED**  
**VISUAL ACCEPTANCE — PENDING**

The final header/drawer design is implemented in the shared Next.js shell. Engineering, production HTTP checks and a real delivery quote passed against the rebuilt local stack. Automated browser acceptance is unavailable: the Codex Browser connection returned no available browser sessions. Manual acceptance of this revision has not been performed or supplied. Earlier manual acceptance and screenshots belong to earlier revisions and do not establish acceptance here.

No commit or push was made. Existing unrelated work was preserved.

## Header, preferences and navigation

The utility area now exposes only the compact Dark/Light control and burger button. RU/TJ/EN has moved entirely into the drawer near the top, with an interface-language label. Both controls keep their existing 44px button areas, selected-state indicators, translated labels and `aria-pressed` values. Dark and Russian remain the defaults; no visible System option was added.

`LanguageSelector` uses the existing `usePresentation` language and setter. The provider, bootstrap script and `paykar-presentation-v1` storage architecture are unchanged. There is no new language state or remount key. Moving this presentation control introduces no routing request. Browser confirmation that language/theme changes preserve cart, form, destination, map, route and scroll remains pending.

The drawer uses the original shared `<Brand />` and supplied PNG with a smaller 184px presentation width. It contains exactly the existing nine information entries: Как купить, Условия оплаты, Условия доставки, Возврат товара, Акции, Блог, Бренды, О нас, Контакты. Each has its requested Lucide icon. Eight entries reuse their existing information text through native details/summary disclosures; Акции retains its existing `/#promotions` link. Unsupported commercial functions retain the existing honest demo disclosures.

The duplicate Catalog link was removed from the drawer. There is no category tree, product filter, cart or search in it. Desktop Catalog and all information entries remain. The complete `MainNavigation`, `InfoNavMenu` and `InformationContent` function ASTs match the before-edit snapshot, including hover, focus, Escape, outside-pointer and focus-leave handling. Existing tablet/mobile desktop-navigation breakpoints are unchanged.

## Responsive layout and accessibility

The drawer is capped at 360px on desktop. At mobile widths it uses an 8px inset and `min(360px, 100vw - 16px)`, yielding a CSS target width of 360px at 390px and 304px at 320px. It has bounded viewport height, internal vertical scrolling, flexible wrapping labels and nonshrinking icons. These are source dimensions, not measured browser results. The shared 1440px container and 32/24/16px page gutters are unchanged. Header row geometry is unchanged: the existing approximate desktop target remains 165px; no new browser measurement is claimed.

The existing native modal `<dialog>`/`showModal()` architecture is retained. Its translated heading is visually hidden while remaining referenced by `aria-labelledby`. The labelled close button requests initial focus. Escape uses native dialog dismissal; X and backdrop handlers close the dialog. Close events restore burger focus explicitly with `preventScroll`. The shared brand link also dismisses the drawer when navigating. Modal focus containment and actual returned focus require browser review.

Opening and closing use a restrained 200ms horizontal slide and opacity transition, with a fading backdrop. CSS `@starting-style` and discrete `display`/`overlay` transitions preserve native dialog lifecycle without adding animation timers or duplicate dialog state. This follows the [native dialog transition guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog#animating_dialogs). Browsers lacking these CSS features retain the native modal behavior but may omit the transition. Reduced motion disables drawer/backdrop transitions; existing preference motion also remains disabled under reduced motion. Only the disclosure chevron rotates when expanded.

## Scope and translation audit

Before editing, relevant source files were copied into the ignored `.cache/header-burger-baseline/`, alongside SHA-256 hashes for 105 application, database, environment and dependency files. Comparing those hashes after implementation found exactly three changed application files:

- `apps/web/src/components/preferences.tsx`
- `apps/web/src/components/site-navigation.tsx`
- `apps/web/src/app/paykar-theme.css`

Backend, migrations, seed data, business components, cart/presentation providers, checkout/map/search handlers, environment, dependency manifests and public image bytes match that snapshot. No package was added. All nine navigation labels and their information text are unchanged, apart from added icon metadata. The broader checkout-handler comparison also passed.

The existing dictionary has **306 entries**, each with nonempty TJ and EN values alongside its RU source key. The broader audit checked 189 literal UI keys and all 40 seeded products with no missing translations; a separate audit includes dynamic drawer labels/information text and also reports no missing translations. No translation architecture or dictionary changes were needed.

Evidence: [source verification](header-burger-final/source-verification.json), [production markup verification](header-burger-final/markup-verification.json).

## Commands executed and results

Frontend commands ran from `apps/web`:

```powershell
npx prettier --write src/components/preferences.tsx src/components/site-navigation.tsx src/app/paykar-theme.css
npm run lint
npm run typecheck
npm run format:check
npm run build
```

All passed. The production build compiled and generated the application routes with no ignored TypeScript errors.

Backend checks ran against the API container:

```powershell
docker compose exec api python -m compileall app
docker compose exec api ruff check .
docker compose exec api ruff format --check .
docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
docker compose exec api alembic current
docker compose exec api alembic check
docker compose exec api alembic upgrade head
```

All passed: **63 tests passed, no skips**; Ruff reported 33 formatted files; Alembic reports `0001_foundation (head)` with no new upgrade operations. Pytest emitted one existing dependency deprecation warning concerning Starlette's AnyIO BlockingPortal alias. Tests use the separate `paykar_test` database. Backend source was not changed.

Docker commands:

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
```

All passed. PostgreSQL, API and web reported healthy after rebuilding. Local ports remain web `3000`, API `8080`, PostgreSQL `5433`, bound to loopback. `git diff --check` also passed; Git emitted existing LF/CRLF notices.

Additional ignored audit helpers executed successfully: `node .cache/header-burger-audit.cjs`, `node .cache/audit-rollout.cjs`, `python .cache/header-burger-runtime.py`, `python .cache/header-burger-html.py`, `node .cache/header-burger-theme.cjs`, and `python .cache/header-burger-security.py`. These helpers inspect source or run HTTP/JavaScript checks; they do not automate browser interaction. Eight actual production preference-bootstrap cases passed in isolated JavaScript contexts, including default/saved themes and malformed or unavailable storage.

## Real provider and production smoke

`POST http://localhost:8080/api/v1/delivery/quote` succeeded using store `(38.562512, 68.791511)` and customer destination `(38.5750, 68.7800)`. The backend retains the real HeiGIT endpoint `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`.

| Result | Verified value |
| --- | --- |
| Route | Real GeoJSON FeatureCollection / LineString |
| Geometry points | 51 |
| Distance | 2887 m |
| Duration | 273 s, approximately 4 min 33 s |
| Delivery price | 20.00 TJS |
| Selected destination | Latitude 38.5750, longitude 68.7800 |
| Mocked | No |

API and database health passed. Product search, category detail and product detail returned valid results. The existing order `9bbf8a9c-1c24-4f37-97f1-47c08f8317c2` returned identical persisted data on two reads, with one item and 38.00 total. No new application order was created in this refinement, and these reads are not a browser checkout/confirmation-reload test.

Seven production pages returned HTTP 200: `/`, `/catalog`, `/catalog/produce`, `/product/apples-red`, `/cart`, `/checkout`, and the existing order confirmation. On every page, parsed HTML contains two theme choices, three language choices only inside the closed drawer, shared drawer branding, eight information disclosures, the promotions link, and no drawer Catalog link. Served PNG bytes match the supplied source exactly.

The fresh deployed `.next/static` copy contains 27 files. Scans found zero ORS-key or private database-password matches, and zero direct provider URLs in browser assets. Web source, documentation and sampled API/HTML payloads likewise contain no ORS-key match. **Browser network capture remains unavailable**, so no new browser-network verification is claimed.

Evidence: [runtime verification](header-burger-final/runtime-verification.json), [real quote](header-burger-final/real-ors-quote.json), [security verification](header-burger-final/security-verification.json), [theme bootstrap](header-burger-final/theme-bootstrap-verification.json).

## Browser/manual acceptance checklist — pending

Automated browser acceptance: **UNAVAILABLE — Codex Browser disconnected; no available browser sessions.**  
Manual browser acceptance for this revision: **PENDING.** No new screenshots were captured.

Run the rebuilt site at `http://localhost:3000`. Repeat layout checks in Dark and Light and RU/TJ/EN, opening the drawer to change language. Record results and screenshots before changing this revision to COMPLETE.

| Viewport | Required review | Status |
| --- | --- | --- |
| Desktop 1440px | No inline language control; compact theme and rightmost burger; aligned logo/search/cart/navigation; no header growth; drawer branding, language and nine information rows | PENDING |
| Mobile 390×844 | Language only in drawer; compact theme; accessible burger; search/cart fit; 360px drawer fits; no horizontal overflow | PENDING |
| Mobile 320px | Same checks; 304px drawer fits; language controls fit; long TJ/EN labels wrap; all rows reachable by internal scroll | PENDING |
| Keyboard | Open burger using keyboard; initial focus on X; Tab/Shift+Tab stay within modal; visible focus; Escape/X/backdrop dismiss; focus returns to burger | PENDING |
| Desktop disclosures | Hover/focus open, Escape/outside pointer/focus leave close; promotions and Catalog remain functional | PENDING |
| Preferences and persistence | Selected theme/language reflect `aria-pressed`; reload retains preferences; no visible System option; reduced motion removes animations | PENDING |

Interaction preservation sequence:

1. Add a product to cart; open burger and switch RU/TJ/EN. Confirm quantities and count remain, and reload retains cart and preferences.
2. Go to checkout; enter customer details, select destination `(38.5750, 68.7800)` and calculate a real route. Confirm geometry, distance, ETA and price.
3. With that quote visible, change language inside the drawer, then change Dark/Light. Confirm form values, selected location, map and route remain. Check network: neither preference change requests a new quote or accesses HeiGIT directly. Check scroll position where practical.
4. Confirm editing the destination still invalidates the quote. A failed order must preserve cart; a successful order must clear it. Reload confirmation and verify persisted order details.
5. Capture desktop, 390px and 320px drawer/header screenshots in both themes under `header-burger-final/screenshots/` and record the manual outcome here.

## Remaining issues

No engineering check failed. The only acceptance blocker is unavailable browser review: actual layout/overflow, native focus behavior, animation, preference persistence and shopping-state preservation need the above manual checks or a connected browser. HTTP/source checks cannot establish those outcomes. The implementation is ready for that review; final visual acceptance is not claimed.
