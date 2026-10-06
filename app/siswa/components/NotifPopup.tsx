"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { listPengumumanSiswa, tandaiPengumumanDibaca, type JenisPengumuman, type PengumumanSiswa } from "@/lib/siswa";
import styles from "./components.module.css";

function waktuRelatif(value: string): string {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Kemarin" : `${days} hari lalu`;
}

const groups: { type: JenisPengumuman; title: string; icon: string }[] = [
  { type: "materi", title: "Materi Terbaru", icon: "▤" },
  { type: "tugas", title: "Tugas Terbaru", icon: "✓" },
  { type: "asesmen", title: "Asesmen Terbaru", icon: "✎" },
];

export function NotifPopup() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PengumumanSiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPengumumanSiswa();
      setItems(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pengumuman belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const grouped = useMemo(() => Object.fromEntries(groups.map((group) => [group.type,
    items.filter((item) => item.jenis === group.type).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3),
  ])) as Record<JenisPengumuman, PengumumanSiswa[]>, [items]);

  async function markRead() {
    try {
      await tandaiPengumumanDibaca();
      setItems((current) => current.map((item) => ({ ...item, dilihat: true })));
    } catch { setError("Pengumuman belum dapat ditandai sudah dibaca. Coba lagi."); }
  }

  function target(item: PengumumanSiswa): string {
    if (item.jenis === "materi") return "/siswa/materi";
    return `/siswa/${item.jenis}/${encodeURIComponent(String(item.ref_id))}`;
  }

  return <div className={styles.notifRoot} ref={root}>
    <button type="button" className={styles.bellButton} aria-label="Buka pengumuman" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2.5 2.5 0 0 0 4 0" /></svg>
      {items.some((item) => !item.dilihat) && <span className={styles.bellDot} />}
    </button>
    {open && <section className={styles.notifPopup} role="dialog" aria-label="Pengumuman terbaru" aria-live="polite">
      <span className={styles.notifArrow} aria-hidden="true" />
      <div className={styles.notifHead}><strong>Pengumuman Terbaru</strong><button type="button" aria-label="Muat ulang pengumuman" onClick={() => void load()}>↻</button></div>
      <div className={styles.notifBody}>
        {loading && <div className={styles.notifState}>Memuat pengumuman…</div>}
        {!loading && error && <div className={styles.notifState} role="alert"><span>{error}</span><button type="button" onClick={() => void load()}>Coba lagi</button></div>}
        {!loading && !error && items.length === 0 && <div className={styles.notifState}>Belum ada pengumuman.</div>}
        {!loading && !error && groups.map((group) => <section className={styles.notifGroup} key={group.type}>
          <h3>{group.title}</h3>
          {grouped[group.type].length === 0 ? <p className={styles.notifNone}>Belum ada {group.title.toLowerCase()}.</p> : grouped[group.type].map((item) => {
            const subject = typeof item.pelajaran === "string" ? item.pelajaran : item.pelajaran?.nama;
            return <Link className={styles.notifItem} key={`${item.jenis}-${item.id}`} href={target(item)} onClick={close}>
              <span className={`${styles.notifIcon} ${styles[`notifIcon_${item.jenis}`]}`} aria-hidden="true">{group.icon}</span>
              <span className={styles.notifText}><strong>{item.judul}</strong><small>{subject || "Pelajaran"} · {waktuRelatif(item.created_at)}</small></span>
            </Link>;
          })}
        </section>)}
      </div>
      <footer className={styles.notifFooter}><Link href="/siswa/pengumuman" onClick={close}>Lihat semua pengumuman</Link><button type="button" disabled={!items.some((item) => !item.dilihat)} onClick={() => void markRead()}>Tandai sudah dibaca</button></footer>
    </section>}
  </div>;
}
