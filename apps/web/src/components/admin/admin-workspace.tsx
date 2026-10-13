"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { adminApi, AdminError } from "@/lib/admin-api";
import { useAdmin } from "./admin-shell";
import { adminListParameters } from "@/lib/admin-list-state";
import {
  AdminHeader,
  DataTable,
  FilterBar,
  StatusBadge,
  SaveBar,
  FormSection,
  TableLoading,
  EmptyState,
} from "./admin-primitives";
import { AdminDrawer } from "./admin-drawer";
import { ArrowUpRight } from "lucide-react";
import styles from "./admin.module.css";
import {
  money,
  quantity,
  stockUnit,
  measurementLabel,
  dateTime,
  orderStatuses,
} from "@/lib/admin-presentation";
import {
  OverviewView,
  RecordView,
  SettingsView,
  OrderView,
  ProductIdentity,
  ProductState,
  type OverviewData,
  type AdminOrder,
} from "./admin-resource-views";

type Value = string | number | boolean | null;
type RecordData = Record<string, Value>;
type PageData = {
  items: RecordData[];
  total: number;
  page_size: number;
  status_counts?: Record<string, number>;
};
export type WorkspaceKind =
  | "overview"
  | "products"
  | "categories"
  | "promotions"
  | "orders"
  | "stores"
  | "inventory"
  | "administrators"
  | "settings";
