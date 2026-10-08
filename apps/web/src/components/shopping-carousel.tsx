"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import styles from "./shopping-carousel.module.css";

function readPosition(viewport: HTMLDivElement, centered: boolean) {
  const end = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const offset = centered ? viewport.clientWidth / 2 : 0;
  let active = 0;
  let lastReachable = 0;
  let closest = Infinity;
  let closestToEnd = Infinity;
  Array.from(viewport.children).forEach((child, index) => {
    const slide = child as HTMLElement;
    const point = centered
      ? slide.offsetLeft + slide.offsetWidth / 2
      : Math.min(end, Math.max(0, slide.offsetLeft - 4));
    const distance = Math.abs(point - viewport.scrollLeft - offset);
    const endDistance = Math.abs(point - end - offset);
    if (distance < closest) {
      closest = distance;
      active = index;
    }
    if (endDistance < closestToEnd) {
      closestToEnd = endDistance;
      lastReachable = index;
    }
  });
  return {
    active,
    lastReachable,
    atStart: viewport.scrollLeft <= 2,
    atEnd: viewport.scrollLeft >= end - 2,
    canScroll: end > 2,
  };
}

export function ShoppingCarousel({
  children,
  label,
  variant,
  initialIndex = 0,
}: {
  children: ReactNode;
  label: string;
  variant: "orders" | "templates";
  initialIndex?: number;
}) {
  const { t } = usePresentation();
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const activeRef = useRef(initialIndex);
  const scrollFrame = useRef<number | null>(null);
  const [position, setPosition] = useState({
    active: initialIndex,
    lastReachable: slides.length - 1,
    atStart: initialIndex === 0,
    atEnd: slides.length < 2,
    canScroll: false,
  });

  const moveTo = (index: number, smooth = true) => {
    const viewport = track.current;
    const slide = viewport?.children[index] as HTMLElement | undefined;
    if (!viewport || !slide) return;
    const centered = variant === "orders";
    viewport.scrollTo({
      left: centered
        ? slide.offsetLeft - (viewport.clientWidth - slide.offsetWidth) / 2
        : slide.offsetLeft - 4,
      behavior:
        smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "instant",
    });
  };

  const measure = () => {
    const viewport = track.current;
    if (!viewport) return;
    const next = readPosition(viewport, variant === "orders");
    activeRef.current = next.active;
    setPosition(next);
  };

  useEffect(() => {
    const viewport = track.current;
    if (!viewport) return;
    const align = () => {
      activeRef.current = Math.min(
        activeRef.current,
        viewport.children.length - 1,
      );
      const slide = viewport.children[activeRef.current] as
        HTMLElement | undefined;
      if (!slide) return;
      viewport.scrollTo({
        left:
          variant === "orders"
            ? slide.offsetLeft - (viewport.clientWidth - slide.offsetWidth) / 2
            : slide.offsetLeft - 4,
        behavior: "instant",
      });
    };
    align();
    const observer = new ResizeObserver(() => {
      align();
      const next = readPosition(viewport, variant === "orders");
      activeRef.current = next.active;
      setPosition(next);
    });
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      if (scrollFrame.current !== null)
        cancelAnimationFrame(scrollFrame.current);
    };
  }, [variant, slides.length]);

  const step = (direction: -1 | 1) => {
    if (variant === "templates") {
      const viewport = track.current;
      const slide = viewport?.firstElementChild as HTMLElement | null;
      if (!viewport || !slide) return;
      viewport.scrollBy({
        left:
          direction *
          (slide.offsetWidth +
            parseFloat(getComputedStyle(viewport).columnGap)),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    } else {
      moveTo(
        Math.max(0, Math.min(slides.length - 1, position.active + direction)),
      );
    }
  };

  return (
    <div
      className={`${styles.carousel} ${variant === "orders" ? styles.orders : styles.templates}`}
      role="region"
      aria-label={label}
      data-single={slides.length === 1 || undefined}
      data-sparse={slides.length <= 2 || undefined}
      data-static={!position.canScroll || undefined}
    >
      <div
        ref={track}
        className={styles.track}
        tabIndex={slides.length > 1 && position.canScroll ? 0 : undefined}
        onScroll={() => {
          if (scrollFrame.current !== null)
            cancelAnimationFrame(scrollFrame.current);
          scrollFrame.current = requestAnimationFrame(measure);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (!position.canScroll) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            step(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={
              typeof slide === "object" && slide !== null && "key" in slide
                ? slide.key
                : index
            }
            className={styles.slide}
            data-active={index === position.active || undefined}
            role="group"
            aria-label={`${index + 1} / ${slides.length}`}
          >
            {slide}
          </div>
        ))}
      </div>
      {slides.length > 1 && position.canScroll && (
        <>
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.previous}
              onClick={() => step(-1)}
              disabled={position.atStart}
              aria-label={t("Предыдущая карточка")}
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.next}
              onClick={() => step(1)}
              disabled={position.atEnd}
              aria-label={t("Следующая карточка")}
            >
              <ChevronRight size={21} aria-hidden="true" />
            </button>
          </div>
          {(variant === "orders" || slides.length > 1) && (
            <div className={styles.dots}>
              {slides.slice(0, position.lastReachable + 1).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${t("Показать карточку")} ${index + 1}`}
                  aria-pressed={index === position.active}
                  onClick={() => moveTo(index)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
