"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser } from "@/lib/api";
import { downloadMateriSiswa, getDashboardSiswa, getProfilSiswa, type DashboardSiswa, type MateriSiswa } from "@/lib/siswa";
import { Badge, Card, EmptyState, PageHeader, Skeleton, useToast } from "../components";
import { WAVE } from "@/lib/role";
import styles from "./page.module.css";

function pelajaranName(value: string | { nama?: string }) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
}
function tanggal(value?: string) {
  if (!value) return "Jadwal belum ditentukan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Jadwal belum ditentukan" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function semesterText(date: Date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const ganjil = month >= 6;
  const start = ganjil ? year : year - 1;
  return "Semester " + (ganjil ? "Ganjil " : "Genap ") + start + "/" + (start + 1);
}
function dueClass(value: string | undefined, now: number) {
  if (!value) return "";
  const remaining = new Date(value).getTime() - now;
  return remaining < 24 * 60 * 60 * 1000 ? styles.dueUrgent : "";
}
function fileIcon(value: string) {
  const ext = value.split(".").pop()?.toLowerCase();
  return ext === "pdf" ? "PDF" : ext === "ppt" || ext === "pptx" ? "PPT" : ext === "doc" || ext === "docx" ? "DOC" : ext === "xls" || ext === "xlsx" ? "XLS" : "FILE";
}

export default function DashboardSiswaPage() {
  const [data, setData] = useState<DashboardSiswa | null>(null);
  const [name, setName] = useState("Siswa");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ item: MateriSiswa; url?: string; text?: string; blob: Blob; filename: string; kind: "pdf" | "image" | "text" | "none" } | null>(null);
  const [now, setNow] = useState(0);
  const showToast = useToast();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboardSiswa();
      setData(result);
    } catch (reason) {
      setData({ asesmen: [], tugas: [], materi: [] } as unknown as DashboardSiswa);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    const firstTick = window.setTimeout(() => {
      if (active) setNow(Date.now());
    }, 0);
    const clock = window.setInterval(() => {
      if (active) setNow(Date.now());
    }, 30000);
    void Promise.resolve().then(() => {
      if (!active) return;
      setName(getUser()?.nama || "Siswa");
      setSemester(semesterText(new Date()));
      void getProfilSiswa().then((profile) => {
        if (active) setName(profile.nama);
      }).catch(() => undefined);
      void load();
    });
    return () => {
      active = false;
      window.clearTimeout(firstTick);
      window.clearInterval(clock);
    };
  }, []);

  async function download(id: number, title: string) {
    setDownloading(id);
    try {
      const file = await downloadMateriSiswa(id, title);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.filename || title;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Materi berhasil diunduh.");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Materi gagal diunduh.", "error");
    } finally {
      setDownloading(null);
    }
  }

  async function view(item: MateriSiswa) {
    setViewing(item.id);
    try {
      const count = Math.max(1, item.files?.length || 1);
      const index = count === 1 ? 0 : Number(window.prompt(`Pilih nomor file (1-${count})`, "1")) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= count) return;
      const file = await downloadMateriSiswa(item.id, item.files?.[index]?.nama || item.nama_file, index);
      const filename = file.filename || item.nama_file;
      const type = file.blob.type || "";
      if (type === "application/pdf") setPreview({ item, kind: "pdf", url: URL.createObjectURL(file.blob), blob: file.blob, filename });
      else if (type.startsWith("image/")) setPreview({ item, kind: "image", url: URL.createObjectURL(file.blob), blob: file.blob, filename });
      else {
        const text = file.blob.size < 200000 && (type === "" || type === "application/octet-stream" || type.startsWith("text/")) ? await file.blob.text().catch(() => "") : "";
        if (text.startsWith("=== DOKUMEN MATERI E-CLASS")) setPreview({ item, kind: "text", text, blob: file.blob, filename });
        else setPreview({ item, kind: "none", blob: file.blob, filename });
      }
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Materi gagal dibuka.", "error");
    } finally { setViewing(null); }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  function savePreview() {
    if (!preview) return;
    const url = URL.createObjectURL(preview.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = preview.filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className={styles.page}>
    <PageHeader title="Dashboard" subtitle="Ringkasan materi, tugas, dan asesmen pembelajaran Anda."/>
    <section className={styles.welcome}><div><h2>Selamat datang, {name}! {WAVE}</h2><p>{semester} sedang berjalan. Terus semangat belajarnya!</p></div><div className={styles.bannerDate} aria-hidden="true"><small>{new Date().toLocaleDateString("id-ID", { weekday: "long" })}</small><strong>{new Date().getDate()}</strong><span>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span></div></section>
    {error ? <Card><EmptyState title="Belum ada tugas mendatang"/></Card> : loading || !data ? <div className={styles.loading}><Skeleton/><Skeleton/><Skeleton className={styles.loadingPanel}/></div> : <>
      <div className={styles.splitRow}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>Asesmen Terbaru</h2><Link href="/siswa/asesmen">Lihat Semua</Link></div>
        <Card className={styles.listCard}>{data.asesmen.length ? data.asesmen.map((item) => <Link className={styles.row} href={"/siswa/asesmen/" + item.id} key={item.id}>
          <span className={styles.itemIcon + " " + styles.assessmentIcon}>✎</span><span className={styles.rowText}><strong>{item.judul}</strong><small>{pelajaranName(item.pelajaran)}{" · Oleh: "}{item.guru || "Pengajar"}{" · "}{tanggal(item.jadwal_mulai)}</small></span>
          <Badge variant={item.status === "selesai" ? "success" : "danger"}>{item.status === "selesai" ? "SELESAI" : "BELUM DIKERJAKAN"}</Badge><span className={styles.chevron} aria-hidden="true">›</span>
        </Link>) : <EmptyState title="Belum ada asesmen mendatang" description="Asesmen dari guru akan muncul di sini."/>}</Card>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>Tugas Terbaru</h2><Link href="/siswa/tugas">Lihat Semua</Link></div>
        <Card className={styles.listCard}>{data.tugas.length ? data.tugas.map((item) => {
          const overdue = item.status === "terlambat" || (item.status === "belum" && !!item.tenggat && new Date(item.tenggat).getTime() < now);
          const done = item.status === "dikumpulkan" || item.status === "dinilai" || item.status === "selesai";
          return <Link className={styles.row} href={"/siswa/tugas/" + item.id} key={item.id}>
            <span className={styles.itemIcon + " " + styles.taskIcon}>✓</span><span className={styles.rowText}><strong>{item.judul}</strong><small>Oleh: {typeof item.guru === "string" ? item.guru : item.guru?.nama || "Pengajar"}</small><small className={dueClass(item.tenggat, now)}>Tenggat: {tanggal(item.tenggat)} · Progres {item.progres ?? (done ? 100 : 0)}%</small></span>
            <Badge variant={overdue ? "danger" : done ? "success" : "info"}>{overdue ? "TERLAMBAT" : done ? "SELESAI" : "PROSES"}</Badge><span className={styles.chevron} aria-hidden="true">›</span>
          </Link>;
        }) : <EmptyState title="Belum ada tugas mendatang" description="Tugas dari guru akan muncul di sini."/>}</Card>
      </section>
      </div>
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>Materi Terbaru</h2><Link href="/siswa/materi">Lihat Semua</Link></div>
        <Card className={styles.materialList}>{data.materi.length ? data.materi.map((item) => <div className={styles.materialRow} key={item.id}>
          <span className={styles.fileType}>{fileIcon(item.nama_file)}</span><span className={styles.rowText}><strong>{item.judul}</strong><small><Badge>{pelajaranName(item.pelajaran)}</Badge>{item.guru && <span>Oleh: {item.guru}</span>}<span>Diunggah: {tanggal(item.created_at)}</span></small></span>
          <div className={styles.materialActions}>
            <button type="button" className={styles.viewButton} disabled={viewing === item.id} onClick={() => void view(item)}>{viewing === item.id ? "Membuka…" : "Lihat Materi"}</button>
            <button type="button" className={styles.downloadButton} disabled={downloading === item.id} onClick={() => void download(item.id, item.nama_file)}>{downloading === item.id ? "Mengunduh…" : "Unduh Materi"}</button>
          </div>
        </div>) : <EmptyState title="Belum ada materi terbaru"/>}</Card>
      </section>
    </>}
    {preview && <div className={styles.viewerOverlay} onClick={closePreview}>
      <section className={styles.viewer} role="dialog" aria-modal="true" aria-label={`Materi ${preview.item.judul}`} onClick={(event) => event.stopPropagation()}>
        <header className={styles.viewerHead}><strong>{preview.item.judul}</strong><button type="button" onClick={savePreview}>Unduh</button><button type="button" className={styles.viewerClose} aria-label="Tutup" onClick={closePreview}>×</button></header>
        <div className={styles.viewerBody}>
          {preview.kind === "pdf" && preview.url ? <iframe src={preview.url} title={preview.item.judul}/> : preview.kind === "image" && preview.url ? <img src={preview.url} alt={preview.item.judul}/> : preview.kind === "text" ? <pre>{preview.text}</pre> : <p>Format file ini belum bisa ditampilkan di halaman. Silakan unduh untuk membukanya.</p>}
        </div>
      </section>
    </div>}
  </div>;
}