type Field = {
  key: string;
  label: string;
  type?: "number" | "checkbox" | "password" | "textarea" | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  options?: string[];
};
const productFields: Field[] = [
  { key: "name", label: "Name", required: true },
  { key: "slug", label: "URL slug", required: true },
  { key: "sku", label: "SKU", required: true },
  { key: "category_id", label: "Category", type: "select", required: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "unit", label: "Unit", required: true },
  {
    key: "measurement_mode",
    label: "Sale mode",
    type: "select",
    options: ["PIECE", "WEIGHT", "DUAL"],
    required: true,
  },
  {
    key: "price_unit",
    label: "Price unit (from sale mode)",
    type: "select",
    options: ["PIECE", "KG"],
    required: true,
  },
  {
    key: "average_piece_weight_g",
    label: "Average piece weight (g) — used only to estimate piece orders",
    type: "number",
    min: 1,
    max: 100000,
    step: "1",
  },
  {
    key: "quantity_step",
    label: "Quantity step (pieces or grams)",
    type: "number",
    min: 1,
    max: 99000,
    step: "1",
    required: true,
  },
  {
    key: "minimum_quantity",
    label: "Minimum quantity (pieces or grams)",
    type: "number",
    min: 1,
    max: 99000,
    step: "1",
    required: true,
  },
  {
    key: "price",
    label: "Current price (TJS)",
    type: "number",
    min: 0,
    step: "0.01",
    required: true,
  },
  {
    key: "old_price",
    label: "Previous price (blank removes discount)",
    type: "number",
    min: 0,
    step: "0.01",
  },
  {
    key: "stock_quantity",
    label: "Stock quantity",
    type: "number",
    min: 0,
    step: "0.001",
    required: true,
  },
  { key: "image_url", label: "Existing product image", type: "select" },
  { key: "is_active", label: "Active", type: "checkbox" },
];
const fields: Partial<Record<WorkspaceKind, Field[]>> = {
  products: productFields,
  promotions: productFields,
  inventory: [
    {
      key: "stock_quantity",
      label: "New stock quantity",
      type: "number",
      min: 0,
      step: "0.001",
      required: true,
    },
  ],
  categories: [
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "URL slug", required: true },
    { key: "parent_id", label: "Parent category (optional)", type: "select" },
  ],
  stores: [
    { key: "name", label: "Name", required: true },
    { key: "address", label: "Address", required: true },
    {
      key: "short_address",
      label: "Map label / short address",
      required: true,
    },
    { key: "city", label: "City", required: true },
    {
      key: "latitude",
      label: "Latitude",
      type: "number",
      min: -90,
      max: 90,
      step: "any",
      required: true,
    },
    {
      key: "longitude",
      label: "Longitude",
      type: "number",
      min: -180,
      max: 180,
      step: "any",
      required: true,
    },
    { key: "is_active", label: "Enabled in directory", type: "checkbox" },
  ],
  administrators: [
    { key: "email", label: "Email", required: true },
    { key: "display_name", label: "Display name", required: true },
    {
      key: "role",
      label: "Role",
      type: "select",
      options: ["ADMIN", "MASTER"],
    },
    { key: "is_active", label: "Active", type: "checkbox" },
    {
      key: "password",
      label: "New password (12+ characters; blank keeps existing)",
      type: "password",
    },
  ],
};
const columns: Partial<Record<WorkspaceKind, [string, string][]>> = {
  products: [
    ["name", "Product"],
    ["price", "Price"],
    ["stock_quantity", "Stock"],
    ["is_active", "Status"],
  ],
  promotions: [
    ["name", "Product"],
    ["price", "Sale price"],
    ["old_price", "Previous price"],
    ["is_active", "Status"],
  ],
  inventory: [
    ["name", "Product"],
    ["stock_quantity", "Available"],
    ["is_active", "Status"],
  ],
  categories: [
    ["name", "Category"],
    ["slug", "URL slug"],
    ["parent_id", "Parent"],
  ],
  orders: [
    ["id", "Order"],
    ["customer_name", "Customer"],
    ["status", "Status"],
    ["item_count", "Items"],
    ["total", "Total"],
    ["created_at", "Created"],
  ],
  stores: [
    ["short_address", "Store"],
    ["address", "Address"],
    ["city", "City"],
    ["is_active", "Status"],
  ],
  administrators: [
    ["display_name", "Administrator"],
    ["role", "Role"],
    ["is_active", "Status"],
    ["last_login_at", "Last sign-in"],
    ["created_at", "Created"],
  ],
};
type FieldGroup = { title: string; keys: string[]; description?: string };
function fieldGroups(kind: WorkspaceKind): FieldGroup[] {
  if (["products", "promotions"].includes(kind))
    return [
      {
        title: "Main information",
        keys: ["name", "sku", "slug", "category_id", "description", "unit"],
      },
      {
        title: "Pricing",
        keys: ["price", "old_price"],
        description:
          "Prices follow the pricing unit. Leave previous price blank to remove the discount.",
      },
      {
        title: "Measurement",
        keys: [
          "measurement_mode",
          "price_unit",
          "average_piece_weight_g",
          "quantity_step",
          "minimum_quantity",
        ],
        description:
          "Weight steps/minimums use grams. Piece estimates require an average weight. Changing mode does not convert price or stock.",
      },
      { title: "Inventory", keys: ["stock_quantity"] },
      { title: "Media", keys: ["image_url"] },
      {
        title: "Status",
        keys: ["is_active"],
        description:
          "Disabling removes the product from the public catalog. Records are retained.",
      },
    ];
  if (kind === "stores")
    return [
      { title: "Location", keys: ["name", "address", "short_address", "city"] },
      { title: "Map position", keys: ["latitude", "longitude"] },
      { title: "Directory status", keys: ["is_active"] },
    ];
  if (kind === "administrators")
    return [
      { title: "Account", keys: ["email", "display_name"] },
      { title: "Access", keys: ["role", "is_active"] },
      {
        title: "Security",
        keys: ["password"],
        description:
          "Leave the password blank to retain the existing password when editing.",
      },
    ];
  if (kind === "inventory")
    return [
      {
        title: "Stock adjustment",
        keys: ["stock_quantity"],
        description:
          "Enter the new absolute stock balance. Concurrent stock changes require reload; no reservations are tracked.",
      },
    ];
  return [{ title: "Category", keys: ["name", "slug", "parent_id"] }];
}
function numeric(key: string) {
  return [
    "price",
    "old_price",
    "stock_quantity",
    "item_count",
    "total",
  ].includes(key);
}
function display(value: Value | undefined) {
  return value === null || value === undefined
    ? "—"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : String(value);
}

