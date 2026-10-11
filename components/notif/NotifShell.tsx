"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./notif.module.css";

export type NotifTone = "materi" | "tugas" | "asesmen" | "info";
export type NotifItem = { key: string; href: string; icon: string; tone: NotifTone; title: string; meta: string };
export type NotifSection = { key: string; title?: string; emptyText?: string; items: NotifItem[] };

type Props = {
  hasUnread: boolean;
  loading: boolean;
  error: string;
  sections: NotifSection[];
  emptyText: string;
  allHref: string;
  onRefresh: () => void;
  onOpen?: () => void;
  onMarkRead?: () => void;
  canMarkRead?: boolean;
};

export function NotifShell(props: Props) {
  const { hasUnread, loading, error, sections, emptyText, allHref, onRefresh, onOpen, onMarkRead, canMarkRead } = props;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const titled = sections.some((section) => section.title);
  const close = () => setOpen(false);

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={styles.bell}
        aria-label="Buka pengumuman"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (!open) onOpen?.();
          setOpen(!open);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2.5 2.5 0 0 0 4 0" />
        </svg>
        {hasUnread && <span className={styles.dot} />}
      </button>
      {open && (
        <section className={styles.popup} role="dialog" aria-label="Pengumuman terbaru" aria-live="polite">
          <span className={styles.arrow} aria-hidden="true" />
          <div className={styles.head}>
            <strong>Pengumuman Terbaru</strong>
            <button type="button" aria-label="Muat ulang pengumuman" onClick={onRefresh}>{"\u21BB"}</button>
          </div>
          <div className={styles.body}>
            {loading && <div className={styles.state}>Memuat pengumuman...</div>}
            {!loading && error && (
              <div className={styles.state} role="alert">
                <span>{error}</span>
                <button type="button" onClick={onRefresh}>Coba lagi</button>
              </div>
            )}
            {!loading && !error && total === 0 && !titled && <div className={styles.state}>{emptyText}</div>}
            {!loading && !error && sections.map((section) => {
              if (!section.title && section.items.length === 0) return null;
              return (
                <section className={styles.group} key={section.key}>
                  {section.title && <h3>{section.title}</h3>}
                  {section.items.length === 0 ? (
                    <p className={styles.none}>{section.emptyText}</p>
                  ) : (
                    section.items.map((item) => (
                      <Link className={styles.item} key={item.key} href={item.href} onClick={close}>
                        <span className={styles.icon + " " + (styles["tone_" + item.tone] ?? "")} aria-hidden="true">{item.icon}</span>
                        <span className={styles.text}>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </span>
                      </Link>
                    ))
                  )}
                </section>
              );
            })}
          </div>
          <footer className={styles.footer}>
            <Link href={allHref} onClick={close}>Lihat semua pengumuman</Link>
            {onMarkRead && <button type="button" disabled={!canMarkRead} onClick={onMarkRead}>Tandai sudah dibaca</button>}
          </footer>
        </section>
      )}
    </div>
  );
}