# Homepage store network map

Date: 2026-10-04.

**HOME STORE NETWORK MAP — IMPLEMENTED**  
**LOCAL BUILD / BROWSER ACCEPTANCE — PENDING**

## Scope

The homepage now includes a responsive Leaflet/OpenStreetMap section showing the eight supermarkets currently published by the Paykar Shop storefront store directory (`https://paykar.shop/contacts/stores/`). The map is presentation-only: it does not call ORS, geocoding, checkout, cart or order APIs.

The newer corporate Paykar site reports a broader twelve-store network, including later Paykar/Daily openings. Those newer locations are not present in the Paykar Shop storefront store directory and were not added to this map without a verified coordinate set. This avoids inventing map positions while keeping the recreation aligned with the storefront being reproduced.

## Implementation

- Added `apps/web/src/lib/store-locations.ts` as the canonical frontend dataset for the eight published storefront locations.
- Added `apps/web/src/components/store-network-map.tsx` with a multi-marker Leaflet map.
- Added `apps/web/src/components/home-store-network.tsx` with the homepage section and compact store list.
- Added `apps/web/src/components/home-store-network.module.css` for scoped responsive styling.
- Updated `apps/web/src/components/home.tsx` to place the store network between the delivery CTA and editorial/blog section.

The map:

- uses local static store metadata only;
- fits the viewport to all markers automatically;
- disables scroll-wheel zoom by default;
- uses numbered Paykar-green markers;
- exposes store name/address in a Leaflet popup;
- includes OpenStreetMap attribution;
- links every store row to its map position in a new tab;
- uses the established Paykar theme tokens and responsive grid.

## Storefront locations represented

1. Пайкар 1 — ул. Айни 16б
2. Пайкар 2 — ул. Бухоро 27
3. Пайкар 3 — ул. Яккачинор 148
4. Пайкар 4 — ул. Айни 57
5. Пайкар 5 — пр. Рудаки 66
6. Пайкар 6 — ул. Бободжон Гафуров 10/б, 112 мкр.
7. Пайкар 7 — ул. Борбад 101
8. Пайкар 8 — ул. С. Носира 25

## Responsive behavior

- Desktop: large map + scrollable store directory.
- Tablet: map remains primary with a narrower directory panel.
- <= 768px: map and directory stack; store rows use two columns where space permits.
- <= 520px: single-column store list.
- <= 390px: reduced map height and compact row padding.
- Reduced-motion removes row transitions.

## Verification boundary

The change was applied through the GitHub connector. The connector does not provide a Node/Docker runtime, and the execution environment used for this chat could not resolve GitHub for a local clone, so no new `npm run lint`, `npm run typecheck`, `npm run build`, Docker or browser result is claimed for this revision.

Run locally before final acceptance:

```powershell
Set-Location apps/web
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Then review the homepage at 1440, 1024, 768, 390 and 320 px in dark/light and RU/TJ/EN, including marker popups, OpenStreetMap links, map resizing and mobile overflow.