function newProduct(): RecordData {
  return {
    is_active: true,
    role: "ADMIN",
    stock_quantity: "0",
    measurement_mode: "PIECE",
    price_unit: "PIECE",
    average_piece_weight_g: null,
    quantity_step: 1,
    minimum_quantity: 1,
    unit: "шт.",
    price: "0",
  };
}

export function AdminWorkspace({
  kind,
  orderId,
  recordId,
}: {
  kind: WorkspaceKind;
  orderId?: string;
  recordId?: string;
}) {
  const { csrf } = useAdmin();
  const router = useRouter();
  const pathname = usePathname(),
    search = useSearchParams();
  const parameters = adminListParameters(kind, search.toString());
  const page = Number(parameters.get("page"));
  const query = parameters.toString();
  const [editDirty, setEditDirty] = useState(false);
  const fullEditor = ["products", "promotions", "stores"].includes(kind);
  const listState = search.toString();
  function updateList(params: URLSearchParams) {
    setData(null);
    router.replace(
      `${pathname}?${adminListParameters(kind, params.toString())}`,
      { scroll: false },
    );
  }
  function setPage(value: number) {
    const params = new URLSearchParams(listState);
    params.set("page", String(value));
    updateList(params);
  }
  function cancelEdit() {
    if (pending) return;
    if (!editDirty || window.confirm("Discard unsaved record edits?")) {
      setEdit(null);
      setEditDirty(false);
      if (recordId === "new") router.push(`/admin/${kind}`);
    }
  }

  const [response, setData] = useState<
    RecordData[] | RecordData | PageData | null
  >(null);
  const [responsePath, setResponsePath] = useState("");
  const [categories, setCategories] = useState<RecordData[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stockConflict, setStockConflict] = useState(false);
  const [revision, setRevision] = useState(0);
  const [edit, setEdit] = useState<RecordData | null>(
    recordId === "new" ? newProduct() : null,
  );
  const [pending, setPending] = useState(false);
  const paginated = Boolean(columns[kind]) && !orderId && !recordId;
  const endpoint = ["inventory", "promotions"].includes(kind)
    ? "products"
    : kind === "administrators"
      ? "master/administrators"
      : kind;
  const path = `${endpoint}${orderId ? `/${orderId}` : recordId ? (recordId === "new" ? "" : `/${recordId}`) : `?${query}`}`;
  const data = responsePath === path ? response : null;
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [result, options, images] = await Promise.all([
          recordId === "new"
            ? Promise.resolve({})
            : adminApi<RecordData[] | RecordData | PageData>(
                path,
                undefined,
                undefined,
                controller.signal,
              ),
          ["products", "promotions", "inventory", "categories"].includes(kind)
            ? adminApi<RecordData[]>(
                "categories",
                undefined,
                undefined,
                controller.signal,
              )
            : Promise.resolve([]),
          ["products", "promotions"].includes(kind)
            ? adminApi<string[]>(
                "product-assets",
                undefined,
                undefined,
                controller.signal,
              )
            : Promise.resolve([]),
        ]);
        setData(result);
        setResponsePath(path);
        setCategories(options);
        setAssets(images);
        setError("");
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof AdminError && cause.status === 401)
          router.replace("/admin/login");
        else
          setError(cause instanceof Error ? cause.message : "Request failed");
      }
    };
    void load();
    return () => controller.abort();
  }, [path, kind, revision, router, recordId]);
  useEffect(() => {
    if (!editDirty) return;
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (link && !window.confirm("Discard unsaved record edits?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [editDirty]);
  const heading =
    recordId && recordId !== "new" && data
      ? String(
          (data as RecordData)[kind === "stores" ? "short_address" : "name"],
        )
      : recordId === "new"
        ? "Create product"
        : recordId
          ? `${kind === "stores" ? "Store" : "Product"} details`
          : orderId
            ? "Order details"
            : kind === "administrators"
              ? "Administrators"
              : kind.charAt(0).toUpperCase() + kind.slice(1);
  const list: RecordData[] = Array.isArray(data)
    ? data
    : paginated && data && "items" in data
      ? (data as PageData).items
      : [];
  const total =
    paginated && data ? Number((data as PageData).total) : list.length;
  function refresh() {
    setRevision(revision + 1);
  }
  function reloadFailedResource() {
    if (stockConflict) {
      if (
        editDirty &&
        !window.confirm(
          "Reload current stock and discard unsaved record edits?",
        )
      )
        return;
      setEdit(null);
      setEditDirty(false);
      setStockConflict(false);
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("#admin-main h1")?.focus(),
      );
    }
    setError("");
    setData(null);
    refresh();
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit || pending) return;
    const form = new FormData(event.currentTarget);
    const body: RecordData = {};
    for (const field of fields[kind] || []) {
      if (kind === "administrators" && edit.id && field.key === "email")
        continue;
      if (kind === "administrators" && !edit.id && field.key === "is_active")
        continue;
      const value = form.get(field.key);
      body[field.key] =
        field.type === "checkbox"
          ? value === "on"
          : [
                "category_id",
                "parent_id",
                "latitude",
                "longitude",
                "average_piece_weight_g",
                "quantity_step",
                "minimum_quantity",
              ].includes(field.key)
            ? value
              ? Number(value)
              : null
            : field.key === "old_price" || field.key === "password"
              ? value
                ? String(value)
                : null
              : String(value || "");
    }
    if (["products", "promotions"].includes(kind)) {
      body.price_unit = body.measurement_mode === "PIECE" ? "PIECE" : "KG";
      if (body.measurement_mode !== "DUAL") body.average_piece_weight_g = null;
    }
    if (["products", "promotions", "inventory"].includes(kind) && edit.id)
      body.expected_stock = edit.stock_quantity;
    if (kind === "administrators" && !edit.id && !body.password) {
      setError("A password of at least 12 characters is required");
      return;
    }
    if (
      edit.is_active === true &&
      body.is_active === false &&
      !window.confirm(
        "Disable this record? It will no longer be active. Existing records are retained.",
      )
    )
      return;
    setPending(true);
    setStockConflict(false);
    setError("");
    setNotice("");
    try {
      const result = await adminApi<RecordData>(
        `${kind === "inventory" ? "inventory" : endpoint}${edit.id ? `/${edit.id}` : ""}`,
        csrf,
        body,
      );
      setEdit(null);
      setEditDirty(false);
      setNotice("Saved successfully.");
      if (recordId === "new" && result.id)
        router.replace(`/admin/${kind}/${result.id}`);
      refresh();
    } catch (cause) {
      if (
        cause instanceof AdminError &&
        cause.status === 409 &&
        cause.message.startsWith("Stock changed") &&
        ["products", "promotions", "inventory"].includes(kind)
      )
        setStockConflict(true);
      if (cause instanceof AdminError && cause.status === 401)
        router.replace("/admin/login");
      else setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setPending(false);
    }
  }
  function renderField(field: Field) {
    const current = edit;
    if (!current) return null;
    return (
      <label
        key={`${current.id || "new"}-${field.key}-${["price_unit", "quantity_step", "minimum_quantity"].includes(field.key) ? current.measurement_mode : ""}`}
      >
        {field.label}
        {field.type === "select" ? (
          <select
            name={field.key}
            aria-label={field.label}
            defaultValue={String(edit[field.key] || "")}
            required={field.required}
            disabled={field.key === "price_unit"}
            onChange={
              field.key === "measurement_mode"
                ? (event) =>
                    setEdit({
                      ...current,
                      measurement_mode: event.target.value,
                      price_unit:
                        event.target.value === "PIECE" ? "PIECE" : "KG",
                      quantity_step: event.target.value === "PIECE" ? 1 : 100,
                      minimum_quantity:
                        event.target.value === "PIECE" ? 1 : 100,
                      average_piece_weight_g: null,
                    })
                : undefined
            }
          >
            {field.key === "image_url" ? (
              <>
                <option value="">Fallback image</option>
                {assets.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset.split("/").at(-1)}
                  </option>
                ))}
              </>
            ) : (
              <>
                {!field.options && <option value="">Select category</option>}
                {field.options
                  ? field.options.map((value) => (
                      <option key={value} value={value}>
                        {field.key === "measurement_mode"
                          ? measurementLabel(value)
                          : field.key === "price_unit"
                            ? value === "KG"
                              ? "Kilogram"
                              : "Piece"
                            : value}
                      </option>
                    ))
                  : categories
                      .filter(
                        (c) => c.id !== current.id || field.key !== "parent_id",
                      )
                      .map((c) => (
                        <option key={Number(c.id)} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
              </>
            )}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            name={field.key}
            aria-label={field.label}
            defaultValue={String(edit[field.key] || "")}
            maxLength={10000}
          />
        ) : (
          <input
            name={field.key}
            aria-label={field.label}
            type={field.type || (field.key === "email" ? "email" : "text")}
            defaultValue={
              field.type === "checkbox"
                ? undefined
                : String(edit[field.key] ?? "")
            }
            defaultChecked={
              field.type === "checkbox" ? !!edit[field.key] : undefined
            }
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            minLength={field.type === "password" ? 12 : undefined}
            maxLength={field.key === "image_url" ? 300 : 256}
            autoComplete={field.type === "password" ? "new-password" : "off"}
          />
        )}
      </label>
    );
  }
  function changeView(key: string, value: string) {
    const next = new URLSearchParams(listState);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "view") next.delete("stock");
    next.set("page", "1");
    updateList(next);
  }
  function resourceTabs() {
    if (kind === "orders") {
      const counts = (data as PageData | null)?.status_counts;
      return (
        <nav className={styles.tabs} aria-label="Order status views">
          {[["", "All"], ...Object.entries(orderStatuses)].map(
            ([value, label]) => (
              <button
                type="button"
                key={value}
                aria-current={
                  (parameters.get("status") || "") === value
                    ? "page"
                    : undefined
                }
                onClick={() => changeView("status", value)}
              >
                {label}
                {counts && (
                  <small>
                    {value
                      ? counts[value] || 0
                      : Object.values(counts).reduce((a, b) => a + b, 0)}
                  </small>
                )}
              </button>
            ),
          )}
        </nav>
      );
    }
    if (kind === "inventory")
      return (
        <nav className={styles.tabs} aria-label="Inventory views">
          {[
            ["all", "All"],
            ["low", "Low stock"],
            ["empty", "Out of stock"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-current={
                (parameters.get("stock") || "all") === value
                  ? "page"
                  : undefined
              }
              onClick={() => changeView("stock", value)}
            >
              {label}
            </button>
          ))}
        </nav>
      );
    if (["products", "promotions"].includes(kind))
      return (
        <nav className={styles.tabs} aria-label="Product views">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["problems", "Problems"],
            ["empty", "Out of stock"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-current={
                (parameters.get("view") || "all") === value ? "page" : undefined
              }
              onClick={() => changeView("view", value)}
            >
              {label}
            </button>
          ))}
        </nav>
      );
    return null;
  }
  function cell(item: RecordData, key: string) {
    if (
      key === "name" &&
      ["products", "promotions", "inventory"].includes(kind)
    )
      return (
        <ProductIdentity
          record={item}
          href={`/admin/${kind === "inventory" ? "products" : kind}/${item.id}`}
        />
      );
    if (key === "is_active")
      return ["products", "promotions", "inventory"].includes(kind) ? (
        <ProductState record={item} />
      ) : (
        <StatusBadge status={item[key] ? "Active" : "Disabled"} />
      );
    if (key === "status" || key === "role")
      return <StatusBadge status={display(item[key])} />;
    if (key === "price" || key === "old_price")
      return (
        <div>
          {money(item[key])}
          {item[key] != null && (
            <span className={styles.metadata}>/ {stockUnit(item)}</span>
          )}
        </div>
      );
    if (key === "stock_quantity") return quantity(item[key], item);
    if (key === "total") return money(item[key]);
    if (key === "created_at" || key === "last_login_at")
      return item[key] ? dateTime(item[key]) : "Never signed in";
    if (kind === "orders" && key === "id")
      return (
        <Link
          className={styles.primaryColumn}
          title={String(item.id)}
          href={`/admin/orders/${item.id}`}
        >
          #{String(item.id).slice(0, 8)}
          <span className={styles.metadata}>{dateTime(item.created_at)}</span>
        </Link>
      );
    if (key === "customer_name")
      return (
        <div>
          <strong>{item.customer_name}</strong>
          <span className={styles.metadata}>{item.phone}</span>
        </div>
      );
    if (key === "display_name")
      return (
        <div>
          <strong>{item.display_name}</strong>
          <span className={styles.metadata}>{item.email}</span>
        </div>
      );
    if (key === "short_address")
      return (
        <Link
          className={styles.primaryColumn}
          href={`/admin/stores/${item.id}`}
        >
          {item.short_address}
          <span className={styles.metadata}>{item.name}</span>
        </Link>
      );
    if (key === "parent_id")
      return item[key]
        ? categories.find((category) => category.id === item[key])?.name ||
            display(item[key])
        : "Top-level";
    return display(item[key]);
  }
  return (
    <>
      <AdminHeader title={heading} eyebrow="">
        {!recordId &&
          ["products", "categories", "administrators"].includes(kind) && (
            <div className={styles.actions}>
              {kind === "products" ? (
                <Link className={styles.createLink} href="/admin/products/new">
                  Add product
                </Link>
              ) : (
                <button
                  className={styles.primary}
                  onClick={() => {
                    setEdit({ is_active: true, role: "ADMIN" });
                    setEditDirty(false);
                  }}
                >
                  Create {kind === "categories" ? "category" : "administrator"}
                </button>
              )}
            </div>
          )}
      </AdminHeader>
      {recordId && <Link href={`/admin/${kind}`}>← Back to {kind}</Link>}
      {kind === "stores" && (
        <p>
          Directory locations only. Checkout origin is independently
          environment-managed in Settings.
        </p>
      )}
      {kind === "orders" && (
        <p>
          Read-only order snapshots. No new status transitions are introduced.
        </p>
      )}
      {kind === "promotions" && (
        <p>
          Discounts use each product’s current and previous price. Clear the
          previous price to remove a promotion.
        </p>
      )}
      {error && !edit && (
        <div className={styles.message} role="alert">
          {error} <button onClick={reloadFailedResource}>Reload</button>
        </div>
      )}
      {notice && (
        <p className={styles.message} role="status">
          {notice}
        </p>
      )}
      {!data && !error && !paginated && <TableLoading />}
      {kind === "overview" && data && (
        <OverviewView data={data as unknown as OverviewData} />
      )}
      {kind === "settings" && data && (
        <SettingsView record={data as RecordData} />
      )}
      {orderId && data && <OrderView record={data as unknown as AdminOrder} />}
      {recordId && recordId !== "new" && !edit && data && (
        <RecordView
          record={data as RecordData}
          categoryName={String(
            categories.find(
              (category) => category.id === (data as RecordData).category_id,
            )?.name || "",
          )}
          kind={kind}
          edit={() => {
            setEdit(data as RecordData);
            setEditDirty(false);
          }}
        />
      )}
      {paginated && (
        <FilterBar
          compact={!["products", "promotions", "inventory"].includes(kind)}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget),
              params = new URLSearchParams();
            for (const [key, value] of form.entries())
              if (value) params.set(key, String(value));
            params.set("page", "1");
            updateList(params);
          }}
        >
          <div key={`${kind}:${query}`} className={styles.filterFields}>
            <label className={styles.searchField}>
              <span className="sr-only">
                {kind === "orders"
                  ? "Search order reference"
                  : ["products", "promotions", "inventory"].includes(kind)
                    ? "Search by name or SKU"
                    : "Search records"}
              </span>
              <input
                name="q"
                type="search"
                placeholder={
                  kind === "orders"
                    ? "Search order reference"
                    : ["products", "promotions", "inventory"].includes(kind)
                      ? "Search by name or SKU"
                      : "Search records"
                }
                maxLength={100}
                defaultValue={parameters.get("q") || ""}
              />
            </label>
            {resourceTabs()}
            <input
              type="hidden"
              name="view"
              value={parameters.get("view") || "all"}
            />
            {kind === "orders" ? (
              <input
                type="hidden"
                name="status"
                value={parameters.get("status") || ""}
              />
            ) : ["products", "promotions", "inventory"].includes(kind) ? (
              <>
                <label>
                  Category
                  <select
                    name="category_id"
                    aria-label="Category"
                    defaultValue={parameters.get("category_id") || ""}
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={Number(c.id)} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Measurement
                  <select
                    name="measurement"
                    aria-label="Measurement"
                    defaultValue={parameters.get("measurement") || "all"}
                  >
                    <option value="all">All sale modes</option>
                    {["PIECE", "WEIGHT", "DUAL"].map((value) => (
                      <option value={value} key={value}>
                        {measurementLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Stock
                  <select
                    name="stock"
                    aria-label="Stock"
                    defaultValue={parameters.get("stock") || "all"}
                  >
                    <option value="all">All stock</option>
                    <option value="available">Available</option>
                    <option value="empty">Out of stock</option>
                    <option value="low">Low stock</option>
                  </select>
                </label>
              </>
            ) : null}
            <label>
              Sort
              <select
                name="sort"
                aria-label="Sort"
                defaultValue={parameters.get("sort") || "id"}
              >
                {(kind === "orders"
                  ? [
                      ["-created", "Newest first"],
                      ["created", "Oldest first"],
                      ["total", "Total ↑"],
                      ["-total", "Total ↓"],
                    ]
                  : ["categories", "stores", "administrators"].includes(kind)
                    ? [
                        ["id", "ID"],
                        ["name", "Name"],
                      ]
                    : [
                        ["id", "ID"],
                        ["name", "Name"],
                        ["price", "Price ↑"],
                        ["-price", "Price ↓"],
                        ["stock", "Lowest stock"],
                        ["-updated", "Recently updated"],
                      ]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit">Apply</button>
          <button
            type="button"
            onClick={() => updateList(new URLSearchParams())}
          >
            Clear
          </button>
        </FilterBar>
      )}
      {paginated && !data && !error && (
        <>
          <p className={styles.metadata}>Loading records…</p>
          <TableLoading />
        </>
      )}
      {edit && (
        <EditorSurface
          kind={fullEditor ? "page" : "drawer"}
          pending={pending}
          close={cancelEdit}
        >
          {error && (
            <div className={styles.message} role="alert">
              {error}{" "}
              <button onClick={reloadFailedResource} disabled={pending}>
                Reload
              </button>
            </div>
          )}
          {kind === "inventory" && (
            <div className={styles.stockCurrent}>
              <span className={styles.metadata}>Current stock</span>
              <strong>{quantity(edit.stock_quantity, edit)}</strong>
              <span className={styles.metadata}>
                {measurementLabel(edit.measurement_mode)}
              </span>
            </div>
          )}
          <h2>
            {edit.id
              ? `Edit ${display(edit.name || edit.display_name || edit.short_address)}`
              : "Create record"}
          </h2>
          <form
            className={styles.form}
            onSubmit={save}
            onChange={() => setEditDirty(true)}
          >
            {fieldGroups(kind).map((group) => (
              <FormSection
                key={group.title}
                title={group.title}
                description={group.description}
              >
                {(fields[kind] || [])
                  .filter(
                    (field) =>
                      group.keys.includes(field.key) &&
                      (field.key !== "average_piece_weight_g" ||
                        edit.measurement_mode === "DUAL") &&
                      !(
                        kind === "administrators" &&
                        ((!edit.id && field.key === "is_active") ||
                          (edit.id && field.key === "email"))
                      ),
                  )
                  .map(renderField)}
              </FormSection>
            ))}
            <SaveBar>
              <button className={styles.primary} disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </button>
              <button type="button" disabled={pending} onClick={cancelEdit}>
                Cancel
              </button>
            </SaveBar>
          </form>
        </EditorSurface>
      )}
      {columns[kind] && !orderId && !recordId && data && (
        <>
          <p className={styles.metadata}>
            {total}{" "}
            {kind === "promotions"
              ? "discounted products"
              : kind === "administrators"
                ? "administrators"
                : kind}
            {kind === "inventory" && parameters.get("view") === "active"
              ? " · active products only"
              : ""}
          </p>
          {kind === "inventory" && (
            <p className={styles.metadata}>
              Low stock: positive stock sufficient for five minimum purchase
              quantities or fewer. Stock unit is kg or pcs; reservations are not
              tracked.
            </p>
          )}
          <DataTable label={`${heading} table`}>
            <thead>
              <tr>
                {columns[kind]?.map(([key, label]) => (
                  <th
                    scope="col"
                    key={key}
                    data-numeric={numeric(key) || undefined}
                    data-priority={
                      ["created_at", "city"].includes(key) ? "low" : undefined
                    }
                  >
                    {label}
                  </th>
                ))}
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={String(item.id)}>
                  {columns[kind]?.map(([key, label]) => (
                    <td
                      key={key}
                      data-label={label}
                      data-numeric={numeric(key) || undefined}
                      data-priority={
                        ["created_at", "city"].includes(key) ? "low" : undefined
                      }
                    >
                      {cell(item, key)}
                    </td>
                  ))}
                  <td data-label="Action">
                    <div className={styles.rowActions}>
                      {kind === "orders" ? (
                        <Link href={`/admin/orders/${item.id}`}>
                          View order →
                        </Link>
                      ) : fullEditor ? (
                        <Link href={`/admin/${kind}/${item.id}`}>Open →</Link>
                      ) : (
                        <button
                          onClick={() => {
                            setEdit(item);
                            setEditDirty(false);
                            setError("");
                          }}
                        >
                          {kind === "inventory" ? "Adjust stock" : "Edit"}
                        </button>
                      )}
                      {["products", "promotions"].includes(kind) && (
                        <Link
                          href={`/product/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Preview product: ${item.name}`}
                          title="Preview product"
                        >
                          <ArrowUpRight size={16} aria-hidden="true" />
                          <span className="sr-only">Preview</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {list.length === 0 && (
            <EmptyState
              title={
                kind === "promotions"
                  ? "No discounted products match"
                  : "No matching records"
              }
            >
              <p>Adjust your search or clear the filters.</p>
              <button onClick={() => updateList(new URLSearchParams())}>
                Clear filters
              </button>
              {kind === "promotions" && (
                <Link href="/admin/products">Manage product prices →</Link>
              )}
            </EmptyState>
          )}
          {paginated && total > 25 && (
            <div className={styles.tableFooter}>
              <span>
                Page {page} of {Math.ceil(total / 25)}
              </span>
              <div className={styles.actions}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                <button
                  disabled={page * 25 >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function EditorSurface({
  children,
  kind,
  close,
  pending,
}: {
  children: React.ReactNode;
  kind: "page" | "drawer";
  close: () => void;
  pending: boolean;
}) {
  return kind === "drawer" ? (
    <AdminDrawer close={close} pending={pending} label="Quick record edit">
      {children}
    </AdminDrawer>
  ) : (
    <section className={styles.panel} aria-label="Record editor">
      {children}
    </section>
  );
}
