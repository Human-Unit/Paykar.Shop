// Run in DevTools Console on http://localhost:3000/my-shopping.
// Browser-only demo setup: no orders are created and the cart is not changed.
(async () => {
  "use strict";
  if (location.origin !== "http://localhost:3000") {
    throw new Error(
      "Open http://localhost:3000/my-shopping before running this script.",
    );
  }
  const templatesKey = "paykar-shopping-templates-v1";
  const historyKey = "paykar-order-history-v1";
  const backupKey = "paykar-my-shopping-demo-backup-v1";
  const previous = {
    templates: localStorage.getItem(templatesKey),
    history: localStorage.getItem(historyKey),
  };
  const stored =
    previous.templates === null
      ? { version: 1, templates: [] }
      : JSON.parse(previous.templates);
  const history = previous.history === null ? [] : JSON.parse(previous.history);
  if (
    stored.version !== 1 ||
    !Array.isArray(stored.templates) ||
    !Array.isArray(history)
  ) {
    throw new Error(
      "Existing shopping data has an unexpected format; nothing was changed.",
    );
  }
  const get = async (path) => {
    const response = await fetch(`http://localhost:8080/api/v1${path}`);
    if (!response.ok)
      throw new Error(
        `Demo setup stopped: ${path} returned ${response.status}.`,
      );
    return response.json();
  };
  const orderIds = [
    "2f9c7fcb-0745-4bf2-88b7-4a2c2333d7b3",
    "83643cfb-d126-4451-afec-777803c2f88b",
    "4570e344-dced-4335-9e07-a506f9d83535",
    "3cdace29-6d79-4e5e-9633-8b168be0a031",
    "844a573d-50a5-45e0-abb7-0d288582dcd0",
  ];
  const [catalog] = await Promise.all([
    get("/products?page_size=48"),
    ...orderIds.map(async (id) => {
      const order = await get(`/orders/${id}`);
      if (order.id !== id)
        throw new Error("Unexpected order response; nothing was changed.");
    }),
  ]);
  const products = new Map(
    catalog.items
      .filter((p) => p.is_active && Number(p.stock_quantity) >= 1)
      .map((p) => [p.id, p]),
  );
  const sets = [
    { name: "Демо · Семейная корзина", ids: [15, 8, 6, 1, 26, 37] },
    { name: "Демо · Завтрак", ids: [15, 13, 14, 8, 28] },
    { name: "Демо · Овощи и фрукты", ids: [5, 7, 1, 2, 10, 22] },
    { name: "Демо · Для гостей", ids: [24, 26, 31, 29, 32] },
    { name: "Демо · На неделю", ids: [8, 16, 6, 14, 35, 40] },
  ];
  const now = new Date().toISOString();
  const demos = sets.map((set, index) => {
    const items = set.ids
      .filter((id) => products.has(id))
      .map((id) => ({
        product_id: id,
        quantity: 1,
        name: products.get(id).name,
      }));
    if (!items.length)
      throw new Error(
        "A demo set has no available products; nothing was changed.",
      );
    return {
      id: `dea00000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      name: set.name,
      items,
      created_at: now,
      updated_at: now,
    };
  });
  const existingIds = new Set(stored.templates.map((t) => t.id));
  const templates = [
    ...stored.templates,
    ...demos.filter((t) => !existingIds.has(t.id)),
  ];
  const nextHistory = [...new Set([...history, ...orderIds])];
  if (templates.length > 20 || nextHistory.length > 50) {
    throw new Error(
      "Not enough space for demo data without removing existing entries; nothing was changed.",
    );
  }
  const existingBackup = localStorage.getItem(backupKey);
  try {
    if (existingBackup === null) {
      localStorage.setItem(
        backupKey,
        JSON.stringify({ version: 1, ...previous }),
      );
    }
    localStorage.setItem(
      templatesKey,
      JSON.stringify({ version: 1, templates }),
    );
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
  } catch (error) {
    for (const [key, value] of [
      [templatesKey, previous.templates],
      [historyKey, previous.history],
    ]) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    if (existingBackup === null) localStorage.removeItem(backupKey);
    throw error;
  }
  window.dispatchEvent(new Event("paykar-shopping-change"));
  console.info(
    `Paykar demo ready: ${templates.length} templates and ${nextHistory.length} saved orders. Cart unchanged. Original shopping data backed up. Run restore-my-shopping.js to undo.`,
  );
  if (location.pathname !== "/my-shopping") location.assign("/my-shopping");
})().catch((error) => console.error("Paykar demo setup failed:", error));
