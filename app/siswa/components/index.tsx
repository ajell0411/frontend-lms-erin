"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./components.module.css";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className={styles.pageHeader}><h1>{title}</h1><p>{subtitle}</p></div>;
}

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <section className={`${styles.card} ${className}`} style={style}>{children}</section>;
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "danger" | "warning" | "info" }) {
  return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{children}</span>;
}

export type DropdownOption = { value: string; label: string };
export function Dropdown({ options, value, onChange, placeholder = "Pilih", label }: { options: DropdownOption[]; value: string; onChange: (value: string) => void; placeholder?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const current = options.find((option) => option.value === value)?.label ?? "";
  return <div className={styles.dropdown} ref={root}>
    <button type="button" className={styles.dropdownButton} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onKeyDown={(event) => {
      if (event.key === "ArrowDown" && !open) {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => root.current?.querySelector<HTMLElement>('[role="option"]')?.focus(), 0);
      }
    }} onClick={() => setOpen((state) => !state)}>{current || placeholder}<span aria-hidden="true">⌄</span></button>
    {open && <div className={styles.dropdownMenu} role="listbox" id={id} aria-label={label}>{options.map((option, index) => <button type="button" role="option" aria-selected={value === option.value} key={option.value} onKeyDown={(event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const choices = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
      const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length;
      choices[next]?.focus();
    }} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}<span aria-hidden="true">{value === option.value ? "✓" : ""}</span></button>)}</div>}
  </div>;
}

export function SearchInput({ value, onChange, placeholder = "Cari..." }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className={styles.search}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function EmptyState({ icon = "◇", title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return <div className={styles.state}><span className={styles.stateIcon}>{icon}</span><strong>{title}</strong>{description && <p>{description}</p>}</div>;
}

export function ErrorState(_props: { message: string; onRetry: () => void }) {
  const path = usePathname() ?? "";
  const title = path.includes("/tugas") ? "Belum ada tugas mendatang"
    : path.includes("/asesmen") ? "Belum ada asesmen mendatang"
    : path.includes("/materi") ? "Belum ada materi terbaru"
    : "Belum ada data";
  return <EmptyState title={title} />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`${styles.skeleton} ${className}`} aria-hidden="true" />;
}

type ToastMessage = { id: number; text: string; kind: "success" | "error" | "info" };
type ToastContextValue = { showToast: (text: string, kind?: ToastMessage["kind"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);
export function Toast({ text, kind = "success", onClose }: { text: string; kind?: ToastMessage["kind"]; onClose: () => void }) {
  return <div className={`${styles.toast} ${styles[`toast_${kind}`]}`}>{text}<button aria-label="Tutup" onClick={onClose}>×</button></div>;
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const showToast = useCallback((text: string, kind: ToastMessage["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setMessages((current) => [...current, { id, text, kind }]);
    window.setTimeout(() => setMessages((current) => current.filter((message) => message.id !== id)), 3500);
  }, []);
  return <ToastContext.Provider value={{ showToast }}>{children}<div className={styles.toastStack} aria-live="polite">{messages.map((message) => <Toast key={message.id} text={message.text} kind={message.kind} onClose={() => setMessages((current) => current.filter((item) => item.id !== message.id))}/>)}</div></ToastContext.Provider>;
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus digunakan di dalam ToastProvider.");
  return context.showToast;
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    focusable()?.[0]?.focus();
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items?.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", keyHandler);
    return () => { document.removeEventListener("keydown", keyHandler); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialog} className={styles.modal} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button type="button" aria-label="Tutup dialog" onClick={onClose}>×</button></header><div className={styles.modalBody}>{children}</div>{footer && <footer>{footer}</footer>}</div></div>;
}

export function FileDropzone({ accept, maxSizeMB, onFile, file }: { accept: string; maxSizeMB: number; onFile: (file: File | null) => void; file: File | null }) {
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const choose = (candidate: File | null) => {
    setError("");
    if (!candidate) { onFile(null); return; }
    if (candidate.size > maxSizeMB * 1024 * 1024) { setError(`Ukuran file maksimal ${maxSizeMB} MB.`); return; }
    const allowed = accept.split(",").map((part) => part.trim().toLowerCase());
    if (!allowed.some((part) => part.startsWith(".") && candidate.name.toLowerCase().endsWith(part))) { setError("Format file tidak didukung."); return; }
    onFile(candidate);
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => choose(event.target.files?.[0] ?? null);
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0] ?? null); };
  return <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
    <input ref={input} type="file" accept={accept} onChange={onChange} hidden />
    {file ? <><strong>{file.name}</strong><button type="button" onClick={() => { onFile(null); if (input.current) input.current.value = ""; }}>Hapus file</button></> : <><span aria-hidden="true">⇧</span><p>Tarik dan lepas file di sini atau</p><button type="button" onClick={() => input.current?.click()}>Pilih File</button><small>Maksimal {maxSizeMB} MB</small></>}
    {error && <p className={styles.fileError} role="alert">{error}</p>}
  </div>;
}
