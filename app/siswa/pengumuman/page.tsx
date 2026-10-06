"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listPengumumanSiswa, type JenisPengumuman, type PengumumanSiswa } from "@/lib/siswa";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components";
import styles from "./page.module.css";

const filters: { value: JenisPengumuman | ""; label: string }[] = [
  { value: "", label: "Semua" }, { value: "materi", label: "Materi" }, { value: "tugas", label: "Tugas" }, { value: "asesmen", label: "Asesmen" },
];
const typeText: Record<JenisPengumuman, string> = { materi: "materi", tugas: "tugas", asesmen: "asesmen" };
const typeIcon: Record<JenisPengumuman, string> = { materi: "▤", tugas: "✓", asesmen: "✎" };

function relative(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return minutes + " menit lalu";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " jam lalu";
  const days = Math.floor(hours / 24);
  return days === 1 ? "Kemarin" : days + " hari lalu";
}
function subjectName(value: PengumumanSiswa["pelajaran"]) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
}
function href(item: PengumumanSiswa) {
  return item.jenis === "materi" ? "/siswa/materi" : "/siswa/" + item.jenis + "/" + encodeURIComponent(String(item.ref_id));
}

export default function PengumumanSiswaPage() {
  const [filter, setFilter] = useState<JenisPengumuman | "">("");
  const [items, setItems] = useState<PengumumanSiswa[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [moreError, setMoreError] = useState("");

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError("");
    setMoreError("");
    setPage(1);
    try {
      const response = await listPengumumanSiswa({ jenis: filter, page: 1, limit: 10 });
      setItems(response.items);
      setHasMore(response.has_more ?? response.items.length === 10);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pengumuman belum dapat dimuat.");
      setItems([]);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void loadFirst(); }, [loadFirst]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    setMoreError("");
    try {
      const response = await listPengumumanSiswa({ jenis: filter, page: next, limit: 10 });
      setItems((current) => [...current, ...response.items]);
      setPage(next);
      setHasMore(response.has_more ?? response.items.length === 10);
    } catch (reason) {
      setMoreError(reason instanceof Error ? reason.message : "Pengumuman berikutnya gagal dimuat.");
    } finally { setLoadingMore(false); }
  }

  return <div className={styles.page}>
    <PageHeader title="Pengumuman" subtitle="Informasi terbaru dari guru tentang materi, tugas, dan asesmen."/>
    <div className={styles.filters} role="group" aria-label="Filter jenis pengumuman">{filters.map((item) => <button type="button" key={item.value || "semua"} aria-pressed={filter === item.value} className={filter === item.value ? styles.selected : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
    {error ? <Card><ErrorState message={error} onRetry={() => void loadFirst()}/></Card> : loading ? <div className={styles.skeletonList}>{[0,1,2,3].map((id) => <Card key={id}><Skeleton/><Skeleton/></Card>)}</div> : items.length === 0 ? <Card><EmptyState title="Belum ada pengumuman" description="Pengumuman baru dari guru akan muncul di sini."/></Card> : <>
      <div className={styles.feed}>{items.map((item) => <Link className={styles.feedLink} href={href(item)} key={String(item.jenis) + "-" + String(item.id)}>
        <Card className={styles.feedCard}>
          <span className={styles.icon + " " + styles["icon_" + item.jenis]} aria-hidden="true">{typeIcon[item.jenis]}</span>
          <span className={styles.feedText}><strong>Guru {item.guru || "Pengajar"} menambahkan {typeText[item.jenis]} {item.judul}</strong><small>{subjectName(item.pelajaran)} <span aria-hidden="true">·</span> {relative(item.created_at)}</small></span>
          {!item.dilihat && <span className={styles.unread} aria-label="Belum dilihat"/>}
          <span className={styles.chevron} aria-hidden="true">›</span>
        </Card>
      </Link>)}</div>
      {moreError && <div className={styles.moreError} role="alert">{moreError}</div>}
      {hasMore && <button type="button" className={styles.moreButton} disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Memuat…" : "Muat lebih banyak"}</button>}
    </>}
  </div>;
}
