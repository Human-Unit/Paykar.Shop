"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
  type MotionProps,
} from "framer-motion";

// Stable component identities preserve Next links, images and existing state.
export const MotionLink = m.create(Link);
export const MotionImage = m.create(Image);
export { m };

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

// Local, frame-limited lighting; pointer movement never updates React state.
export function usePointerLight() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const clear = (event: PointerEvent<HTMLElement>) => {
    cancelAnimationFrame(frame.current);
    event.currentTarget.style.removeProperty("--mouse-x");
    event.currentTarget.style.removeProperty("--mouse-y");
  };
  return {
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (
        event.pointerType !== "mouse" ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const node = event.currentTarget;
      const { clientX, clientY } = event;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mouse-x", `${clientX - rect.left}px`);
        node.style.setProperty("--mouse-y", `${clientY - rect.top}px`);
      });
    },
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}

type RevealProps = Pick<
  MotionProps,
  | "initial"
  | "animate"
  | "whileInView"
  | "viewport"
  | "transition"
  | "whileHover"
> & { "data-reveal": true };

// Apply to the existing semantic element: no wrapper, sizing or route key.
// Keep initial styles identical on server/client. CSS removes these transforms
// before hydration for reduced motion; the hook also shortens the animation.
export function useReveal({
  rise = 18,
  delay = 0,
  duration = 0.56,
  scale,
  inView = true,
  hover = false,
  lift = 4,
}: {
  rise?: number;
  delay?: number;
  duration?: number;
  scale?: number;
  inView?: boolean;
  hover?: boolean;
  lift?: number;
} = {}): RevealProps {
  const reduceMotion = useReducedMotion();
  const visible = {
    opacity: 1,
    ...(rise ? { y: 0 } : {}),
    ...(scale ? { scale: 1 } : {}),
  };

  return {
    "data-reveal": true,
    initial: {
      opacity: 0,
      ...(rise ? { y: rise } : {}),
      ...(scale ? { scale } : {}),
    },
    ...(inView
      ? { whileInView: visible, viewport: { once: true, amount: 0.12 } }
      : { animate: visible }),
    transition: {
      duration: reduceMotion ? 0 : duration,
      delay: reduceMotion ? 0 : delay,
      ease,
    },
    ...(hover
      ? {
          whileHover: {
            y: reduceMotion ? 0 : -lift,
            transition: { duration: 0.24, delay: 0, ease },
          },
        }
      : {}),
  };
}
