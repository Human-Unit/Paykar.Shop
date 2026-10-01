# Seed data

`products.json` contains our own demonstration data: 6 supermarket sections, one nested fruit category, and 40 products. All prices/stock/descriptions are fictional assignment data, not Paykar's production catalog. Two products are intentionally out of stock.

After Alembic has migrated PostgreSQL, run from the repository root:

```powershell
docker compose exec api python /seed/seed.py
```

Repeat runs insert missing category slugs/product SKUs and leave existing rows unchanged. They do not duplicate records, reset stock, or overwrite future order-related catalog changes. Remove/reseed records only through an explicitly authorized maintenance operation.

The API container mounts this directory read-only at `/seed`. For local Python 3.12 development, from `apps/api`, use `python ../../db/seed/seed.py`.

Images under `apps/web/public/images/products/` are original, code-authored demo SVG illustrations: apple, milk, bread, bottle, chocolate, cleaner, and fallback. They are generic category artwork, reused across product cards and explicitly marked as illustrative. No production images were scraped and no external image/license dependency is required. The independent demo branding is a text placeholder.
