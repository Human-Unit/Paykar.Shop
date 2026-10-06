# Graph Report - grafify  (2026-10-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 614 nodes · 1571 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 84 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `26df2830`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Rebuild this code-only graph with `graphify extract . --code-only --out grafify` (no API cost).

## Community Hubs (Navigation)
- Orders and Delivery API
- Shared Web Layout and Branding
- Web Dependencies and Tooling
- Catalog UI and Filtering
- Product API and Schemas
- API Configuration and Health
- Public Pages and Maps
- Cart UI and Product Cards
- Homepage and Motion UI
- TypeScript Configuration
- Delivery Service and Tests
- Checkout Components and Maps
- Delivery Quote API
- Database Models and Fixtures
- Catalog API Tests
- Public Content Pages
- Payment Workflow Tests
- Order Workflow Tests
- Order Confirmation and UI States
- Dynamic Product and Category Pages
- Product Connection Tests
- Category API Schemas
- Category API Routes
- Health API Routes
- Configuration Validation
- Next.js Configuration
- Next.js Type Declarations
- PostCSS Configuration
- Checkout Page Flow

## God Nodes (most connected - your core abstractions)
1. `usePresentation()` - 84 edges
2. `Settings` - 31 edges
3. `DeliveryService` - 29 edges
4. `useResource()` - 29 edges
5. `cents()` - 21 edges
6. `create_app()` - 19 edges
7. `useReveal()` - 18 edges
8. `confirm()` - 17 edges
9. `DeliveryPoint` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `seed()` --uses--> `Settings`  [INFERRED]
  db/seed/seed.py → apps/api/app/core/config.py
- `create_app()` --uses--> `DeliveryError`  [INFERRED]
  apps/api/app/main.py → apps/api/app/services/delivery_service.py
- `confirm()` --uses--> `DeliveryService`  [INFERRED]
  apps/api/app/payments/service.py → apps/api/app/services/delivery_service.py
- `create_session()` --uses--> `DeliveryService`  [INFERRED]
  apps/api/app/payments/service.py → apps/api/app/services/delivery_service.py
- `DeliveryService` --uses--> `Settings`  [INFERRED]
  apps/api/app/services/delivery_service.py → apps/api/app/core/config.py

## Import Cycles
- None detected.

## Communities (39 total, 5 thin omitted)

### Orders and Delivery API - "Orders and Delivery API"
Cohesion: 0.08
Nodes (57): create(), detail(), Delivery, get, post, Session, UUID, confirm() (+49 more)

### Shared Web Layout and Branding - "Shared Web Layout and Branding"
Cohesion: 0.07
Nodes (42): metadata, Brand(), Footer(), groups, subscribe(), MobileTabBar(), NotFoundView(), LanguageSelector() (+34 more)

### Web Dependencies and Tooling - "Web Dependencies and Tooling"
Cohesion: 0.04
Nodes (46): dependencies, framer-motion, leaflet, lucide-react, next, react, react-dom, devDependencies (+38 more)

### Catalog UI and Filtering - "Catalog UI and Filtering"
Cohesion: 0.10
Nodes (32): metadata, Catalog(), apply(), categoryHref(), CatalogFilterDialog(), CatalogMegaMenu(), cancelPending(), close() (+24 more)

### Product API and Schemas - "Product API and Schemas"
Cohesion: 0.14
Nodes (26): allow_inf_nan, product(), product_connections(), product_connections_batch(), products(), Decimal, get, post (+18 more)

### API Configuration and Health - "API Configuration and Health"
Cohesion: 0.14
Nodes (19): configure(), online(), Settings, make_engine(), create_app(), isolate_settings_environment(), fixture, parametrize (+11 more)

### Public Pages and Maps - "Public Pages and Maps"
Cohesion: 0.14
Nodes (17): ArticleCard(), articlePresentation, MapLoading(), FAQSection(), LocationIllustration(), OffersIllustration(), PaymentIllustration(), ReturnsIllustration() (+9 more)

### Cart UI and Product Cards - "Cart UI and Product Cards"
Cohesion: 0.22
Nodes (15): CartPage(), OrderConfirmation(), AddButton(), demoPhotos, discountPercent(), producePhotos, ProductCard(), ProductImage() (+7 more)

### Homepage and Motion UI - "Homepage and Motion UI"
Cohesion: 0.15
Nodes (19): metadata, HomeHero(), Home(), HomeStoreNetwork(), StoreNetworkMap, ease, MotionImage, MotionLink (+11 more)

### TypeScript Configuration - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+19 more)

