"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import type { Order, OrderItem } from "@/lib/api";
import { orderQuantity } from "@/lib/measurement";
import {
  dateTime,
  measurementLabel,
  money,
  productProblems,
  quantity,
  stockUnit,
  type AdminRecord,
} from "@/lib/admin-presentation";
import {
  AdminSection,
  DataTable,
  EmptyState,
  StatusBadge,
} from "./admin-primitives";
import styles from "./admin.module.css";

export function ProductIdentity({
  record,
  href,
}: {
  record: AdminRecord;
  href?: string;
}) {
  return (
    <div className={styles.productIdentity}>
      {record.image_url ? (
        <Image
          src={String(record.image_url)}
          width={40}
          height={40}
          alt=""
          unoptimized
        />
      ) : (
        <span className={styles.imageFallback}>
          <Package size={18} aria-hidden="true" />
        </span>
      )}
      <div>
        {href ? (
          <Link href={href}>{record.name}</Link>
        ) : (
          <strong>{record.name}</strong>
        )}
        <span className={styles.metadata}>
          {record.sku} · {measurementLabel(record.measurement_mode)}
          {record.measurement_mode === "DUAL" && record.average_piece_weight_g
            ? ` · ${record.average_piece_weight_g} g avg`
            : ""}
        </span>
      </div>
    </div>
  );
}
export function ProductState({ record }: { record: AdminRecord }) {
  const problems = productProblems(record);
  return (
    <div className={styles.badges}>
      {(problems.length ? problems : ["Active"]).map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  );
}
function Facts({ values }: { values: [string, React.ReactNode][] }) {
  return (
    <dl className={styles.facts}>
      {values.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
export type OverviewData = {
  products: number;
  active_products: number;
  out_of_stock: number;
  promotions: number;
  stores: number;
  attention: Record<string, number>;
  order_status_counts: Record<string, number>;
  today: {
    date: string;
    timezone: string;
    orders: number;
    order_value: string;
    average_order_value: string | null;
  };
  latest_orders: {
    id: string;
    status: string;
    total: number;
    created_at: string;
  }[];
};
export function OverviewView({ data }: { data: OverviewData }) {
  const work: [string, number, string][] = [
    [
      "New orders",
      data.order_status_counts.pending || 0,
      "/admin/orders?status=pending",
    ],
    [
      "Confirmed orders",
      data.order_status_counts.confirmed || 0,
      "/admin/orders?status=confirmed",
    ],
    [
      "Products low in stock",
      data.attention.low_stock || 0,
      "/admin/inventory?stock=low&view=active",
    ],
    [
      "Products out of stock",
      data.out_of_stock,
      "/admin/inventory?stock=empty&view=active",
    ],
    [
      "Products missing images",
      data.attention.missing_image || 0,
      "/admin/products?view=problems",
    ],
    [
      "Invalid measurement configurations",
      data.attention.invalid_measurement || 0,
      "/admin/products?view=problems",
    ],
  ];
  return (
    <>
      <AdminSection
        title="Requires attention"
        description="Open an item to review the relevant records."
      >
        {work.some(([, count]) => count > 0) ? (
          <div className={styles.attentionList}>
            {work
              .filter(([, count]) => count > 0)
              .map(([label, count, href]) => (
                <Link href={href} key={label}>
                  <strong>{count}</strong>
                  <span>{label}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
          </div>
        ) : (
          <EmptyState title="Nothing needs attention">
            No new orders or active product issues.
          </EmptyState>
        )}
      </AdminSection>
      <AdminSection
        title="Today"
        description={`${data.today.date} · ${data.today.timezone} · Non-cancelled orders; value is not paid revenue.`}
      >
        <div className={styles.metrics}>
          {[
            ["Orders", String(data.today.orders)],
            ["Order value", money(data.today.order_value)],
            ["Average order value", money(data.today.average_order_value)],
          ].map(([label, value]) => (
            <div className={styles.panel} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </AdminSection>
      <AdminSection title="Latest orders">
        {data.latest_orders.length ? (
          <DataTable label="Latest orders">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Status</th>
                <th scope="col" data-numeric>
                  Total
                </th>
                <th scope="col">Created</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.latest_orders.map((item) => (
                <tr key={item.id}>
                  <td data-label="Order">
                    <Link
                      className={styles.primaryColumn}
                      href={`/admin/orders/${item.id}`}
                      title={item.id}
                    >
                      #{item.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={item.status} />
                  </td>
                  <td data-label="Total" data-numeric>
                    {money(item.total)}
                  </td>
                  <td data-label="Created">{dateTime(item.created_at)}</td>
                  <td data-label="Action">
                    <Link href={`/admin/orders/${item.id}`}>Open order →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState title="No orders yet">
            Orders will appear here after a guest checkout.
          </EmptyState>
        )}
        <div className={styles.tableFooter}>
          <span>
            {data.active_products} active products · {data.promotions} discounts
            · {data.stores} stores
          </span>
          <Link href="/admin/orders">All orders →</Link>
        </div>
      </AdminSection>
    </>
  );
}
export function RecordView({
  record,
  kind,
  edit,
  categoryName,
}: {
  record: AdminRecord;
  kind: string;
  edit: () => void;
  categoryName?: string;
}) {
  const product = kind !== "stores";
  return (
    <div className={styles.recordSections}>
      <div className={styles.recordHeader}>
        {product && record.image_url && (
          <Image
            src={String(record.image_url)}
            width={100}
            height={100}
            alt={String(record.name)}
            unoptimized
          />
        )}
        <div>
          <h2>
            {product ? measurementLabel(record.measurement_mode) : record.name}
          </h2>
          <span className={styles.metadata}>
            {product ? record.sku : record.name}
          </span>
          {product ? (
            <ProductState record={record} />
          ) : (
            <StatusBadge status={record.is_active ? "Active" : "Disabled"} />
          )}
        </div>
        <button className={styles.primary} onClick={edit}>
          Edit record
        </button>
      </div>
      {product ? (
        <>
          <AdminSection title="Main information">
            <Facts
              values={[
                ["Name", record.name],
                ["URL slug", record.slug],
                ["SKU", record.sku],
                ["Category", categoryName || `#${record.category_id}`],
                ["Package / display unit", record.unit],
                ["Description", record.description || "—"],
              ]}
            />
          </AdminSection>
          <AdminSection title="Pricing">
            <Facts
              values={[
                [
                  "Current price",
                  `${money(record.price)} / ${stockUnit(record)}`,
                ],
                [
                  "Previous price",
                  record.old_price ? money(record.old_price) : "No discount",
                ],
              ]}
            />
          </AdminSection>
          <AdminSection title="Measurement">
            <Facts
              values={[
                ["Sale mode", measurementLabel(record.measurement_mode)],
                ["Pricing unit", stockUnit(record)],
                [
                  "Minimum quantity",
                  `${record.minimum_quantity} ${record.price_unit === "KG" ? "g" : "pcs"}`,
                ],
                [
                  "Quantity step",
                  `${record.quantity_step} ${record.price_unit === "KG" ? "g" : "pcs"}`,
                ],
                ...(record.measurement_mode === "DUAL"
                  ? [
                      [
                        "Average piece weight",
                        `${record.average_piece_weight_g} g`,
                      ] as [string, React.ReactNode],
                    ]
                  : []),
              ]}
            />
          </AdminSection>
          <AdminSection title="Inventory">
            <Facts
              values={[
                ["Available stock", quantity(record.stock_quantity, record)],
                ["Updated", dateTime(record.updated_at)],
              ]}
            />
          </AdminSection>
          <AdminSection title="Media">
            <Facts
              values={[["Approved image", record.image_url || "Missing image"]]}
            />
          </AdminSection>
        </>
      ) : (
        <>
          <AdminSection title="Location">
            <Facts
              values={[
                ["Address", record.address],
                ["City", record.city],
                ["Latitude", record.latitude],
                ["Longitude", record.longitude],
              ]}
            />
          </AdminSection>
          <AdminSection title="Directory status">
            <Facts values={[["Enabled", record.is_active ? "Yes" : "No"]]} />
          </AdminSection>
        </>
      )}
    </div>
  );
}
export function SettingsView({ record }: { record: AdminRecord }) {
  return (
    <div className={styles.recordSections}>
      <AdminSection title="General">
        <Facts values={[["Store address", record.store_address]]} />
      </AdminSection>
      <AdminSection
        title="Delivery"
        description="Directory edits do not change the environment-managed checkout origin."
      >
        <Facts
          values={[
            ["Origin latitude", record.store_lat],
            ["Origin longitude", record.store_lon],
            ["Flat delivery price", money(record.delivery_flat_price)],
          ]}
        />
      </AdminSection>
      <AdminSection title="System">
        <Facts
          values={[["Administrative session", `${record.session_hours} hours`]]}
        />
      </AdminSection>
    </div>
  );
}
export type AdminOrder = Order & {
  phone?: string;
  comment?: string | null;
  items: OrderItem[];
};
export function OrderView({ record }: { record: AdminOrder }) {
  const estimated = record.items.some((item) => item.is_estimated);
  return (
    <div className={styles.orderLayout}>
      <div>
        <AdminSection title="Order items">
          <DataTable label="Order snapshot items">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Requested</th>
                <th scope="col" data-numeric>
                  Price
                </th>
                <th scope="col" data-numeric>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item, i) => (
                <tr key={i}>
                  <td data-label="Product">
                    <strong>{item.product_name}</strong>
                    {item.price_unit_snapshot === "KG" && (
                      <span className={styles.metadata}>
                        Packed weight:{" "}
                        {item.actual_weight_g == null
                          ? "Not recorded"
                          : `${item.actual_weight_g / 1000} kg`}
                      </span>
                    )}
                  </td>
                  <td data-label="Requested">
                    {orderQuantity(item, (label) =>
                      label === "кг" ? "kg" : "pcs",
                    )}
                  </td>
                  <td data-label="Price" data-numeric>
                    {money(item.unit_price)} /{" "}
                    {item.price_unit_snapshot === "KG" ? "kg" : "pcs"}
                  </td>
                  <td data-label="Total" data-numeric>
                    {item.is_estimated ? "≈ " : ""}
                    {money(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </AdminSection>
        <AdminSection title="Delivery details">
          <Facts
            values={[
              ["Address", record.address],
              [
                "Distance",
                record.distance_meters == null
                  ? "—"
                  : `${(record.distance_meters / 1000).toFixed(2)} km`,
              ],
              [
                "Route estimate",
                record.delivery_duration_seconds == null
                  ? "—"
                  : `${Math.ceil(record.delivery_duration_seconds / 60)} min`,
              ],
              ["Notes", record.comment || "—"],
            ]}
          />
        </AdminSection>
      </div>
      <aside
        className={`${styles.panel} ${styles.orderSummary}`}
        aria-label="Order summary"
      >
        <StatusBadge status={record.status} />
        <p className={styles.orderReference}>{record.id}</p>
        <Facts
          values={[
            ["Customer", record.customer_name],
            ["Phone", record.phone],
            ["Created", dateTime(record.created_at)],
            [
              "Payment",
              record.payment_method === "card"
                ? "Sandbox card"
                : "Cash on delivery",
            ],
            [
              "Payment status",
              record.payment_status === "paid" ? "Paid" : "Due on delivery",
            ],
            ["Subtotal", money(record.subtotal)],
            ["Delivery", money(record.delivery_price)],
          ]}
        />
        <div className={styles.orderTotal}>
          <span>{estimated ? "Estimated total" : "Total"}</span>
          <strong>
            {estimated ? "≈ " : ""}
            {money(record.total)}
          </strong>
        </div>
        <small className={styles.metadata}>
          Read-only snapshot. Order status and packed weight are not edited
          here.
        </small>
      </aside>
    </div>
  );
}
