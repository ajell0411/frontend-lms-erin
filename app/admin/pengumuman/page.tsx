"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAktivitas } from "@/lib/api";
import type { AktivitasRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

const PAGE_SIZE = 20;
const READ_AT_KEY = "eclass_aktivitas_seen_at";
const READ_EVENT = "eclass-aktivitas-seen";

function relativeTime(value: string, now: number): string {
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return "";
  const seconds = (now - date) / 1000;
  const absoluteSeconds = Math.abs(seconds);
  const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] = absoluteSeconds < 60
    ? [Math.round(seconds), "second"]
    : absoluteSeconds < 3600
      ? [Math.round(seconds / 60), "minute"]
      : absoluteSeconds < 86400
        ? [Math.round(seconds / 3600), "hour"]
        : absoluteSeconds < 2592000
          ? [Math.round(seconds / 86400), "day"]
          : absoluteSeconds < 31536000
            ? [Math.round(seconds / 2592000), "month"]
            : [Math.round(seconds / 31536000), "year"];
  return new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" }).format(-amount, unit);
}

function actionLabel(aksi: AktivitasRecord["aksi"]): string {
  if (aksi === "menambahkan") return "menambahkan";
  if (aksi === "mengubah") return "mengubah";
  return "menghapus";
}

function accountLabel(kind: string): string {
  switch (kind) {
    case "murid":
    case "siswa": return "murid";
    case "guru": return "guru";
    case "admin": return "admin";
    case "admin kurikulum": return "admin kurikulum";
    case "kepala sekolah": return "kepala sekolah";
    default: return kind;
  }
}

function ActivityText({ item }: { item: AktivitasRecord }) {
  const action = actionLabel(item.aksi);
  const kind = item.objek_jenis.toLocaleLowerCase("id-ID");
  if (["kelas", "jurusan", "pelajaran"].includes(kind)) {
    return <><strong>{item.aktor_nama}</strong> telah {action} {kind} <strong>{item.objek_nama}</strong></>;
  }
  return <><strong>{item.aktor_nama}</strong> telah {action} <strong>{item.objek_nama}</strong> sebagai {accountLabel(kind)}</>;
}

export default function PengumumanPage() {
  useRole();
  const [items, setItems] = useState<AktivitasRecord[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const hasMore = items.length >= limit && limit < 100;

  useEffect(() => {
    const openedAt = Date.now();
    void Promise.resolve().then(() => setNow(openedAt));
    try {
      localStorage.setItem(READ_AT_KEY, String(openedAt));
    } catch {
      // Penyimpanan browser bisa tidak tersedia.
    }
    window.dispatchEvent(new CustomEvent(READ_EVENT, { detail: openedAt }));

    let active = true;
    void listAktivitas(PAGE_SIZE).then((rows) => {
      if (active) setItems(rows);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Aktivitas gagal dimuat.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function loadMore() {
    const nextLimit = Math.min(limit + PAGE_SIZE, 100);
    setLoadingMore(true);
    setError("");
    try {
      setItems(await listAktivitas(nextLimit));
      setLimit(nextLimit);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aktivitas gagal dimuat.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/admin/dashboard" className={styles.backLink}><span aria-hidden="true">‹</span> Kembali ke Dashboard</Link>
      <header className={styles.heading}><h1 className={styles.title}>Pengumuman</h1><p className={styles.subtitle}>Update terbaru dari aktivitas di sistem. Informasi penting dan perubahan terkini untuk staf.</p></header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? <p className={styles.state}>Memuat aktivitas...</p> : items.length === 0 ? <p className={styles.state}>Belum ada aktivitas terbaru.</p> : (
        <section className={styles.feed} aria-label="Aktivitas terbaru">
          {items.map((item) => <article className={styles.item} key={item.id}>
            <span className={styles.checkIcon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8" /></svg></span>
            <div className={styles.text}><p className={styles.itemTitle}><ActivityText item={item} /></p><p className={styles.time}>{relativeTime(item.created_at, now)}</p></div>
          </article>)}
        </section>
      )}
      {hasMore && <button type="button" className={styles.loadMore} disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Memuat..." : "Muat lebih banyak"}</button>}
    </div>
  );
}