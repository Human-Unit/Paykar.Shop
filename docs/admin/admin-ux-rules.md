# Paykar Admin UX rules

The operational workspace, advanced Design Console and inline storefront editor
serve different jobs. Storefront imagery/motion must not become administrative
chrome. Existing English administrative labels use `lang="en"`; shopper
RU/TJ/EN preferences remain independent.

## Resource workflow

Use index → detail → edit/create. Products, promotions and stores now have full
detail routes under `/admin/{resource}/{record}`. Product creation uses `new`.
Store creation remains unavailable because the existing API does not support it.
Order detail remains read-only; no status transitions were invented. Categories,
inventory adjustments and administrator edits use native modal drawers, including
focus containment, Escape and unsaved-change confirmation.

Large forms retain current measurement controls, validation, stock-conflict
checks and role safeguards. Cancel/discard is separate from Save. Do not add
delete, order cancellation or account-disable shortcuts as primary green actions.
If adding a destructive action later, use a named danger section/menu and an
explicit confirmation; retain backend invariants.

## Lists and primitives

Shared primitives: `AdminHeader`, `DataTable`, `FilterBar`, `StatusBadge`, `SaveBar`
and `AdminDrawer`. Keep title/action → search/filter/sort → table → pagination.
Use meaningful primary-column links and explicit row actions. Tables scroll
within their own keyboard-focusable region on small screens, without document
overflow. Mouse clicks on non-interactive row cells open the primary detail/edit
action; links/buttons, text selection and modified clicks keep native behavior.
Keyboard users retain explicit links/buttons. Do not rely on row-click alone.
Primary create actions sit beside the page title, above list filters. Drawers
restore focus to their initiating button after close/discard.

Search, filters, sorting and pagination belong in the URL. `admin-list-state.ts`
normalizes allowed values; backend queries independently validate them. Resource
endpoints perform filtering/counting/sorting/pagination before returning rows.
Product/inventory/promotion lists retain existing category/stock/sale filtering
and add bounded sorting. Orders add UUID search, existing-status filtering and
date/total sorting; the item count is a correlated query, not one request per row.
Categories, stores and administrators accept optional paged views, search and
ID/name sort; their no-page array responses remain compatible with older consumers
and category-option loading.

Grouped navigation: Operations (Overview, Orders), Catalog (Products, Categories,
Promotions, Inventory), Locations (Stores), MASTER-only Master (Design,
Administrators), System (Settings), then Back to storefront. Backend permissions
remain authoritative; the sidebar is a convenience, not a security boundary.

## Feedback and future boundaries

Retain loading, retryable API failures, useful successful-empty states, pending
guards and saved feedback. Dashboard counts come from database records. No fake
revenue/growth/customer metrics.

Future bulk actions should operate on stable selected IDs, show contextual
actions, report per-row failures and retain failed selections. Future grid edits
should preserve stock conflict checks and explicit commit/cancel boundaries.
Future shell search should call bounded resource-search endpoints rather than
download all records. Selection, grid editing and a global-search UI are not
implemented in this pass; do not imply that preparatory boundaries are features.

Use controlled-token editing rules in `inline-master-design-mode.md` for design,
not operational resource forms. No unrequested commits or pushes.
