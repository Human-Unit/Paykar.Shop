"use client";
import { designControl } from "@/lib/design-registry";
import { tokenRanges } from "@/lib/design-config";
import styles from "./admin.module.css";

export function DesignControls({
  entries,
  change,
  disabled = false,
}: {
  entries: [string, string | number][];
  change: (path: string, value: string | number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.controls}>
      {["Brand", "Layout", "Surfaces", "Effects", "Motion"].map((group) => {
        const values = entries.filter(
          ([path]) => designControl(path).group === group,
        );
        if (!values.length) return null;
        return (
          <details
            key={group}
            open={group === "Brand" || group === "Layout"}
            className={styles.controlGroup}
          >
            <summary>{group}</summary>
            <fieldset disabled={disabled} aria-label={group}>
              {values.map(([path, value]) => {
                const metadata = designControl(path),
                  range = tokenRanges[path];
                return (
                  <label key={path}>
                    <span>{metadata.label}</span>
                    <small>{metadata.description}</small>
                    {typeof value === "string" ? (
                      <div className={styles.colorControl}>
                        <input
                          aria-label={`${metadata.label} color`}
                          type="color"
                          value={
                            /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"
                          }
                          onChange={(e) => change(path, e.target.value)}
                        />
                        <input
                          aria-label={`${metadata.label} hex`}
                          value={value}
                          maxLength={7}
                          pattern="#[0-9a-fA-F]{6}"
                          onChange={(e) => change(path, e.target.value)}
                        />
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={Number.isFinite(value) ? value : ""}
                        min={range[0]}
                        max={range[1]}
                        step={range[2]}
                        onChange={(e) => change(path, e.target.valueAsNumber)}
                      />
                    )}
                    <small className={styles.token}>{path}</small>
                  </label>
                );
              })}
            </fieldset>
          </details>
        );
      })}
    </div>
  );
}
