# Master Design Console

MASTER-only route `/admin/master/design`; history is included in the workspace
and also reachable at `/admin/master/design/history`. Backend role checks apply
even when called outside the UI. Preview is a representative component showcase,
not an iframe or page builder. It uses a real sale product fetched from the catalog.

## Controlled schema

`app/schemas/design.py` and `src/lib/design-config.ts` define matching defaults.
Extra fields, arbitrary declarations, non-hex colors and out-of-range/non-finite
numbers are rejected. Frontend validates independently before emitting CSS.

| Group      | Tokens / limits                                                                           | Initial adoption                                                           |
| ---------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Colors     | brand, sale; dark/light background/surface/raised/text/muted/border; border opacity .04–1 | Existing palette variables and sale tapes                                  |
| Typography | heading/body scales .85–1.2; bundled Noto Sans retained                                   | Body, catalog/product titles, shopping title variables                     |
| Layout     | width 960–1600, padding 20–64, spacing 40–96                                              | Global contained layouts/section rhythm; bounded mobile gutters            |
| Shape      | button 4–24, card 8–32, panel 12–40                                                       | Global and shopping radius variables                                       |
| Effects    | blur 0–20, glass opacity .6–1, glow/shadow 0–1.25, watermark 0–.12                        | Hero-chip blur, existing glass/glow/shadow variables, homepage panel marks |
| Motion     | intensity 0–1, product hover lift 0–5, duration multiplier .7–1.3                         | Product image/hover and existing CSS duration variables                    |

Derived soft/strong green values follow the existing color-mix system. No font
selector or synthesized font weights. Bespoke WebGL shaders, phone animation,
hard-coded local component measurements and maps are intentionally not replaced
by a global token rewrite. Motion intensity is lightweight product hover feedback,
not a WebGL/phone playback control. Reduced motion disables decorative hover lift;
existing reduced-motion safeguards remain authoritative.

**Paykar Default emits no token overrides.** This is essential: original local
values and breakpoint-specific radii/gutters remain exactly as approved. Defaults
are canonical in code, not scraped at runtime. Changing a token overrides only
its controlled consumers. Resetting/publishing defaults removes those overrides.
Light borders have their own color/opacity; light watermark overrides remain half
the dark opacity. White product-image stages and storefront preference persistence
are preserved. Color controls are labelled and expose both picker and hex values;
MASTER should visually check contrast in both themes before publishing.

## Lifecycle and history

1. Edit controls: local React state immediately updates preview only.
2. Save draft: server validates all fields and creates a new immutable saved
   version in `DRAFT`. Saving does not alter the public theme.
3. Publish saved draft: explicit confirmation, disabled while dirty/pending.
   Transaction advisory lock archives the previous publication and publishes the
   selected saved draft. Partial unique index guarantees one `PUBLISHED` row.
4. Restore a previously published version: copy into a **new DRAFT/version**.
   History and the current storefront remain unchanged until another publish.
5. Paykar Default → draft: local reset, then explicit save/publish to return to
   baseline. Reset edits discards only unsaved changes to the loaded snapshot.

Monotonic versions are allocated under the same publication lock. History shows
version, author, creation time and status. The latest 100 versions are shown; no
automatic destructive pruning. Published timestamp survives archival, distinguishing
restorable publications from un-published drafts. All meaningful operations are
audited without storing credentials. Dirty edits warn on document/link navigation.

## Public loading and fallback

GET `/api/v1/design/public` exposes `{version, config}` only. No draft, author,
administrator IDs, audit or session metadata. With no publication it returns
canonical defaults. No-store avoids stale publication caches.

One central `StorefrontDesign` consumer loads on entering the public application,
not on each component render. It rechecks on window focus, throttled to 30 seconds;
same-window publication can explicitly refresh. New/reloaded visits get the latest
configuration without rebuilding. Already open unfocused tabs retain their theme
until focus/reload; there is no polling/WebSocket infrastructure.

The local approved defaults are available before hydration and API failure never
blocks shopping. A failed refresh retains the last valid configuration in that tab.
CSS generation uses only fixed property names and validated hex/numeric values.
Default emits an empty style payload. Admin styling is isolated and cannot be
changed by storefront design publication.

## Preview and extensions

Desktop/tablet/mobile preview widths, dark/light and RU/TJ/EN are local to the
preview. Heading/body/actions/input/panel/sale ribbon/product/glass are representative;
preview actions deliberately do not mutate the shopping cart. No fabricated sales
or product imagery are used if catalog retrieval fails. Existing storefront
translations populate the preview; operational admin labels remain English.

Future component presets may build on the controlled schema, with an explicit
schema migration/version strategy if its shape changes after release. Do not
insert arbitrary CSS or silently reinterpret saved JSON versions. Color contrast
inspection and broader per-component token adoption remain deliberate extensions.
