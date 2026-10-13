"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { adminApi } from "@/lib/admin-api";
import { api, type Product, type ProductPage } from "@/lib/api";
import translations from "@/lib/translations.json";
import {
  defaultDesign,
  designEntries,
  designVariables,
  setDesignToken,
  resetDesignScope,
  validDesign,
  type DesignConfig,
} from "@/lib/design-config";
import { DesignControls } from "./design-controls";
import { AdminHeader, StatusBadge, SaveBar } from "./admin-primitives";
import { useAdmin } from "./admin-shell";
import styles from "./admin.module.css";

type Version = {
  id: number;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  config: DesignConfig;
  author: string;
  created_at: string;
  published_at: string | null;
};
type Audit = { id: number; action: string; target: string; created_at: string };

export function DesignConsole() {
  const { csrf } = useAdmin();
  const [config, setConfig] = useState<DesignConfig>(defaultDesign);
  const [saved, setSaved] = useState(JSON.stringify(defaultDesign));
  const [savedId, setSavedId] = useState<number | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [audit, setAudit] = useState<Audit[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reload, setReload] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [locale, setLocale] = useState<"ru" | "tj" | "en">("ru");
  const [viewport, setViewport] = useState("desktop");
  const dirty = JSON.stringify(config) !== saved;
  useEffect(() => {
    const controller = new AbortController();
    adminApi<Version[]>(
      "master/design",
      undefined,
      undefined,
      controller.signal,
    )
      .then((values) => {
        setVersions(values);
        const publication = values.find((v) => v.status === "PUBLISHED");
        const current =
          values.find(
            (v) =>
              v.status === "DRAFT" && v.version > (publication?.version || 0),
          ) || publication;
        const initial = current?.config || defaultDesign;
        if (validDesign(initial)) {
          setConfig(initial);
          setSaved(JSON.stringify(initial));
          setSavedId(current?.status === "DRAFT" ? current.id : null);
        }
        setLoaded(true);
        setError("");
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load design history",
          );
      });
    api<ProductPage>("/products?on_sale=true&page_size=1", controller.signal)
      .then((value) => setProduct(value.items[0] || null))
      .catch(() => {
        /* Preview clearly identifies catalog unavailability. */
      });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest("a[href]");
      if (link && !window.confirm("Discard unsaved design edits?")) {
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
  }, [dirty]);
  async function perform(action: "save" | "publish" | "restore", id?: number) {
    if (pending || !validDesign(config)) return;
    if (
      action === "publish" &&
      (!savedId ||
        dirty ||
        !window.confirm("Publish this saved draft to the public storefront?"))
    )
      return;
    if (
      action === "restore" &&
      dirty &&
      !window.confirm("Replace unsaved edits with this historical version?")
    )
      return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const value = await adminApi<Version>(
        action === "save"
          ? "master/design"
          : `master/design/${action === "publish" ? savedId : id}/${action}`,
        csrf,
        action === "save" ? config : {},
      );
      setConfig(value.config);
      setSaved(JSON.stringify(value.config));
      setSavedId(value.status === "DRAFT" ? value.id : null);
      setVersions(await adminApi<Version[]>("master/design"));
      if (action === "publish")
        window.dispatchEvent(new Event("paykar-design-published"));
      setNotice(
        action === "publish"
          ? "Published. New storefront visits use this version; existing tabs refresh on focus."
          : action === "restore"
            ? "Historical version restored as a new draft. Publish explicitly when ready."
            : "Draft saved. The public storefront is unchanged.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Design request failed",
      );
    } finally {
      setPending(false);
    }
  }
  const translate = (key: string) =>
    locale === "ru"
      ? key
      : (translations as Record<string, string[]>)[key]?.[
          locale === "tj" ? 0 : 1
        ] || key;
  const previewConfig = validDesign(config) ? config : defaultDesign;
  const palette = previewConfig.colors[theme];
  const previewStyle = {
    "--paykar-green": previewConfig.colors.brand,
    "--sale-color": previewConfig.colors.sale,
    "--page-surface": palette.background,
    "--surface": palette.surface,
    "--ink": palette.text,
    "--muted": palette.muted,
    "--line": `color-mix(in srgb, ${palette.border} ${palette.border_opacity * 100}%, transparent)`,
    "--radius": `${previewConfig.radius.card}px`,
    "--radius-lg": `${previewConfig.radius.panel}px`,
    "--radius-control": `${previewConfig.radius.button}px`,
    "--preview-heading": `${28 * previewConfig.typography.heading_scale}px`,
    "--glass": `color-mix(in srgb, ${palette.surface} ${previewConfig.effects.glass_opacity * 100}%, transparent)`,
    ...designVariables(previewConfig, theme),
    width:
      viewport === "mobile"
        ? "min(100%,390px)"
        : viewport === "tablet"
          ? "min(100%,768px)"
          : "100%",
    fontSize: `${16 * previewConfig.typography.body_scale}px`,
  } as CSSProperties;
  return (
    <>
      <AdminHeader title="Design Console" eyebrow="Advanced design system" />
      <p>
        Controlled tokens, local preview, explicit publication. Paykar Default
        preserves the approved storefront; not every bespoke component is
        tokenized.
      </p>
      {error && (
        <p className={styles.message} role="alert">
          {error}{" "}
          {!loaded && (
            <button onClick={() => setReload(reload + 1)}>Retry</button>
          )}
        </p>
      )}
      {notice && (
        <p className={styles.message} role="status">
          {notice}
        </p>
      )}
      {!loaded && !error && <p role="status">Loading design configuration…</p>}
      {loaded && (
        <>
          <SaveBar>
            <button
              className={styles.primary}
              disabled={pending || !validDesign(config)}
              onClick={() => void perform("save")}
            >
              Save draft
            </button>
            <button
              disabled={pending || dirty || !savedId || !validDesign(config)}
              onClick={() => void perform("publish")}
            >
              Publish saved draft
            </button>
            <button
              disabled={pending}
              onClick={() => {
                if (!dirty || window.confirm("Discard unsaved edits?")) {
                  setConfig(JSON.parse(saved));
                  setError("");
                }
              }}
            >
              Reset edits
            </button>
            <button
              disabled={pending}
              onClick={() => {
                setConfig((current) =>
                  resetDesignScope(current, { kind: "global" }),
                );
                setSavedId(null);
              }}
            >
              Global Paykar Default → draft
            </button>
            <span role="status">
              {dirty
                ? "Unsaved changes"
                : savedId
                  ? "Saved draft"
                  : "Published baseline"}
            </span>
          </SaveBar>
          <div className={styles.console}>
            <DesignControls
              entries={designEntries(config)}
              disabled={pending}
              change={(path, value) =>
                setConfig((current) => setDesignToken(current, path, value))
              }
            />
            <section aria-label="Live design preview">
              <div className={styles.toolbar}>
                <label>
                  Viewport
                  <select
                    value={viewport}
                    onChange={(e) => setViewport(e.target.value)}
                  >
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </label>
                <label>
                  Theme
                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(e.target.value as "dark" | "light")
                    }
                  >
                    <option>dark</option>
                    <option>light</option>
                  </select>
                </label>
                <label>
                  Language
                  <select
                    value={locale}
                    onChange={(e) =>
                      setLocale(e.target.value as "ru" | "tj" | "en")
                    }
                  >
                    <option value="ru">RU</option>
                    <option value="tj">TJ</option>
                    <option value="en">EN</option>
                  </select>
                </label>
              </div>
              {!validDesign(config) && (
                <p role="alert">
                  Invalid token values. Preview uses defaults; saving is
                  disabled.
                </p>
              )}
              <div className={styles.previewFrame}>
                <div
                  className={styles.preview}
                  style={previewStyle}
                  lang={locale === "tj" ? "tg" : locale}
                >
                  <span className={styles.eyebrow}>Paykar</span>
                  <h2>{translate("Мои покупки")}</h2>
                  <p>{translate("Продукты на каждый день.")}</p>
                  <div className={styles.actions}>
                    <button type="button" className="button">
                      {translate("Перейти в каталог")}
                    </button>
                    <button type="button" className="button secondary">
                      {translate("Создать шаблон")}
                    </button>
                  </div>
                  <label>
                    {translate("Поиск")}
                    <input
                      placeholder={translate("Найти молоко, хлеб, фрукты…")}
                    />
                  </label>
                  <div
                    className={styles.panel}
                    style={{
                      background: "var(--surface)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <h2>{translate("Акции")}</h2>
                    {product ? (
                      <article className={styles.previewCard}>
                        <div className={styles.previewImage}>
                          <Image
                            src={
                              product.image_url ||
                              "/images/products/fallback.svg"
                            }
                            alt={translate(product.name)}
                            width={260}
                            height={260}
                            unoptimized
                          />
                          {product.old_price &&
                            Number(product.old_price) >
                              Number(product.price) && (
                              <span className={styles.ribbon}>
                                −
                                {Math.round(
                                  (1 -
                                    Number(product.price) /
                                      Number(product.old_price)) *
                                    100,
                                )}
                                %
                              </span>
                            )}
                        </div>
                        <h3>{translate(product.name)}</h3>
                        <p>
                          <strong>{product.price} TJS</strong>{" "}
                          {product.old_price && <del>{product.old_price}</del>}
                        </p>
                        <button className="button" type="button">
                          {translate("В корзину")}
                        </button>
                      </article>
                    ) : (
                      <p>
                        No catalog preview available. The token preview remains
                        usable.
                      </p>
                    )}
                    <div className={styles.previewGlass}>
                      {translate("Покупки без регистрации")}
                    </div>
                  </div>
                  <p>Preview only · no cart changes</p>
                </div>
              </div>
            </section>
          </div>
          <section id="design-history" className={styles.panel}>
            <h2>Version history</h2>
            <p>
              Restore creates a new draft; archived publications remain intact.
            </p>
            {versions.length ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Version</th>
                      <th scope="col">Status</th>
                      <th scope="col">Author / created</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((version) => (
                      <tr key={version.id}>
                        <td>v{version.version}</td>
                        <td>
                          <StatusBadge status={version.status} />
                        </td>
                        <td>
                          {version.author}
                          <br />
                          {new Date(version.created_at).toLocaleString()}
                        </td>
                        <td>
                          {version.published_at ? (
                            <button
                              disabled={pending}
                              onClick={() =>
                                void perform("restore", version.id)
                              }
                            >
                              Restore to new draft
                            </button>
                          ) : (
                            <button
                              disabled={pending}
                              onClick={() => {
                                if (
                                  !dirty ||
                                  window.confirm("Discard unsaved edits?")
                                ) {
                                  setConfig(version.config);
                                  setSaved(JSON.stringify(version.config));
                                  setSavedId(version.id);
                                }
                              }}
                            >
                              Load draft
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No saved versions. Paykar Default is active.</p>
            )}
          </section>
          <section className={styles.panel}>
            <h2>Audit log</h2>
            <button
              disabled={pending}
              onClick={async () => {
                try {
                  setAudit(await adminApi<Audit[]>("master/audit"));
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Audit unavailable",
                  );
                }
              }}
            >
              Load privileged actions
            </button>
            {audit &&
              (audit.length ? (
                <ul>
                  {audit.map((entry) => (
                    <li key={entry.id}>
                      {entry.action} · {entry.target} ·{" "}
                      {new Date(entry.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recorded actions.</p>
              ))}
          </section>
        </>
      )}
    </>
  );
}
