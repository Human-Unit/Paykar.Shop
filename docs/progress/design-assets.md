# Redesign asset provenance

All fourteen assets were created for this independent technical demo using the built-in OpenAI imagegen tool in text-to-image mode, with opaque backgrounds. They are generated photographic-style illustrations, not official Paykar assets or documentation of particular real merchandise. No real brand packaging, person or proprietary logo was requested. No Unsplash or other third-party photograph was downloaded into the application.

Final local files: `apps/web/public/images/paykar/*.webp`. Generation originals were retained in the local Codex generated-images directory outside the repository. Only format conversion and resizing were performed with Pillow: RGB, max 1536×1024 for the hero or 600×600 for other images, WebP quality 82/method 6. No semantic image editing was performed after generation. [Asset manifest](design-final/asset-manifest.json) records final dimensions and byte counts.

## Final generation prompts

### hero.webp

Create a premium photorealistic supermarket advertising photograph, wide landscape 3:2. A full kraft paper grocery bag with glossy red apples, cucumber, tomatoes, bunch of bananas, leafy greens, a baguette and a plain unbranded milk bottle. All groceries are arranged on the RIGHT HALF of the image, warm studio lighting, realistic texture, saturated vivid green background (#00A82D) with darker green soft shadows. LEFT HALF is uncluttered plain green negative space for separately rendered website headline. No text, letters, logos, watermark, people or icons. Crisp commercial food photography, grounded objects, elegant natural composition.

### produce.webp

Square premium studio food photograph of a small arrangement of crisp red apples, one golden apple, a pear and a cucumber on an off-white seamless background. Photorealistic, natural shadows, centered arrangement with margin, recognizable fresh grocery produce, no text, logos, packaging or watermark.

### dairy.webp

Square premium studio grocery photograph of an unbranded white milk bottle, a glass of milk and a small wedge of cheese, centered on an off-white seamless background, natural soft shadows, photorealistic supermarket photography, no readable text, logo or watermark.

### bakery.webp

Square premium studio grocery photograph of a golden baguette and two fresh croissants on an off-white seamless background, centered with margin, warm natural texture, realistic soft shadows, no text, logo or watermark.

### drinks.webp

Square premium studio grocery photograph of a clear unbranded water bottle and a glass of orange juice beside a halved orange on an off-white seamless background, centered arrangement with margin, crisp realistic soft shadows, no text, brand or watermark.

### sweets.webp

Square premium studio grocery photograph of a small stack of chocolate bar pieces and golden oatmeal cookies on an off-white seamless background, centered arrangement with margin, realistic soft shadows, no text, logos or watermark.

### household.webp

Square premium studio household supermarket photograph of a plain white pump soap bottle, a pale green cleaning sponge and a white paper towel roll on an off-white seamless background, centered arrangement with margin, photorealistic soft shadows, no text, logos, label or watermark.

### Individual produce photos

The following exact prompt template was used separately for each subject in the table:

> Square premium photorealistic supermarket product photograph of {subject}. Exactly these foods only, centered isolated on a clean white seamless studio background. Soft natural grounding shadow, crisp realistic food textures, comfortable margins around the whole subject. No text, label, logo, watermark, plate, basket or people. Commercial grocery catalog photography.

| Local file | Subject substituted into the prompt |
| --- | --- |
| apples.webp | three fresh glossy red apples |
| bananas.webp | a small bunch of four ripe yellow bananas |
| oranges.webp | three fresh oranges, one halved to show its juicy interior |
| lemons.webp | two yellow lemons with a half lemon showing the interior |
| carrots.webp | three orange carrots with small fresh green tops |
| potatoes.webp | a small pile of five clean golden potatoes |
| cucumbers.webp | two fresh green cucumbers with a few slices |

Category assets are reused for non-produce demonstration products where exact packaging photographs are unavailable. Only known local demo illustration paths are replaced in the presentation component. The database's image URLs remain unchanged and other supplied URLs pass through normally. The original fallback SVG remains available.
