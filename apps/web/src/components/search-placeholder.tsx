"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePresentation } from "@/context/presentation";

// Existing dictionary keys for product families present in the catalog.
const exampleKeys = ["Молоко", "Хлеб", "Чай", "Печенье"] as const;

function subscribeAnimation(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  document.addEventListener("visibilitychange", callback);
  return () => {
    media.removeEventListener("change", callback);
    document.removeEventListener("visibilitychange", callback);
  };
}

function animationAllowed() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    document.visibilityState === "visible"
  );
}

function TypedExamples({ phrases }: { phrases: readonly string[] }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let index = 0;
    let length = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const characters = Array.from(phrases[index]);
      length += deleting ? -1 : 1;
      setText(characters.slice(0, length).join(""));
      let delay = deleting ? 55 : 90;
      if (!deleting && length === characters.length) {
        deleting = true;
        delay = 1500;
      } else if (deleting && length === 0) {
        deleting = false;
        index = (index + 1) % phrases.length;
        delay = 400;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [phrases]);

  // Keep the normal placeholder during the initial/restart delay.
  if (text === null) return null;
  return (
    <span className="search-placeholder" aria-hidden="true">
      <span>{text}</span>
    </span>
  );
}

export function SearchPlaceholder() {
  const { t, language } = usePresentation();
  const phrases = useMemo(() => exampleKeys.map((key) => t(key)), [t]);
  const allowed = useSyncExternalStore(
    subscribeAnimation,
    animationAllowed,
    () => false,
  );
  return allowed ? <TypedExamples key={language} phrases={phrases} /> : null;
}