### Delivery Service and Tests - "Delivery Service and Tests"
Cohesion: 0.22
Nodes (21): DeliveryError, DeliveryService, get_delivery_service(), Request, fixture_lifespan(), Temporary browser test app: real test PostgreSQL, explicitly mocked ORS only.…, client(), configured() (+13 more)

### Checkout Components and Maps - "Checkout Components and Maps"
Cohesion: 0.11
Nodes (23): Map, MapLoading(), Review, DeliveryMap(), SandboxCard(), SandboxFields, Scenario, scenarios (+15 more)

### Delivery Quote API - "Delivery Quote API"
Cohesion: 0.16
Nodes (18): config(), Delivery, get, post, Request, quote(), DeliveryPoint, DeliveryQuote (+10 more)

### Database Models and Fixtures - "Database Models and Fixtures"
Cohesion: 0.26
Nodes (10): Base, Category, OrderItem, ProductConnection, Product, fixture, rich_client(), catalog() (+2 more)

### Catalog API Tests - "Catalog API Tests"
Cohesion: 0.16
Nodes (5): parametrize, test_facets_query_count_is_bounded_without_n_plus_one(), test_filter_intersections_and_counts(), test_invalid_filter_parameters(), test_sorting_pagination_after_filtering()

### Public Content Pages - "Public Content Pages"
Cohesion: 0.16
Nodes (8): Breadcrumbs(), benefits, DeliveryPage(), DeliveryRouteIllustration(), questions, steps, PublicPage(), storePages

### Payment Workflow Tests - "Payment Workflow Tests"
Cohesion: 0.35
Nodes (12): cleanup_pending(), confirm(), payment(), parametrize, test_changed_stock_rolls_back_payment(), test_duplicate_concurrent_confirmation(), test_expiration_preserves_stock_and_persists_cancelled(), test_failure_persisted_no_order_retry() (+4 more)

### Order Workflow Tests - "Order Workflow Tests"
Cohesion: 0.24
Nodes (13): body(), parametrize, test_concurrent_last_item(), test_conflict_atomic_rollback(), test_database_failure_after_order_insert_rolls_back(), test_duplicate_product_lines_are_aggregated(), test_invalid_input_tampered_prices(), test_provider_failure_does_not_write() (+5 more)

### Order Confirmation and UI States - "Order Confirmation and UI States"
Cohesion: 0.36
Nodes (4): Empty(), Failure(), Loading(), Order

### Dynamic Product and Category Pages - "Dynamic Product and Category Pages"
Cohesion: 0.29
Nodes (7): dynamic, Page(), dynamic, Page(), dynamic, Page(), ensureEntity()

### Product Connection Tests - "Product Connection Tests"
Cohesion: 0.27
Nodes (7): get_session(), AsyncSession, Request, edge(), test_batch_preserves_source_and_connection_order(), test_duplicate_and_self_relationships_are_rejected(), test_single_connections_are_curated_ordered_and_available()

### Category API Routes - "Category API Routes"
Cohesion: 0.67
Nodes (4): categories(), category(), get, Session

### Health API Routes - "Health API Routes"
Cohesion: 0.50
Nodes (4): db_health(), health(), get, Session

### Checkout Page Flow - "Checkout Page Flow"
Cohesion: 0.32
Nodes (5): Checkout(), invalidateLocation(), select(), submit(), validSandbox()

## Knowledge Gaps
- **89 isolated node(s):** `CartContext`, `Item`, `Preferences`, `Presentation`, `Theme` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `usePresentation()` connect `Public Pages and Maps` to `Shared Web Layout and Branding`, `Catalog UI and Filtering`, `Checkout Page Flow`, `Cart UI and Product Cards`, `Homepage and Motion UI`, `Checkout Components and Maps`, `Public Content Pages`, `Order Confirmation and UI States`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `Settings` connect `API Configuration and Health` to `Delivery Service and Tests`, `Delivery Quote API`, `Database Models and Fixtures`, `Catalog API Tests`, `Product Connection Tests`, `Configuration Validation`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `DeliveryService` connect `Delivery Service and Tests` to `Orders and Delivery API`, `Order Workflow Tests`, `Delivery Quote API`, `API Configuration and Health`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `Settings` (e.g. with `make_engine()` and `delivery_price()`) actually correct?**
  _`Settings` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `DeliveryService` (e.g. with `confirm()` and `create_session()`) actually correct?**
  _`DeliveryService` has 15 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CartContext`, `Item`, `Preferences` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Orders and Delivery API` be split into smaller, more focused modules?**
  _Cohesion score 0.07629107981220658 - nodes in this community are weakly interconnected._
