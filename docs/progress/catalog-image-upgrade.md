# Catalog image upgrade

## Scope and audit

2026-10-12. Audited all 40 seeded and live catalog products. Replaced 33 broad category pictures with product-specific generated illustrations; retained seven suitable existing produce pictures without altering their bytes. No current seeded product still uses a broad category illustration. Legacy category resolution remains available for older stored snapshots/data, and the existing missing-image SVG fallback remains intact.

Priority: sale inventory first (raisin bun, yogurt, garbage bags, orange juice, dish soap, wheat bread, dark chocolate; carrots retained), then homepage/first catalog screen, then the remaining catalog. The previous six SVG references resolved to six repeated category photos plus seven produce-specific photos. Canonical seed references now identify each asset directly; there are 40 distinct product paths.

## Assets and exact mapping

All added files reside under `apps/web/public/images/products/generated/`. Sources were generated separately through the built-in image-generation tool, not downloaded from the internet. Original 1254px PNGs remain outside the repository in the local generated-images workspace. Production assets are RGB 1024×1024 WebP, quality 82/method 6 with Lanczos resizing. No PNG source files ship in public assets.

| Product                                       | Previous canonical image         | Final public image                                | Action    | KiB   |
| --------------------------------------------- | -------------------------------- | ------------------------------------------------- | --------- | ----- |
| Яблоки красные, 1 кг (`apples-red`)           | `/images/products/apple.svg`     | `/images/paykar/apples.webp`                      | Retained  | 40.9  |
| Бананы, 1 кг (`bananas`)                      | `/images/products/apple.svg`     | `/images/paykar/bananas.webp`                     | Retained  | 15.8  |
| Апельсины, 1 кг (`oranges`)                   | `/images/products/apple.svg`     | `/images/paykar/oranges.webp`                     | Retained  | 38.2  |
| Лимоны, 500 г (`lemons`)                      | `/images/products/apple.svg`     | `/images/paykar/lemons.webp`                      | Retained  | 29.1  |
| Морковь, 1 кг (`carrots`)                     | `/images/products/apple.svg`     | `/images/paykar/carrots.webp`                     | Retained  | 25.1  |
| Картофель, 1 кг (`potatoes`)                  | `/images/products/apple.svg`     | `/images/paykar/potatoes.webp`                    | Retained  | 19.0  |
| Огурцы, 500 г (`cucumbers`)                   | `/images/products/apple.svg`     | `/images/paykar/cucumbers.webp`                   | Retained  | 36.5  |
| Молоко 3,2%, 1 л (`milk`)                     | `/images/products/milk.svg`      | `/images/products/generated/milk.webp`            | Generated | 15.2  |
| Кефир 2,5%, 1 л (`kefir`)                     | `/images/products/milk.svg`      | `/images/products/generated/kefir.webp`           | Generated | 17.0  |
| Йогурт натуральный, 200 г (`yogurt`)          | `/images/products/milk.svg`      | `/images/products/generated/yogurt.webp`          | Generated | 32.1  |
| Сметана 20%, 300 г (`sour-cream`)             | `/images/products/milk.svg`      | `/images/products/generated/sour-cream.webp`      | Generated | 38.5  |
| Творог 5%, 250 г (`cottage-cheese`)           | `/images/products/milk.svg`      | `/images/products/generated/cottage-cheese.webp`  | Generated | 39.1  |
| Масло сливочное, 180 г (`butter`)             | `/images/products/milk.svg`      | `/images/products/generated/butter.webp`          | Generated | 23.9  |
| Сыр полутвёрдый, 200 г (`cheese`)             | `/images/products/milk.svg`      | `/images/products/generated/cheese.webp`          | Generated | 37.0  |
| Хлеб пшеничный, 400 г (`wheat-bread`)         | `/images/products/bread.svg`     | `/images/products/generated/wheat-bread.webp`     | Generated | 143.2 |
| Хлеб ржаной, 400 г (`rye-bread`)              | `/images/products/bread.svg`     | `/images/products/generated/rye-bread.webp`       | Generated | 179.1 |
| Лепёшка, 1 шт (`flatbread`)                   | `/images/products/bread.svg`     | `/images/products/generated/flatbread.webp`       | Generated | 139.6 |
| Багет, 250 г (`baguette`)                     | `/images/products/bread.svg`     | `/images/products/generated/baguette.webp`        | Generated | 80.8  |
| Круассан, 1 шт (`croissant`)                  | `/images/products/bread.svg`     | `/images/products/generated/croissant.webp`       | Generated | 75.6  |
| Булочка с изюмом, 1 шт (`raisin-bun`)         | `/images/products/bread.svg`     | `/images/products/generated/raisin-bun.webp`      | Generated | 110.7 |
| Лаваш, 200 г (`lavash`)                       | `/images/products/bread.svg`     | `/images/products/generated/lavash.webp`          | Generated | 77.6  |
| Вода негазированная, 1 л (`water`)            | `/images/products/bottle.svg`    | `/images/products/generated/water.webp`           | Generated | 34.2  |
| Вода газированная, 1 л (`sparkling-water`)    | `/images/products/bottle.svg`    | `/images/products/generated/sparkling-water.webp` | Generated | 58.4  |
| Сок яблочный, 1 л (`apple-juice`)             | `/images/products/bottle.svg`    | `/images/products/generated/apple-juice.webp`     | Generated | 46.8  |
| Сок апельсиновый, 1 л (`orange-juice`)        | `/images/products/bottle.svg`    | `/images/products/generated/orange-juice.webp`    | Generated | 42.5  |
| Чай чёрный, 25 пакетиков (`black-tea`)        | `/images/products/bottle.svg`    | `/images/products/generated/black-tea.webp`       | Generated | 31.6  |
| Чай зелёный, 25 пакетиков (`green-tea`)       | `/images/products/bottle.svg`    | `/images/products/generated/green-tea.webp`       | Generated | 53.1  |
| Кофе молотый, 200 г (`coffee`)                | `/images/products/bottle.svg`    | `/images/products/generated/coffee.webp`          | Generated | 84.4  |
| Шоколад молочный, 90 г (`milk-chocolate`)     | `/images/products/chocolate.svg` | `/images/products/generated/milk-chocolate.webp`  | Generated | 46.4  |
| Шоколад тёмный, 90 г (`dark-chocolate`)       | `/images/products/chocolate.svg` | `/images/products/generated/dark-chocolate.webp`  | Generated | 71.4  |
| Печенье овсяное, 250 г (`oat-cookies`)        | `/images/products/chocolate.svg` | `/images/products/generated/oat-cookies.webp`     | Generated | 117.5 |
| Вафли, 200 г (`wafers`)                       | `/images/products/chocolate.svg` | `/images/products/generated/wafers.webp`          | Generated | 71.4  |
| Мармелад, 150 г (`marmalade`)                 | `/images/products/chocolate.svg` | `/images/products/generated/marmalade.webp`       | Generated | 126.0 |
| Мёд цветочный, 250 г (`honey`)                | `/images/products/chocolate.svg` | `/images/products/generated/honey.webp`           | Generated | 48.0  |
| Средство для посуды, 500 мл (`dish-soap`)     | `/images/products/cleaner.svg`   | `/images/products/generated/dish-soap.webp`       | Generated | 35.9  |
| Мыло жидкое, 300 мл (`liquid-soap`)           | `/images/products/cleaner.svg`   | `/images/products/generated/liquid-soap.webp`     | Generated | 22.7  |
| Салфетки бумажные, 100 шт (`napkins`)         | `/images/products/cleaner.svg`   | `/images/products/generated/napkins.webp`         | Generated | 58.4  |
| Полотенца бумажные, 2 рулона (`paper-towels`) | `/images/products/cleaner.svg`   | `/images/products/generated/paper-towels.webp`    | Generated | 46.3  |
| Губки для посуды, 5 шт (`sponges`)            | `/images/products/cleaner.svg`   | `/images/products/generated/sponges.webp`         | Generated | 124.6 |
| Пакеты для мусора, 20 шт (`trash-bags`)       | `/images/products/cleaner.svg`   | `/images/products/generated/trash-bags.webp`      | Generated | 62.8  |

