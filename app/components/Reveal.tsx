"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

export type RevealDirection = "left" | "right" | "up" | "down" | "none";

type RevealProps = {
  children: ReactNode;
  direction: RevealDirection;
  delay?: number;
  duration?: number;
  as?: ElementType;
  className?: string;
};

export default function Reveal({
  children,
  direction,
  delay = 0,
  duration = 700,
  as: Tag = "div",
  className,
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      element.dataset.revealVisible = "true";
      return;
    }

    element.dataset.revealReady = "true";
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        element.dataset.revealVisible = entry.isIntersecting ? "true" : "false";
      }
    }, { threshold: 0.2 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--reveal-delay": `${Math.max(0, delay)}ms`,
    "--reveal-duration": `${Math.max(0, duration)}ms`,
  } as CSSProperties;

  return (
    <Tag
      ref={elementRef}
      className={className ? `reveal ${className}` : "reveal"}
      data-direction={direction}
      style={style}
    >
      {children}
    </Tag>
  );
}
