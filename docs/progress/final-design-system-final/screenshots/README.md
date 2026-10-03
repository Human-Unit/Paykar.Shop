# Final shared design: screenshot manifest and manual review

Status: **PENDING**. Codex Browser selection returned **No browser is available** and discovery returned `[]`. No screenshots of this pass were captured. Earlier manual PASS and screenshots cover earlier versions.

Capture the current app at widths **1440, 1024, 768, 390 and 320px**; record viewport height, language and theme alongside each image.

Required images:

- `desktop-home`
- `desktop-catalog`
- `desktop-product`
- `desktop-cart`
- `desktop-checkout`
- `desktop-confirmation`
- `mobile-home`
- `mobile-catalog`
- `mobile-checkout`
- A desktop information disclosure and an open mobile burger drawer

Manual acceptance checklist:

- Measure utility/main/navigation header rows and total height. Check logo/search/cart centerlines and common container edges through breadcrumbs, sidebar, filters, banners, product grid and footer.
- Review complete dark and light surfaces. Product photos and map imagery may remain bright. Check the supplied logo and embedded slogan against the dark header/banner.
- Select Dark and Light; confirm a single active indicator, 44px hit targets, 180ms motion and reduced-motion behavior. Confirm saved selections after reload. A pre-existing saved System preference should resolve to one of the two displayed buttons; System is no longer offered.
- Switch RU/TJ/EN and reload. Check long labels/card names, fixed header geometry, the banner and every new information message. Verify no horizontal overflow at each width; product cards deliberately use one column at 320px.
- Hover and keyboard-focus each desktop information trigger. Verify disclosure position, readable demo-only information, Escape and outside/focus dismissal. No fake payment, legal policy, brands, contacts or blog content should appear.
- Open the burger by mouse, touch and keyboard. Tab/Shift+Tab stay in the modal; Escape, close button and backdrop close it and return focus appropriately. Mobile disclosures must work without hover; Catalog and Promotions links navigate and close the drawer.
- Verify search debounce, cancellation, ArrowUp/Down, Enter, Escape, clear and full-results navigation. Confirm suggestions use elevated theme surfaces.
- Verify catalog/category selection, filters, sort and pagination; category rows include icons/chevrons on desktop. Review photo/name/price/action alignment, quantities, removal, stock limits and persisted cart.
- Populate checkout and calculate a real route. Switch theme/language and confirm customer fields, scroll, cart, map camera and route remain unchanged and no extra ORS quote is requested.
- Confirm the visible route, distance, ETA and delivery price. Failed checkout retains cart; successful creation clears it. Confirm the order and reload confirmation.
- Confirm the browser requests routing only through the local backend, with no ORS key in browser payloads/headers or direct HeiGIT call.

HTTP/source checks in the neighboring JSON evidence files do not satisfy these interactive or visual checks.