## Style and asset review

New assets: 15.2–179.1 KiB each, average 66.4 KiB; 2.14 MiB combined. Each source was viewed individually for subject accuracy, container geometry, contact shadows, material texture, fused/duplicated objects and text. Accepted 33 of 33; zero rejected/regenerated assets. This does not establish exact manufacturer/SKU appearance. Unbranded generic presentation is intentional. Generated assets contain no sale ribbons, percentages, prices, logos or labels; those remain DOM/CSS.

The shared image renderer uses canonical references and keeps existing fallback handling. Generated imagery receives the quiet RU/TJ/EN product-illustration disclosure in cards/detail/promotions hero and an image title in compact previews. Legacy category imagery keeps the category disclosure. No product-specific React overrides were added.

### Exact generation prompts

#### `raisin-bun.webp`

Use case: product-mockup. Asset type: square 1024x1024 premium grocery catalog product illustration. Subject: ONE realistic round golden raisin bun for the product 'raisin bun, one piece', with visible raisins embedded in a soft baked surface; no baguettes, no croissants, no other products. Clean warm off-white seamless studio background (#f5f5f1), soft natural upper-left studio light, believable soft contact shadow, detailed natural bread texture, three-quarter view slightly from above. Subject occupies about 70-75% of the frame with at least 12% breathing room on all sides, centered slightly off-axis. Realistic photographic style, not CGI. No brand, logo, packaging, text, typography, nutrition labels, prices, badges, ribbons, watermark, props, or UI. Output a single standalone square image, not a collage.

#### `yogurt.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: Natural plain white yogurt in one small unbranded white 200g cup with foil lid partly peeled back, showing thick creamy yogurt; one simple teaspoon beside it. No milk bottle, cheese, fruit or branding.

#### `trash-bags.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A compact roll of plain black plastic garbage bags with one bag partially unrolled into a neatly folded rectangular shape. Real crinkled plastic material, no soap, towels or labels.

#### `orange-juice.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A plain unlabeled one-liter clear glass carafe filled with fresh orange juice, one small glass of orange juice, one orange half. No water or other drinks.

#### `dish-soap.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One unbranded transparent 500ml dishwashing-liquid bottle filled with pale amber liquid, a simple closed flip cap. No hand-soap pump, no sponge, no towels, no text.

#### `wheat-bread.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One rustic golden wheat bread loaf, with two neat bread slices in front revealing soft pale crumb. Not a baguette, no croissant, no raisin bun.

#### `dark-chocolate.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A dark chocolate bar broken into two pieces with clean segmented squares and one small stack of dark chocolate squares. Deep cocoa brown; no cookies, no packaging.

#### `baguette.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One slender golden French baguette with diagonal scoring, slightly angled diagonally, two small cut slices near its lower end; no croissants or other bread.

#### `wafers.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A small natural stack of pale crisp rectangular cream-filled wafers with visible thin wafer layers, one wafer resting alongside. No chocolate bars, no cookies.

#### `water.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One plain unlabeled transparent one-liter water bottle with a simple light-gray screw cap, and one clear glass of still water. No orange juice, fruit, branding or text.

#### `sparkling-water.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One plain unlabeled transparent one-liter mineral-water bottle with dark-gray screw cap and a small glass of water with believable fine carbonation bubbles. No juice, fruit, labels or text.

#### `sponges.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: Exactly five rectangular kitchen dishwashing sponges arranged in a low natural stack, yellow foam with dark-green abrasive layers. No bottles, no towels, no text.

#### `coffee.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A small blank kraft paper bag of ground coffee, open at the top, with a small mound of fine brown coffee grounds on a simple white saucer in front and a few roasted beans. No drinks, no text or brand.

#### `croissant.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One golden butter croissant with crisp layered pastry and curved crescent shape, three-quarter view. No baguettes, no buns, no filling visible.

#### `lavash.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: Two thin beige lavash flatbreads, one gently folded and one loosely rolled, with small natural toasted spots. No thick round loaves or baguettes.

#### `flatbread.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One traditional Central Asian round golden flatbread with a pressed patterned center and thicker raised rim. Realistic toasted bread surface; no writing or branding.

#### `milk.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One simple unlabeled one-liter clear glass milk bottle with a white cap, filled with milk, beside one small glass of milk. No cheese, yogurt, branding or label.

#### `kefir.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One plain unlabeled one-liter white plastic bottle of kefir with white screw cap beside a small clear glass of thick white kefir. No milk carton, cheese or labels.

#### `butter.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One unwrapped rectangular pale-yellow 180g block of butter on folded plain white parchment, one small thin butter curl alongside. No cheese holes, milk or packaging text.

#### `cheese.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One pale-yellow semi-hard cheese wedge about 200g with a few small natural holes, and two thin slices resting beside it. No milk, butter or other products.

#### `cottage-cheese.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A small plain white bowl containing fresh grainy white cottage cheese, with realistic loose curds, a simple teaspoon beside it. No yogurt smoothie texture, fruit, milk or brands.

#### `sour-cream.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A plain small white 300g cream tub with a partly peeled silver foil lid showing thick smooth white sour cream and a gentle spoon swirl. No fruit, milk, branding or text.

#### `oat-cookies.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A small stack of round golden oat cookies with visible oat flakes and one cookie resting at the front. No chocolate bars, no raisin buns, no packaging.

#### `honey.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A small plain transparent 250g glass jar of golden floral honey with a blank metal lid set beside it and a modest wooden honey dipper. No flowers, no bees, no text or labels.

#### `marmalade.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A modest group of translucent fruit-jelly marmalade sweets in orange, red and pale-yellow colors, some lightly sugar-coated, simple fruit-paste blocks. No chocolate, no packaging.

#### `milk-chocolate.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A creamy milk-chocolate bar with clean segmented squares, partly broken, and two squares beside it. Medium chocolate brown distinct from dark chocolate. No cookies or packaging.

#### `apple-juice.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One unbranded one-liter clear glass carafe filled with clear amber apple juice, one small glass of apple juice, one red apple with a neat half beside it. No orange, no water, no branding.

#### `black-tea.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A plain small white cup of deep amber black tea, with two unbranded paper tea bags neatly placed on a small white saucer. Real tea, simple string, no printed tags, no branding, no juice.

#### `green-tea.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A simple small white cup containing clear pale-green golden green tea, with two plain unbranded tea bags on a small white saucer and a few dry tea leaves. No black-tea dark color, no labels.

#### `liquid-soap.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One simple unlabeled 300ml clear liquid hand-soap bottle with a white pump and pale translucent soap inside. No dishwashing flip cap, no sponge or towels.

#### `napkins.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: A tidy square stack of folded plain white paper napkins with one softly unfolded napkin beside it. Real paper fibers and subtle embossing, no towels on rolls.

#### `paper-towels.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: Exactly two white kitchen paper towel rolls standing side by side, one slightly forward, with a short paper tail resting on the studio surface. No bottles, soap, text or branding.

#### `rye-bread.webp`

Use case: product-mockup. Create ONE standalone square high-resolution 1024x1024 premium grocery e-commerce studio photographic illustration, not a collage. Warm off-white seamless tabletop and background (#f5f5f1), soft diffuse upper-left daylight, believable contact shadows, clear material texture, realistic proportions. Slightly elevated three-quarter camera angle, all objects fully inside frame. Subject group occupies 68-75% of canvas with at least 12% breathing room on every edge; keep main details away from top corners for UI controls. Composition has natural small asymmetry and subtle depth but crisp product detail throughout. No fake brands, logos, readable text, nutrition labels, prices, ribbons, percentage, badges, watermark, Paykar UI, green tint, gradient backgrounds, decorative props or supermarket scenery. Subject: One compact dark-brown rye bread loaf with two slices in front showing dense darker rye crumb. Natural flour-dusted rustic crust. No baguette or white wheat loaf.

## Data protection and existing installations

Only the 40 `image_url` values changed in `db/seed/products.json`; all other seed data is structurally identical to HEAD. Existing seed insertion uses conflict-do-nothing, so reseeding does not replace image references in an existing database. For this local runtime, applied an explicit guarded image-only transaction against the same 40 slugs and previous demo paths. Checked every product column before/after: identical except image_url and the existing automatic updated_at trigger timestamp. No trigger, schema, migration, order/history/template, price, stock, category or connection changes. Fresh installations receive the new paths from the canonical seed. Other existing installations need an equivalent targeted image-reference update; rebuilding web alone does not update database references.

Existing Stores/map and Promotions work was preserved; no staging, commit or push.

## Verification

| Command / check                      | Result                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `npm run format:check`               | PASS                                                                                            |
| `npm run lint`                       | PASS                                                                                            |
| `npm run typecheck`                  | PASS                                                                                            |
| `npm run build`                      | PASS; 22 static pages generated                                                                 |
| `node --test tests/*.test.mjs`       | PASS; 42 tests, no skips (catalog, shopping, navigation, recommendations, hero policy, locator) |
| `git diff --check`                   | PASS                                                                                            |
| Canonical seed structural comparison | PASS; only image URLs changed                                                                   |
| Live API before/after comparison     | PASS; all 40 products identical except image_url                                                |
| All 40 live image URLs               | HTTP 200 with image content type                                                                |

Node test execution reports the existing MODULE_TYPELESS_PACKAGE_JSON warning. No backend code changed; backend behavioral tests were not rerun for this image-library task.

### Actual Docker runtime

Rebuilt and recreated the existing `web` service serving `http://localhost:3000`, with the configured Compose project and its existing external environment file. Build completed successfully; runtime image is `sha256:70b74b440ae1e4471aea64b16c79346a72919f60d32bf5485d07cea4360ae524`. Web, API and PostgreSQL are healthy. Docker stopped between QA sessions; restarted it with `docker desktop start`, confirmed health and completed final checks on the same production runtime. No temporary preview used.

```powershell
docker compose --project-directory 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main' -f 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/docker-compose.yml' -p test_task_paykar_shop --env-file 'D:/Workshop/Paykar/Test_Task_Paykar_Shop/.env' up -d --build --force-recreate --no-deps web
```

### Rendered QA and evidence

Used Playwright Chromium as the fallback because the Browser plugin was unavailable when QA began. Automated DOM/console/image checks and screenshots cover 96 cases: catalog, promotions, homepage and yogurt detail × 390/768/1024/1440 × RU/TJ/EN × dark/light. Each case scrolled the page to load lazy imagery, returned to the top and captured a screenshot. All checks passed: correct document language/theme, no horizontal document overflow, no failed product images, no clipped illustration captions and no console/page errors. No API products were mocked for these checks.

Individually reviewed the 16 RU/dark route/width screenshots plus EN/light promotions at 390, TJ/light catalog at 768, TJ/light homepage at 1024 and EN/light detail at 1440. Compared the new desktop imagery with the four pre-change route screenshots. Product-specific forms now replace category composites; neutral backgrounds, image scale and existing hero overlaps remain coherent. Sale tape and favorites stay outside critical product details; no asset positioning exceptions or CSS changes were required.

All screenshots are outside the repository under `C:/Users/ahmad/AppData/Local/Temp/`:

- Before: `imagery-before--promotions.png`, `imagery-before--catalog.png`, `imagery-before--.png`, `imagery-before--product-yogurt.png`.
- After: `imagery-{promotions|catalog|home|yogurt}-{390|768|1024|1440}-{ru|tj|en}-{dark|light}.png` (96 screenshots).
- Review crops: `imagery-review-{route}-{width}.png`; additional language/theme suffixes for the four mixed checks above.
- Stock/fallback: `imagery-kefir-stock-390.png`, `imagery-fallback-390.png`.

Mobile touch emulation and reduced motion: ten interaction assertions passed—keyboard focus, Space toggles a favorite, add to cart, increase, reload persistence, decrease/remove, remove favorite, real out-of-stock kefir image/disabled action, normal-price baguette without sale tape, and failed yogurt image falling back without stage collapse. These ran in an isolated browser context without altering the user's browser storage or creating orders. Only the broken-image case used request interception; its intentional network failure is distinct from real API/asset checks.

### Performance and mismatch ledger

First catalog page's 12 distinct assets total 686.6 KiB; the eight promotions assets total 523.6 KiB. These are complete asset sums, not initial-viewport transfer measurements. Lazy loading and the existing image renderer remain unchanged; browser caching reuses identical product URLs across surfaces. No multi-megabyte PNGs, third-party image requests, dependencies or preload expansion were introduced.

The previous repeated category/produce images summed to 209.1 KiB for that catalog page and 161.2 KiB for promotions. Distinct imagery therefore increases total image transfer for a fully viewed uncached page by approximately 477.5/362.4 KiB respectively. This is a quality/diversity tradeoff, not a claim of unchanged page weight; no network-throttled performance benchmark was run.

| Audit mismatch                              | Result                                       |
| ------------------------------------------- | -------------------------------------------- |
| Raisin bun depicted as baguettes/croissants | Specific raisin bun                          |
| Yogurt depicted as milk/cheese              | Specific plain yogurt cup                    |
| Garbage bags depicted as soap/towels        | Rolled black garbage bags                    |
| Juice/tea/coffee all sharing drinks image   | Separate subjects and vessels                |
| Generated product labeled as category       | Quiet product illustration label in RU/TJ/EN |
| Crop, overlay or overlap regressions        | None observed in reviewed screenshots        |

Remaining limitations: illustrations represent generic products, not manufacturer-certified SKU packshots; packaging may differ. Older stored snapshots can retain legacy category references. Physical devices and browsers other than Chromium are unverified. Screenshots in Temp are local evidence and may be removed by OS cleanup.

## Files changed by this task

- 33 WebP assets listed in the mapping table under `apps/web/public/images/products/generated/`.
- `db/seed/products.json` — image URLs only.
- `apps/web/src/components/product-card.tsx` — shared illustration disclosure; existing resolver/fallback/actions retained.
- `apps/web/src/components/product-detail.tsx` — matching product disclosure.
- `apps/web/src/components/promotions-page.tsx` — hero disclosure only, preserving its pre-existing uncommitted implementation.
- `apps/web/src/lib/translations.json` — one product-illustration entry added, preserving previous translations.
- `docs/progress/catalog-image-upgrade.md` — this audit, prompts, mappings and evidence.

Existing map/Stores changes and Promotions CSS were not edited. No application layout, API contract, schema, dependency, order/cart/template business logic or product business fields changed. Nothing staged, committed or pushed.
