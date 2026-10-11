"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import styles from "./ui.module.css";

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
}

export function pesanError(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export function formatTanggal(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatWaktu(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function toInputDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function waktuLalu(iso: string) {
  const menit = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return "Baru saja";
  if (menit < 60) return `${menit} menit yang lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam yang lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari yang lalu`;
  return formatTanggal(iso);
}

export function nilaiTone(n: number | null | undefined) {
  if (n === null || n === undefined) return styles.chip;
  if (n >= 80) return `${styles.chip} ${styles.chipGreen}`;
  if (n >= 60) return `${styles.chip} ${styles.chipYellow}`;
  return `${styles.chip} ${styles.chipRed}`;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type IconName =
  | "plus" | "edit" | "trash" | "eye" | "download" | "search" | "back"
  | "upload" | "clock" | "users" | "pin" | "check" | "file" | "tugas" | "asesmen";

export function Icon({ name }: { name: IconName }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "plus":
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case "edit":
      return <svg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
    case "trash":
      return <svg {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>;
    case "eye":
      return <svg {...props}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "download":
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
    case "search":
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    case "back":
      return <svg {...props}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
    case "upload":
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "users":
      return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>;
    case "pin":
      return <svg {...props}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "check":
      return <svg {...props}><path d="M20 6 9 17l-5-5" /></svg>;
    case "file":
      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
    case "tugas":
      return <svg {...props}><path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><rect x="8" y="2" width="8" height="5" rx="1" /><path d="M8 12h8M8 16h5" /></svg>;
    case "asesmen":
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3.5h6M8 10l2 2 5-5M8 17h8" /></svg>;
  }
}

export function Avatar({ nama, foto, size = 36 }: { nama: string; foto?: string; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size / 3)) }}>
      {foto ? <Image src={foto} alt="" width={size} height={size} unoptimized /> : initials(nama)}
    </span>
  );
}

export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className={styles.pageHead}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      {text && <span>{text}</span>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sizeClass = size === "xl" ? styles.modalXl : size === "lg" ? styles.modalLg : "";
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={[styles.modal, sizeClass].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button type="button" className={styles.closeBtn} aria-label="Tutup" onClick={onClose}>
            {"\u00D7"}
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFoot}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  text: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel}>
            Batal
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnDangerSolid}`} disabled={busy} onClick={onConfirm}>
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className={styles.confirmText}>{text}</p>
    </Modal>
  );
}

export function useNotice() {
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const show = useCallback((text: string, error = false) => setMsg({ text, error }), []);
  useEffect(() => {
    if (!msg) return;
    const timer = window.setTimeout(() => setMsg(null), 3500);
    return () => window.clearTimeout(timer);
  }, [msg]);
  const node = msg ? (
    <div className={[styles.toast, msg.error ? styles.toastError : ""].join(" ")} role="status">
      {msg.text}
    </div>
  ) : null;
  return { show, node };
}

export function FilePreview({
  title,
  blob,
  filename,
  onClose,
}: {
  title: string;
  blob: Blob;
  filename: string;
  onClose: () => void;
}) {
  const lower = filename.toLowerCase();
  const kind: "pdf" | "image" | "none" = lower.endsWith(".pdf")
    ? "pdf"
    : /\.(png|jpe?g|gif|webp)$/.test(lower)
      ? "image"
      : "none";
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (kind === "none") return;
    const typed = kind === "pdf" && blob.type !== "application/pdf" ? new Blob([blob], { type: "application/pdf" }) : blob;
    const objectUrl = URL.createObjectURL(typed);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob, kind]);

  return (
    <Modal
      title={title}
      size="xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => saveBlob(blob, filename)}>
            <Icon name="download" />
            Unduh
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
            Tutup
          </button>
        </>
      }
    >
      <div className={styles.previewBody} style={{ margin: -20, height: "calc(100% + 40px)" }}>
        {kind === "pdf" && url ? (
          <iframe src={url} title={title} />
        ) : kind === "image" && url ? (
          <Image src={url} alt={title} width={900} height={700} unoptimized style={{ height: "auto" }} />
        ) : (
          <div className={styles.previewEmpty}>
            <p>Format file ini belum bisa ditampilkan di halaman. Silakan unduh untuk membukanya.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}