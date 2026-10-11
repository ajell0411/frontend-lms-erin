"use client";

import { useCallback, useEffect, useState } from "react";
import { downloadMateriSiswa, listMateriSiswa, listPelajaranSiswa, type MateriSiswa, type PelajaranSiswa } from "@/lib/siswa";
import { Badge, Card, Dropdown, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton, useToast } from "../components";
import styles from "./page.module.css";

function subject(value: MateriSiswa["pelajaran"]) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
}
function extension(material: MateriSiswa) {
  return (material.ekstensi || material.nama_file.split(".").pop() || "FILE").replace(".", "").toUpperCase();
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Tanggal tidak tersedia" : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function MateriSiswaPage() {
  const [lessons, setLessons] = useState<PelajaranSiswa[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [materials, setMaterials] = useState<MateriSiswa[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");
  const [downloadId, setDownloadId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const showToast = useToast();

  const loadLessons = useCallback(async () => {
    setLoadingLessons(true);
    try { setLessons(await listPelajaranSiswa()); setLessonError(""); }
    catch (reason) { setLessonError(reason instanceof Error ? reason.message : "Daftar pelajaran gagal dimuat."); }
    finally { setLoadingLessons(false); }
  }, []);
  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    setError("");
    try {
      const rows = await listMateriSiswa({ search: debouncedSearch, pelajaran_id: lessonId ? Number(lessonId) : undefined });
      setMaterials(rows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Materi gagal dimuat.");
      setMaterials([]);
    } finally { setLoadingMaterials(false); }
  }, [debouncedSearch, lessonId]);

  useEffect(() => { void loadLessons(); }, [loadLessons]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { void loadMaterials(); }, [loadMaterials]);

  async function download(item: MateriSiswa) {
    setDownloadId(item.id);
    try {
      const result = await downloadMateriSiswa(item.id, item.nama_file);
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename || item.nama_file;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Materi berhasil diunduh.");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Materi gagal diunduh.", "error");
    } finally { setDownloadId(null); }
  }

  const [preview, setPreview] = useState<{ item: MateriSiswa; kind: "pdf" | "image" | "text" | "none"; url?: string; text?: string; blob: Blob; filename: string } | null>(null);

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);
  useEffect(() => {
    if (!preview) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closePreview(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview, closePreview]);

  function saveFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function view(item: MateriSiswa) {
    setViewId(item.id);
    try {
      const result = await downloadMateriSiswa(item.id, item.nama_file);
      const filename = result.filename || item.nama_file;
      const blob = result.blob;
      const type = blob.type || "";
      if (type === "application/pdf") {
        setPreview({ item, kind: "pdf", url: URL.createObjectURL(blob), blob, filename });
      } else if (type.startsWith("image/")) {
        setPreview({ item, kind: "image", url: URL.createObjectURL(blob), blob, filename });
      } else {
        let text = "";
        if (blob.size < 200000 && (type === "" || type === "application/octet-stream" || type.startsWith("text/"))) {
          text = await blob.text().catch(() => "");
        }
        if (text.startsWith("=== DOKUMEN MATERI E-CLASS")) setPreview({ item, kind: "text", text, blob, filename });
        else setPreview({ item, kind: "none", blob, filename });
      }
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Materi gagal dibuka.", "error");
    } finally { setViewId(null); }
  }
  const options = [{ value: "", label: "Semua Pelajaran" }, ...lessons.map((item) => ({ value: String(item.id), label: item.nama }))];
  return <div className={styles.page}>
    <PageHeader title="Materi Pembelajaran" subtitle="Cari dan unduh materi pembelajaran dari guru Anda."/>
    <div className={styles.toolbar}><SearchInput value={search} onChange={setSearch} placeholder="Cari materi pembelajaran..."/><Dropdown options={options} value={lessonId} onChange={setLessonId} placeholder="Pilih Pelajaran" label="Pilih pelajaran"/></div>
    {error || lessonError ? <Card><ErrorState message={[lessonError, error].filter(Boolean).join(" ")} onRetry={() => { void loadLessons(); void loadMaterials(); }}/></Card> : loadingMaterials || loadingLessons ? <div className={styles.grid}>{[0,1,2].map((key) => <Card className={styles.skeletonCard} key={key}><Skeleton/><Skeleton/><Skeleton/></Card>)}</div> : materials.length === 0 ? <Card><EmptyState title="Materi tidak ditemukan" description="Coba ubah kata pencarian atau pilih pelajaran lain."/></Card> : <div className={styles.grid}>{materials.map((item) => <Card className={styles.materialCard} key={item.id}>
      <div className={styles.cardTitle}><span className={styles.fileIcon} data-ext={extension(item)}>{extension(item).slice(0, 4)}</span><strong>{item.judul}</strong></div>
      <Badge>{subject(item.pelajaran)}</Badge>
      <p className={styles.uploaded}>▢ Diunggah: {formatDate(item.created_at)}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.view} disabled={viewId === item.id} onClick={() => void view(item)}>{viewId === item.id ? "Membuka..." : "Lihat Materi"}</button>
        <button type="button" className={styles.download} disabled={downloadId === item.id} onClick={() => void download(item)}><span aria-hidden="true">{"\u2193"}</span>{downloadId === item.id ? "Mengunduh..." : "Unduh"}</button>
      </div>
    </Card>)}</div>}
    {preview && <div className={styles.viewerOverlay} onClick={closePreview}>
      <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={"Materi " + preview.item.judul} onClick={(event) => event.stopPropagation()}>
        <div className={styles.viewerHead}>
          <strong>{preview.item.judul}</strong>
          <Badge>{subject(preview.item.pelajaran)}</Badge>
          <button type="button" className={styles.view + " " + styles.viewerBtn} onClick={() => saveFile(preview.blob, preview.filename)}>Unduh</button>
          <button type="button" className={styles.viewerClose} aria-label="Tutup" onClick={closePreview}>{"\u00D7"}</button>
        </div>
        <div className={styles.viewerBody}>
          {preview.kind === "pdf" && preview.url ? <iframe src={preview.url} title={preview.item.judul}/> : preview.kind === "image" && preview.url ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={preview.url} alt={preview.item.judul}/>) : preview.kind === "text" ? <pre className={styles.viewerText}>{preview.text}</pre> : <div className={styles.viewerEmpty}><p>Format file ini belum bisa ditampilkan di halaman. Silakan unduh untuk membukanya.</p></div>}
        </div>
      </div>
    </div>}  </div>;
}
