"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./Reveal.module.css";

type Direction = "left" | "right" | "up" | "down" | "zoom" | "none";

type Props = {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
};

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 900,
  className = "",
  once = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style = {
    "--delay": `${delay}ms`,
    "--dur": `${duration}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      className={`${styles.base} ${styles[direction] ?? ""} ${visible ? styles.visible : ""} ${className}`}
    >
      {children}
    </div>
  );
}