# Local / remote main reconciliation

Date: 2026-10-04. Checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

## Preservation and history

- Local pre-merge HEAD: `83ee17ea1c8983110da9b4ec451a5b6e6ed11957`.
- Fetched `origin/main`: `f1cf6ed9ff83d0c840afe87060ff61e5197c36ef` (`fix: finish store map touch targets`).
- Local-only commits: **0**. Remote-only commits: **18**, all preserved by the fast-forward.
- Local work: **9 modified tracked files + 10 untracked files**, including the remaining-pages visual pass and its original evidence. Remote work affected seven separate files. File overlap: **0**.
- Before merging, captured an ignored inventory and local file copies, ran `git stash push -u -m "paykar-pre-remote-merge-safety"`, verified all 19 files in the stash, and created `backup/paykar-before-remote-merge` at the original local HEAD.
- Safety stash: `6245d48b8834a26778b05f68fa7e798d6c5c6221` (`stash@{0}` at the time of reconciliation). Retained; never popped or dropped.
- `git merge origin/main` fast-forwarded. `git stash apply <saved hash>` restored local work. **No merge or stash conflicts; no whole-file ours/theirs resolutions.**
- All 19 restored local files match their pre-merge copies after normalizing line endings and one terminal blank line in the screenshot checklist. Original local evidence was preserved; fresh results are stored separately in [reconciliation-final](reconciliation-final/).
- Remote reviewer-facing `README.md` and `home-store-network-map.md` remain unchanged. One new integration commit is appropriate because the fast-forward did not commit the restored local work. Publication uses a normal push; final commit/push hashes are reported after Git confirms publication.

Recovery branch and stash remain local. No reset, clean, wholesale restore, rebase, history rewrite or force push was used.

## Combined implementation

The existing remaining-page illustrations, page actions, accessible loading/error states, responsive CSS, confirmation/cart presentation and 575-entry RU/TJ/EN dictionary survive intact. The remote homepage has one store-network section between the delivery CTA and Blog, with one centralized dataset containing eight store locations.

Source and controlled component execution verified the remote interaction model: numbered 44px keyboard-enabled markers, OSM tiles, fitBounds over eight locations, popup name/address, marker/list selection synchronization, selected-marker highlighting, pan and popup opening, internal list scrolling, independent external OSM links, reduced-motion behavior, resize cleanup and selection/map retention through theme/language rerenders. These modules have no ORS, quote, payment, order or cart dependencies.

Integration adjustments were limited to:

1. Prettier formatting, including LF normalization of restored files and formatting of remote files; no lint/type settings or dependency changes.
2. Capture the store-marker Map reference inside the map initialization effect and use that same reference for cleanup, resolving the remote `react-hooks/exhaustive-deps` warning without changing its interaction model.
3. Scope the popup close target to the store-network map, make it 44px, add a focus ring and content clearance. The selector includes the popup ancestor so it outranks Leaflet's default 24px rule.

The backend, schema, dependencies, checkout handlers, routing map, cart/presentation providers, header/navigation and delivery reference implementation were not modified. A source audit found one network component, one canonical dataset, one homepage render, no missing UI translations and no conflict markers. Proper store names/addresses are canonical metadata, excluded from the UI translation-key audit; the dictionary was also checked for duplicate JSON keys.

## Checks executed

Frontend from `apps/web`:

```powershell
npm ci
npm run lint
npm run typecheck
npm run build
npm run format:check
```

All passed on the integrated code. The production build generated 21 pages. Initial formatting verification identified 14 files needing formatting; initial lint identified one effect-cleanup warning. Both were corrected and the final checks passed without weakening checks. The staged whitespace check also identified one extra terminal blank line in the original screenshot checklist; only that whitespace was removed.

Backend / Docker from the repository root:

```powershell
docker compose exec -T api python -m compileall app
docker compose exec -T api ruff check .
docker compose exec -T api ruff format --check .
docker compose exec -T -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
docker compose exec -T api alembic current
docker compose exec -T api alembic check
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
```

Passed: compilation, Ruff checks (41 formatted files), **77 tests, zero skips**, migration head `0002_sandbox_payments`, no new upgrade operations, valid Compose configuration and healthy `postgres`, `api`, `web`. Pytest emitted one existing Starlette/AnyIO deprecation warning. Docker Desktop was initially stopped and was started before runtime checks. Containers were rebuilt again after the final CSS refinement.

Fresh command outputs: [frontend-checks.json](reconciliation-final/frontend-checks.json), [checks.json](reconciliation-final/checks.json).

