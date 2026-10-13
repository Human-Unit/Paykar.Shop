"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi, AdminError, type AdminIdentity } from "@/lib/admin-api";
import {
  designEntries,
  designEditState,
  resetDesignScope,
  resolveDesign,
  setScopedToken,
  validDesign,
  type DesignConfig,
  type DesignScope,
} from "@/lib/design-config";
import {
  designPageForPath,
  designPages,
  designRegions,
  type DesignRegionId,
} from "@/lib/design-registry";
import { DesignControls } from "./admin/design-controls";
import { StatusBadge } from "./admin/admin-primitives";
import adminStyles from "./admin/admin.module.css";
import styles from "./inline-master.module.css";

export type DesignVersion = {
  id: number;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  config: DesignConfig;
  published_at: string | null;
};
export default function InlineMaster({
  identity,
  published,
  onPreview,
  onOpen,
}: {
  identity: AdminIdentity;
  published: DesignConfig;
  onPreview: (config: DesignConfig | null) => void;
  onOpen: (open: boolean) => void;
}) {
  const path = usePathname(),
    page = designPageForPath(path);
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [scope, setScope] = useState<DesignScope>({ kind: "global" });
  const [config, setConfig] = useState<DesignConfig>(published);
  const [saved, setSaved] = useState<DesignConfig>(published);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const state = designEditState(config, saved, savedId),
    dirty = state === "unsaved";
  const valid = validDesign(config);
  const previousPath = useRef(path);
  const previouslyOpen = useRef(false);
  useEffect(() => {
    if (!open || loaded) return;
    const controller = new AbortController();
    adminApi<DesignVersion[]>(
      "master/design",
      undefined,
      undefined,
      controller.signal,
    )
      .then((values) => {
        if (controller.signal.aborted) return;
        const publication = values.find((v) => v.status === "PUBLISHED");
        const draft = values.find(
          (v) =>
            v.status === "DRAFT" && v.version > (publication?.version || 0),
        );
        const initial = draft?.config || publication?.config || published;
        if (!validDesign(initial))
          throw new Error(
            "Design configuration is invalid. Public defaults remain active.",
          );
        setConfig(initial);
        setSaved(initial);
        setSavedId(draft?.id || null);
        setLoaded(true);
        setError("");
        setPreviewing(true);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Unable to load draft",
          );
      });
    return () => controller.abort();
  }, [open, loaded, retry, published]);
  useEffect(() => {
    onOpen(open);
    if (open) title.current?.focus();
    else if (previouslyOpen.current) trigger.current?.focus();
    previouslyOpen.current = open;
    return () => onOpen(false);
  }, [open, onOpen]);
  useEffect(() => {
    onPreview(previewing && loaded && valid ? config : null);
  }, [config, previewing, loaded, valid, onPreview]);
  useEffect(() => () => onPreview(null), [onPreview]);
  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    // Preserve config/draft/open state, clear contextual selection only.
    setScope(page ? { kind: "page", id: page } : { kind: "global" });
    setSelecting(false);
  }, [path, page]);
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selecting) setSelecting(false);
      else {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, selecting]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => e.preventDefault();
    const navigate = (e: MouseEvent) => {
      const target =
        e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!target) return;
      const url = new URL((target as HTMLAnchorElement).href, location.href);
      const leaving =
        url.origin !== location.origin || url.pathname.startsWith("/admin");
      if (
        leaving &&
        !window.confirm("Leave without saving local design edits?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  useEffect(() => {
    const view = document.querySelector<HTMLElement>(
      "[data-storefront-design-view]",
    );
    if (!view || !open) return;
    view.dataset.designSelecting = String(selecting);
    const elements = [
      ...view.querySelectorAll<HTMLElement>("[data-design-region]"),
    ];
    for (const element of elements)
      element.dataset.designSelected = String(
        scope.kind === "section" && element.dataset.designRegion === scope.id,
      );
    const pick = (e: MouseEvent) => {
      if (!selecting || !(e.target instanceof Element)) return;
      const region = e.target.closest<HTMLElement>("[data-design-region]");
      const id = region?.dataset.designRegion;
      if (
        !id ||
        !Object.hasOwn(designRegions, id) ||
        designRegions[id as DesignRegionId].page !== page
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setScope({ kind: "section", id: id as DesignRegionId });
      setSelecting(false);
    };
    view.addEventListener("click", pick, true);
    return () => {
      delete view.dataset.designSelecting;
      for (const el of elements) delete el.dataset.designSelected;
      view.removeEventListener("click", pick, true);
    };
  }, [open, selecting, scope, page, path]);
  async function perform(action: "save" | "publish") {
    if (
      pending ||
      !loaded ||
      !valid ||
      (action === "publish" && (dirty || !savedId))
    )
      return;
    if (
      action === "publish" &&
      !window.confirm("Publish this saved draft to all storefront visitors?")
    )
      return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const version = await adminApi<DesignVersion>(
        action === "save"
          ? "master/design"
          : `master/design/${savedId}/publish`,
        identity.csrf,
        action === "save" ? config : {},
      );
      if (!validDesign(version.config))
        throw new Error("Server returned an invalid design configuration");
      setConfig(version.config);
      setSaved(version.config);
      setSavedId(action === "save" ? version.id : null);
      setNotice(
        action === "save"
          ? "Draft saved. Public visitors still see the published version."
          : "Published. Existing public tabs refresh on focus.",
      );
      if (action === "publish")
        window.dispatchEvent(new Event("paykar-design-published"));
    } catch (cause) {
      if (cause instanceof AdminError && [401, 403].includes(cause.status)) {
        setPreviewing(false);
        setLoaded(false);
      }
      setError(
        cause instanceof Error ? cause.message : "Design request failed",
      );
    } finally {
      setPending(false);
    }
  }
  const effective = resolveDesign(
    config,
    scope.kind === "global"
      ? null
      : scope.kind === "page"
        ? scope.id
        : designRegions[scope.id].page,
    scope.kind === "section" ? scope.id : undefined,
  );
  const entries = designEntries(effective).filter(
    ([token]) =>
      scope.kind !== "section" ||
      (designRegions[scope.id].controls as readonly string[]).includes(token),
  );
  const context =
    scope.kind === "global"
      ? "Global storefront"
      : scope.kind === "page"
        ? designPages[scope.id]
        : `${designPages[designRegions[scope.id].page]} / ${designRegions[scope.id].label}`;
  return (
    <div
      className={`${adminStyles.root} ${styles.root}`}
      data-inline-master
      lang="en"
    >
      <button
        ref={trigger}
        className={styles.trigger}
        hidden={open}
        aria-expanded={open}
        aria-controls="inline-master-drawer"
        onClick={() => {
          setOpen(!open);
          if (loaded) setPreviewing(true);
        }}
      >
        MASTER{dirty ? " ·" : ""}
      </button>
      {open && (
        <aside
          id="inline-master-drawer"
          className={styles.drawer}
          role="dialog"
          aria-label="Inline Master Design"
          aria-modal="false"
        >
          <header className={styles.header}>
            <div>
              <span className={adminStyles.eyebrow}>Master design</span>
              <h2 ref={title} tabIndex={-1}>
                {context}
              </h2>
            </div>
            <button
              aria-label="Collapse editor"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              ×
            </button>
            <StatusBadge
              status={
                dirty
                  ? "Unsaved changes"
                  : savedId
                    ? "Draft saved"
                    : "Published"
              }
            />
            <p>Preview applies only to this MASTER tab until Publish.</p>
          </header>
          <div className={styles.body}>
            <label>
              Editing scope
              <select
                disabled={pending}
                value={
                  scope.kind === "global"
                    ? "global"
                    : scope.kind === "page"
                      ? "page"
                      : scope.id
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setScope(
                    value === "global"
                      ? { kind: "global" }
                      : value === "page" && page
                        ? { kind: "page", id: page }
                        : { kind: "section", id: value as DesignRegionId },
                  );
                }}
              >
                <option value="global">Global storefront</option>
                {page && (
                  <option value="page">{designPages[page]} · page</option>
                )}
                {Object.entries(designRegions)
                  .filter(([, r]) => r.page === page)
                  .map(([id, r]) => (
                    <option key={id} value={id}>
                      {r.label} · section
                    </option>
                  ))}
              </select>
            </label>
            <button
              aria-pressed={selecting}
              disabled={!loaded || pending}
              onClick={() => setSelecting(!selecting)}
            >
              {selecting ? "Stop selecting · Esc" : "Select a region"}
            </button>
            {!loaded && !error && <p role="status">Loading saved design…</p>}
            {error && (
              <p role="alert" className={adminStyles.message}>
                {error}
                {!loaded && (
                  <button onClick={() => setRetry(retry + 1)}>Retry</button>
                )}
              </p>
            )}
            {notice && (
              <p role="status" className={adminStyles.message}>
                {notice}
              </p>
            )}
            {loaded && (
              <>
                {!valid && (
                  <p role="alert">
                    Enter valid bounded values before saving. Preview keeps the
                    published fallback.
                  </p>
                )}
                <DesignControls
                  entries={entries}
                  disabled={pending}
                  change={(token, value) => {
                    setConfig((current) =>
                      setScopedToken(current, scope, token, value),
                    );
                    setPreviewing(true);
                    setNotice("");
                  }}
                />
                <button
                  disabled={pending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Reset ${context} overrides to Paykar Default? Other scopes are preserved.`,
                      )
                    ) {
                      setConfig((current) => resetDesignScope(current, scope));
                      setPreviewing(true);
                      setNotice(
                        "Scope reset locally. Save and publish when ready.",
                      );
                    }
                  }}
                >
                  Reset current scope
                </button>
                <p>
                  Page/section reset removes its overrides and inherits the
                  parent. Global reset preserves page and section overrides.
                </p>
                <button onClick={() => setPreviewing(!previewing)}>
                  {previewing
                    ? "Show published design"
                    : "Resume local preview"}
                </button>
              </>
            )}
            <div className={styles.links}>
              <Link href="/admin/master/design">
                Open full Design Console →
              </Link>
              <Link href="/admin/master/design#design-history">
                View history →
              </Link>
            </div>
          </div>
          <footer className={styles.footer}>
            <button
              disabled={!loaded || pending || !valid || !dirty}
              className={adminStyles.primary}
              onClick={() => void perform("save")}
            >
              {pending ? "Working…" : "Save draft"}
            </button>
            <button
              disabled={!loaded || pending || !valid || dirty || !savedId}
              onClick={() => void perform("publish")}
            >
              Publish
            </button>
          </footer>
        </aside>
      )}
    </div>
  );
}
