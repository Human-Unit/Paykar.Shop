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
} from "./admin-primitives";
import { AdminDrawer } from "./admin-drawer";
import styles from "./admin.module.css";
import type { OrderItem } from "@/lib/api";
import { orderQuantity } from "@/lib/measurement";

type Value = string | number | boolean | null;
type RecordData = Record<string, Value>;
type PageData = { items: RecordData[]; total: number; page_size: number };
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
    ["sku", "SKU"],
    ["price", "Price (TJS)"],
    ["stock_quantity", "Stock"],
    ["is_active", "Active"],
  ],
  promotions: [
    ["name", "Product"],
    ["price", "Sale price"],
    ["old_price", "Previous price"],
    ["is_active", "Active"],
  ],
  inventory: [
    ["name", "Product"],
    ["stock_quantity", "Stock"],
    ["is_active", "Active"],
  ],
  categories: [
    ["name", "Category"],
    ["slug", "URL slug"],
    ["parent_id", "Parent ID"],
  ],
  orders: [
    ["id", "Order UUID"],
    ["status", "Status"],
    ["item_count", "Items"],
    ["total", "Total (TJS)"],
    ["created_at", "Created"],
  ],
  stores: [
    ["short_address", "Location"],
    ["address", "Address"],
    ["latitude", "Latitude"],
    ["longitude", "Longitude"],
    ["is_active", "Enabled"],
  ],
  administrators: [
    ["display_name", "Administrator"],
    ["email", "Email"],
    ["role", "Role"],
    ["is_active", "Active"],
  ],
};
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
    }
  }

  const [data, setData] = useState<RecordData[] | RecordData | PageData | null>(
    null,
  );
  const [categories, setCategories] = useState<RecordData[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    recordId === "new"
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
    setPending(true);
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
      if (cause instanceof AdminError && cause.status === 401)
        router.replace("/admin/login");
      else setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <AdminHeader title={heading}>
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
      {error && (
        <div className={styles.message} role="alert">
          {error} <button onClick={refresh}>Reload</button>
        </div>
      )}
      {notice && (
        <p className={styles.message} role="status">
          {notice}
        </p>
      )}
      {!data && !error && <p role="status">Loading workspace…</p>}
      {kind === "overview" && data && (
        <>
          <div className={styles.metrics}>
            {Object.entries(data).map(([key, value]) => (
              <div className={styles.panel} key={key}>
                <span>{key.replaceAll("_", " ")}</span>
                <strong>{display(value as Value)}</strong>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <Link href="/admin/products">Manage products →</Link>
            <Link href="/admin/orders">View orders →</Link>
            <Link href="/admin/promotions">Edit promotions →</Link>
          </div>
        </>
      )}
      {(kind === "settings" ||
        orderId ||
        (recordId && recordId !== "new" && !edit)) &&
        data && (
          <div className={styles.panel}>
            {recordId && (
              <button
                className={styles.primary}
                onClick={() => {
                  setEdit(data as RecordData);
                  setEditDirty(false);
                }}
              >
                Edit record
              </button>
            )}
            <dl className={styles.detail}>
              {Object.entries(data)
                .filter(([key]) => key !== "items")
                .map(([key, value]) => (
                  <div key={key} style={{ display: "contents" }}>
                    <dt>{key.replaceAll("_", " ")}</dt>
                    <dd>{display(value as Value)}</dd>
                  </div>
                ))}
            </dl>
            {orderId && "items" in data && (
              <ul>
                {(
                  data as unknown as {
                    items: OrderItem[];
                  }
                ).items.map((item, i) => (
                  <li key={i}>
                    {item.product_name} ·{" "}
                    {orderQuantity(item, (label) =>
                      label === "кг" ? "kg" : "pcs",
                    )}{" "}
                    · {item.is_estimated ? "≈ " : ""}
                    {item.total_price} TJS
                    <small>
                      Price: {item.unit_price} TJS /{" "}
                      {item.price_unit_snapshot === "KG" ? "kg" : "pcs"}.{" "}
                      {item.price_unit_snapshot === "KG" && (
                        <>
                          Packed:{" "}
                          {item.actual_weight_g == null
                            ? "Not recorded"
                            : `${item.actual_weight_g} g`}
                          . Estimated: {item.estimated_weight_g} g.
                        </>
                      )}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      {paginated && (
        <FilterBar
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
            <label>
              {kind === "orders"
                ? "Search order reference"
                : ["products", "promotions", "inventory"].includes(kind)
                  ? "Search name / SKU"
                  : "Search records"}
              <input
                name="q"
                type="search"
                maxLength={100}
                defaultValue={parameters.get("q") || ""}
              />
            </label>
            {kind === "orders" ? (
              <label>
                Status
                <select
                  name="status"
                  defaultValue={parameters.get("status") || ""}
                >
                  <option value="">All statuses</option>
                  {[
                    "pending",
                    "confirmed",
                    "delivering",
                    "completed",
                    "cancelled",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            ) : ["products", "promotions", "inventory"].includes(kind) ? (
              <>
                <label>
                  Category
                  <select
                    name="category_id"
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
                  Stock
                  <select
                    name="stock"
                    defaultValue={parameters.get("stock") || "all"}
                  >
                    <option value="all">All stock</option>
                    <option value="available">Available</option>
                    <option value="empty">Out of stock</option>
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
      {edit && (
        <EditorSurface
          kind={fullEditor ? "page" : "drawer"}
          pending={pending}
          close={cancelEdit}
        >
          {["products", "promotions", "inventory"].includes(kind) && (
            <p>
              Price and stock unit:{" "}
              {edit.price_unit === "KG"
                ? "kilograms (stock accepts 0.001 kg)"
                : "pieces"}
              . Weight minimum and step use grams. Review stock and price when
              changing sale mode; values are not automatically converted.
            </p>
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
            {(fields[kind] || [])
              .filter(
                (field) =>
                  (field.key !== "average_piece_weight_g" ||
                    edit.measurement_mode === "DUAL") &&
                  !(
                    kind === "administrators" &&
                    ((!edit.id && field.key === "is_active") ||
                      (edit.id && field.key === "email"))
                  ),
              )
              .map((field) => (
                <label
                  key={`${edit.id || "new"}-${field.key}-${["price_unit", "quantity_step", "minimum_quantity"].includes(field.key) ? edit.measurement_mode : ""}`}
                >
                  {field.label}
                  {field.type === "select" ? (
                    <select
                      name={field.key}
                      defaultValue={String(edit[field.key] || "")}
                      required={field.required}
                      disabled={field.key === "price_unit"}
                      onChange={
                        field.key === "measurement_mode"
                          ? (event) =>
                              setEdit({
                                ...edit,
                                measurement_mode: event.target.value,
                                price_unit:
                                  event.target.value === "PIECE"
                                    ? "PIECE"
                                    : "KG",
                                quantity_step:
                                  event.target.value === "PIECE" ? 1 : 100,
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
                          {!field.options && (
                            <option value="">Select category</option>
                          )}
                          {field.options
                            ? field.options.map((value) => (
                                <option key={value}>{value}</option>
                              ))
                            : categories
                                .filter(
                                  (c) =>
                                    c.id !== edit.id ||
                                    field.key !== "parent_id",
                                )
                                .map((c) => (
                                  <option
                                    key={Number(c.id)}
                                    value={String(c.id)}
                                  >
                                    {c.name}
                                  </option>
                                ))}
                        </>
                      )}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.key}
                      defaultValue={String(edit[field.key] || "")}
                      maxLength={10000}
                    />
                  ) : (
                    <input
                      name={field.key}
                      type={
                        field.type || (field.key === "email" ? "email" : "text")
                      }
                      defaultValue={
                        field.type === "checkbox"
                          ? undefined
                          : String(edit[field.key] ?? "")
                      }
                      defaultChecked={
                        field.type === "checkbox"
                          ? !!edit[field.key]
                          : undefined
                      }
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      minLength={field.type === "password" ? 12 : undefined}
                      maxLength={field.key === "image_url" ? 300 : 256}
                      autoComplete={
                        field.type === "password" ? "new-password" : "off"
                      }
                    />
                  )}
                </label>
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
          <p>{total} records</p>
          <DataTable label={`${heading} table`}>
            <thead>
              <tr>
                {columns[kind]?.map(([key, label]) => (
                  <th scope="col" key={key}>
                    {label}
                  </th>
                ))}
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={String(item.id)}>
                  {columns[kind]?.map(([key]) => (
                    <td key={key}>
                      {key === "status" ||
                      key === "is_active" ||
                      key === "role" ? (
                        <StatusBadge
                          status={
                            key === "is_active"
                              ? item[key]
                                ? "Active"
                                : "Disabled"
                              : display(item[key])
                          }
                        />
                      ) : key === columns[kind]?.[0]?.[0] && fullEditor ? (
                        <Link href={`/admin/${kind}/${item.id}`}>
                          {display(item[key])}
                        </Link>
                      ) : (
                        display(item[key])
                      )}
                    </td>
                  ))}
                  <td>
                    {kind === "orders" ? (
                      <Link href={`/admin/orders/${item.id}`}>
                        View order →
                      </Link>
                    ) : fullEditor ? (
                      <Link href={`/admin/${kind}/${item.id}`}>
                        View details →
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setEdit(item);
                          setEditDirty(false);
                          setError("");
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {["products", "promotions"].includes(kind) && (
                      <Link
                        style={{ display: "block", marginTop: 8 }}
                        href={`/product/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview ↗
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {list.length === 0 && (
            <p>
              No matching records.{" "}
              {query
                ? "Clear filters or adjust your search."
                : "Create a record where available."}
            </p>
          )}
          {paginated && total > 25 && (
            <div className={styles.actions}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={page * 25 >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
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
