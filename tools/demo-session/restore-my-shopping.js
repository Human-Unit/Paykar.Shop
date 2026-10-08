// Restores the two My Shopping keys to their values before the first demo seed.
(() => {
  "use strict";
  if (location.origin !== "http://localhost:3000") {
    throw new Error(
      "Open http://localhost:3000/my-shopping before running this script.",
    );
  }
  const backupKey = "paykar-my-shopping-demo-backup-v1";
  const raw = localStorage.getItem(backupKey);
  if (raw === null)
    throw new Error("No Paykar demo backup exists in this browser profile.");
  const backup = JSON.parse(raw);
  if (
    backup.version !== 1 ||
    ![backup.templates, backup.history].every(
      (v) => v === null || typeof v === "string",
    )
  ) {
    throw new Error("Unexpected backup format; nothing was changed.");
  }
  for (const [key, value] of [
    ["paykar-shopping-templates-v1", backup.templates],
    ["paykar-order-history-v1", backup.history],
  ]) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
  localStorage.removeItem(backupKey);
  window.dispatchEvent(new Event("paykar-shopping-change"));
  console.info("Original My Shopping data restored. Cart unchanged.");
})();
