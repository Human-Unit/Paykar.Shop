# Phase 0 Recommendation Policy — Manual Product Pairings Only

This decision supersedes any Phase 0 wording that suggests ML, algorithmic recommendation scoring, popularity ranking, similarity scoring, collaborative filtering, behavioral personalization, or a recommendation service.

## Decision

Paykar will use **simple manually curated product connections** only.

Examples:

- sambusa -> cola
- cola -> sambusa
- cola -> chips
- tea -> biscuits
- bread -> butter
- pasta -> sauce

The goal is not to predict what a user wants. The goal is simply to expose obvious, human-defined complementary products that make sense in a grocery context.

## What is explicitly out of scope

Do not implement:

- machine learning,
- collaborative filtering,
- recommendation scoring,
- price-proximity ranking,
- behavioral ranking,
- popularity algorithms,
- purchase-history inference,
- 'frequently bought together' calculations,
- personalized recommendations,
- recommendation microservices.

Do not claim that a connection is statistically learned unless real order data exists and such a feature is explicitly requested later.

## Implementation model for a later phase

Use explicit curated relationships, for example:

- product -> product links, or
- product/category -> small curated product list.

The relationship data should be easy to inspect and edit manually. There should be no hidden scoring or inference logic.

A product page or cart can render a small section such as:

- `Хорошо подходит к этому`
- `Можно добавить к покупке`
- `Вместе часто берут` only if this wording is treated as editorial copy, not a data claim; otherwise prefer the first two labels.

Keep the set small, typically 3–6 items, and always keep the primary shopping task more prominent than the suggestions.

## Phase ordering impact

This does not change Phase 1A. Phase 1A remains focused on catalog discovery:

- filters,
- active filter state,
- mobile filtering,
- search + filter + sort composition,
- zero-result recovery,
- catalog hierarchy redesign.

Manual product pairings belong to a later phase after the catalog experience is strong.
