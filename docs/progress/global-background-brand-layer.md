# Global background brand layer

Date: 2026-10-02.

**GLOBAL BACKGROUND BRAND LAYER — IMPLEMENTED**  
**GLOBAL BACKGROUND VISIBILITY — FIXED**  
**VISUAL ACCEPTANCE — PENDING**

## Design and implementation

A single static CSS atmosphere layer now sits behind the shared application shell. It uses a near-black base, restrained Paykar-green radial glows, and a diagonal charcoal gradient. A second fixed layer uses the existing `public/images/paykar/logo.png`, scaled and cropped to show one oversized symbol watermark. The PNG remains byte-for-byte unchanged. Both layers ignore pointer events and do not affect layout or scrolling.

The visibility refinement increases the default dark-theme glows to 12% and 7%, with a 14% watermark. The diagonal base now fades from `#050505` through `#090909` to `#0c120d`. The primary glow is centered at 78%/28%; the second glow is at 15%/82%. The symbol scales to 42vw, bounded between 420px and 680px, starts at 20vh, and is cropped beyond the right edge by 8vw. A 1px blur softens its edges; normal blending keeps the result predictable.

Cart, checkout and confirmation layouts reduce the glows to 8%/6% and the watermark to 9%. CSS detects their existing layout classes without changing components, provider state or routing. Tablet widths cap watermark opacity at 11%; mobile up to 640px caps it at 8%, and widths up to 360px cap it at 6%. At 390px the symbol scales to approximately 296px, with a 20vw crop; at 320px it scales to approximately 243px with a 24vw crop. These are CSS targets, not measured browser results.

Light theme retains the clean off-white gradient with a 5% glow and uses a 3% watermark. The mobile caps never increase Light theme opacity. No background motion, canvas, video, image dependency or extra asset was added.

The global body background is transparent over the themed HTML base. An isolated stacking context and fixed negative-layer pseudo-elements keep the effect behind normal content. Both decorative boxes stay inside the viewport: the oversized symbol is positioned and cropped as a background image, rather than extending a positioned element past the right edge. The original supplied PNG is reused, with the wordmark outside the visible crop.

The wrapper audit found that the main content and catalog/product/cart/checkout layout wrappers already have no opaque background. The stylesheet now explicitly keeps these wrappers transparent. The broad home discount section uses an 88% dark-theme surface mix; its product cards retain their opaque surfaces. Headers, filters, cards, cart summary, forms, inputs, receipt and drawer keep their existing readable surfaces. The hero remains opaque. The same atmosphere supports every page through the shared body layer.

Only `apps/web/src/app/paykar-theme.css` and this progress report were changed for this task. No business logic or other application files changed. The original logo was not modified.

## Original implementation verification

The following results belong to the original background implementation earlier on 2026-10-02. They are retained as historical evidence. The frontend checks were rerun for the visibility refinement below; backend tests were not rerun for this CSS-only refinement.

Frontend commands passed from `apps/web`:

```powershell
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Backend checks passed in the API container:

```powershell
docker compose exec api python -m compileall app
docker compose exec api ruff check .
docker compose exec api ruff format --check .
docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
docker compose exec api alembic current
```

Pytest: **63 passed**, with one existing Starlette/AnyIO deprecation warning. Ruff found no issues; 33 Python files are formatted. Alembic is at `0001_foundation (head)`. No backend source changed.

Docker checks passed:

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
```

PostgreSQL, API and web report healthy. The production image build also compiled and generated the frontend routes successfully.

## Visibility refinement verification

After the visibility changes, all four frontend commands were executed again and passed: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run format:check`. The rebuilt Docker production image also completed its own frontend production build. `docker compose up --build -d --wait` succeeded and PostgreSQL, API and web report healthy. No backend changes were made. No engineering command failed.

The before-edit CSS was copied into ignored `.cache/background-visibility-before.css`. Only the background definitions, explicit page-wrapper transparency and the discount-section background were adjusted in the application stylesheet. The earlier hero image fitting correction is preserved.

An actual browser preview was attempted again, but Codex Browser returned an empty session list. The stronger treatment is deployed locally; its perceived visibility, symbol crop and readability still need review in Chrome at the requested widths. No screenshot or completed visual comparison is claimed.

## Manual visual review

Automated browser preview is unavailable because Codex Browser returned no connected sessions. No manual review or screenshots are claimed for this revision. Visual acceptance remains pending at these viewports:

| Viewport | Review | Status |
| --- | --- | --- |
| 1440px | Dark gradient, faint symbol crop, clear header and card contrast | PENDING |
| 1024px | Glow and watermark remain behind content; no awkward crop | PENDING |
| 768px | Tablet watermark position and page readability | PENDING |
| 390px | Soft glow, low watermark, no clutter or horizontal overflow | PENDING |
| 320px | Watermark stays unobtrusive; page content and controls fit | PENDING |
| Light theme | Near-white gradient and barely visible symbol, crisp text and surfaces | PENDING |

The browser connection is the remaining acceptance limitation. Source changes are confined to the global presentation stylesheet, and all requested automated checks passed. No commit or push was made.
