# Homepage hero hierarchy and shopping CTA

Date: 2026-10-07. Baseline: local main `9b72b2a`. Status: **HERO IMPROVEMENT — PASS**.

## Scope and implementation

Only three application source files changed:

- `apps/web/src/components/home-hero.tsx`: primary Catalog action, quieter delivery link, concise supporting cards and semantic heading containers.
- `apps/web/src/styles/home.css`: directly related hero/bento rules and responsive spacing.
- `apps/web/src/lib/translations.json`: three new keys with Tajik and English translations. Existing headline, description, Catalog and Delivery translations are reused.

The main hero/right supporting-card composition, Paykar branding, bundled Noto Sans, existing photography and motion hooks remain. Header/navigation, homepage section order and data loading, My Shopping, product cards, maps, phone animation, theme wave, saved items, cart, checkout, backend, database, dependencies and storage are unchanged. There are no new delivery promises or invented promotions. The optional extra delivery reassurance sentence was not added because the concise lead already explains route/price visibility; existing guest-shopping/payment reassurance remains below the actions.

## Before and after

| Area | Before | Final behavior |
| --- | --- | --- |
| Headline | 60px desktop Russian heading; long translations wrap early | 54px maximum Russian heading, 44px maximum for longer TJ/EN; compact 1.05 line height, same family and 800 weight |
| Main action | Generic shopping label beside a similarly substantial ghost button | Solid green `Перейти в каталог` to `/catalog`, followed by a quieter `Как работает доставка` text link to `/delivery` |
| Description | Two short lines | Same truthful two-line copy and translations retained |
| Reassurance | More prominent utility row | Smaller muted guest-shopping/payment row after the CTA group |
| Delivery badge | Floating over the upper green/produce area | Right aligned on the lower paper-bag area on desktop; left of the groceries on mobile; same size and real `/delivery/config` price |
| Grocery photography | Nearly touches card edges | Same asset, contained with 16px image insets; full baguette/produce remain visible |
| Background | Broad central blend | Darker text side using the existing `--on-accent` token, richer green toward the groceries; no new glow/glass effect |
| Supporting cards | Extra large generic headlines, larger imagery | One concise heading per card: Promos/My Shopping, short localized copy and one action; icon 24px, previews 36px |
| Desktop height at 1440 | 512px hero; next section starts at y=763px | 452px hero; next section starts at y=703px; supporting cards 216px instead of 246px |

The hero remains beside its supporting column at 1024–1440px. Below 960px the hero spans the grid; supporting cards follow it, becoming a single column below 640px. At narrow widths, the 56px primary action is full width and the secondary link occupies a separate row with a 44px minimum target. Long Tajik/English headlines deliberately use three readable lines at 320/390px rather than shrinking their type excessively; desktop/tablet headlines use two lines. No headline words are broken arbitrarily.

The main hero retains its dark brand/photo treatment in both themes. Surrounding supporting cards use the existing theme-aware surface, ink and muted tokens. The primary action has dark readable text on Paykar green; focus outlines inside the dark hero use a light tint derived from that green. Decorative images/chips are not focusable, and chips cannot intercept pointer input.

## Actual checks

Run from `apps/web`:

| Command | Result |
| --- | --- |
| `npm run lint` | PASS; no warnings |
| `npm run format:check` | PASS; rerun after final style correction |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; 22 static pages and expected dynamic routes; rerun after final style correction |
| `npm run test:navigation` | PASS; 4 tests |
| `npm run test:catalog` | PASS; 13 tests |
| `npm run test:shopping` | PASS; 6 tests |
| `git diff --check` | PASS |

Existing Node `MODULE_TYPELESS_PACKAGE_JSON` notices in the test runner are non-failing. No unrelated module/dependency changes were made. No new tests were added for this presentation-only change.

Production Docker web build and recreation passed using:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up --build -d --no-deps web
```

Only the frontend was recreated; API and PostgreSQL remained running. Final Compose status: all three services healthy. The private environment file was not edited or exposed.

## Actual browser acceptance

Automated checks ran through Playwright in Chromium `154.0.8037.98` against the production Docker frontend at `http://localhost:3000`, with isolated browser contexts. Real local API responses were used; no API response interception, new orders or user-storage mutations were involved. No manual Chrome acceptance is claimed.

- **30 layout combinations passed:** 320/390/768/1024/1440 × RU/TJ/EN × dark/light. Mobile viewport height 844px; larger viewports 900px. Primary action visible above the fold in all cases; no page overflow, clipped text, broken images, badge/action/text collisions, or overlapping badges. Image insets and the desktop supporting column passed. Document language and theme matched preferences.
- **48 link interactions passed:** Catalog, Delivery, Promos and My Shopping at desktop/mobile × three languages × two themes. Desktop used keyboard Enter; mobile used touch. All reached the intended existing route, preserved presentation preferences, and exposed visible keyboard focus outlines.
- Normal/reduced-motion checks passed. Existing reveal hooks settle visibly. Normal badge/pulse loops retain 6.5s/2.2s durations; reduced motion limits each to one 0.01ms iteration and removes reveal transforms. Pointer lighting remains available for normal mouse input and hidden for reduced motion. Decorative content is not focusable.
- Four final requested screenshots were captured and visually inspected, including long TJ/EN mobile text and both desktop themes. The initial 1024px Tajik pass exposed a badge overlapping reassurance text; the desktop badge was moved onto the bag, and the complete 30-case matrix was rerun successfully with explicit text/badge collision checks.

Evidence: [browser-results.json](homepage-hero/browser-results.json).

| Screenshot | Evidence |
| --- | --- |
| Before, 1440 RU dark | [View](homepage-hero/screenshots/hero-before-1440-ru-dark.png) |
| Final, 1440 RU dark | [View](homepage-hero/screenshots/hero-1440-ru-dark.png) |
| Final, 1440 RU light | [View](homepage-hero/screenshots/hero-1440-ru-light.png) |
| Final, 390 TJ dark | [View](homepage-hero/screenshots/hero-390-tj-dark.png) |
| Final, 390 EN light | [View](homepage-hero/screenshots/hero-390-en-light.png) |

## Remaining issues and publication boundary

No remaining hero acceptance failure. Long translated headings wrap to three lines on narrow phones by design. On 844px-high mobile viewports, the shopping action is visible before the image/supporting cards; scrolling reveals the rest of the composition normally. No changes were committed or pushed.