Ignored helpers were run with Node/Python for the actual checkout/map/provider handlers, production theme bootstrap, translated states, source preservation, live API/SQL/HTTP and credential scans. The helpers initially required correcting a legacy checkout selector's encoding and adapting cross-context array / syntax comparisons. No application checkout logic was changed to accommodate those adapters. Results and their scope are recorded in the JSON artifacts.

## Runtime and regression evidence

- Health and database health: HTTP 200, connected PostgreSQL.
- Real backend ORS quote for customer `(38.5750, 68.7800)`: **51 points, 2,887 m, 273 s, 20.00 TJS**, real GeoJSON and selected coordinates. Server provider endpoint: `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`.
- Catalog search/product/category and promotion filter passed against the API; all eight promotion results were discounted. Twenty-one valid web routes returned 200.
- `DECLINED`, `INSUFFICIENT`, `ERROR`: no order and no stock decrement. Controlled checkout tests retained cart, form, destination and quote on failures; retained the same payment session on retry; guarded double submission and cleared cart only after successful creation.
- `SUCCESS`: paid sandbox order `3cdace29-6d79-4e5e-9633-8b168be0a031`, payment `5a2ccc25-b663-485c-9c22-98748715a119`, total 38.00 TJS. Repeated successful/failing confirmation after success returned the same order. PostgreSQL verified exactly one linked payment, one order and one item. Repeated receipt GETs were identical.
- Cash order `4570e344-dced-4335-9e07-a506f9d83535`: due on delivery, repeated creation idempotent. Live smoke intentionally created these two local development orders and consumed two units of the selected product; they were not deleted.
- Stale quotes became unavailable after address, selected point or cart changes in controlled component tests. Preference rerenders preserved customer/destination/quote and made no extra routing call.
- Actual cart/presentation providers executed with controlled storage: cart quantities persist through module reload, clamp to stock, clear successfully, and recover from corrupt storage; RU/TJ/EN and dark/light preferences persist and update document attributes. This is not Chrome reload verification.
- Eight production theme bootstrap cases and translated loading/error static markup passed. Technical error strings were hidden.
- Six missing routes returned 404 with the custom component reference. Generated 404 artifact contains branded markup/footer; live initial error/RSC HTML lacks the literal custom heading. Actual rendered 404 remains pending.
- Delivery reference HTTP structure passed (five sections, six steps, five FAQs); source/styles remain unchanged.
- All 36 static files from the rebuilt web container were fetched and scanned. **Zero ORS-key/database-password matches**, zero direct HeiGIT/legacy provider URLs in assets, no public ORS configuration. API response payloads contained neither configured credential; frontend/docs scans found no ORS key. A broader staged-file scan recognized the public development database password only in documented test commands, matching the already committed `.env.example` and the task brief; this is not a private credential. Payment model contains no card fields; sandbox provider has no external payment client.

Details: [runtime-verification.json](reconciliation-final/runtime-verification.json), [real-ors-quote.json](reconciliation-final/real-ors-quote.json), [security-verification.json](reconciliation-final/security-verification.json), [source-preservation.json](reconciliation-final/source-preservation.json), and the component/provider/state/theme JSON results in the same folder.

## Browser acceptance and remaining issues

**Automated browser acceptance: unavailable. Manual visual acceptance for this reconciled tree: PENDING.** The supported browser runtime returned `No browser is available`; its browser list was empty. No screenshot, real Leaflet click, browser network trace, hydration/overflow inspection or visual PASS is claimed. Prior manually accepted versions are historical evidence and do not establish acceptance of this reconciled version.

Manual review remains for `/`, `/catalog`, a valid product, `/cart`, `/checkout`, `/delivery`, `/payment`, `/stores`, `/contacts` and the custom 404. Homepage viewport checks remain pending at **1440, 1024, 768, 390 and 320px**, in both themes and RU/TJ/EN. Review real map/list click synchronization, popup readability, keyboard focus, touch targets, independent OSM links, absence of whole-page jumps/overflow and browser cart/receipt reload. Source sanity and bounded handler/API tests pass and satisfy the request's manual/source sanity gate for a normal push; they do not replace manual visual acceptance.

`npm ci` reported **five high advisories in the unchanged ESLint development dependency chain** (`eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch`, `braces`). Production-only audit reported **zero vulnerabilities**. No forced dependency fix or stack change was applied during reconciliation. Dependency remediation is a separate follow-up.

Recovery branch and safety stash are retained, including while browser acceptance is pending.
