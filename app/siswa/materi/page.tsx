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

  const options = [{ value: "", label: "Semua Pelajaran" }, ...lessons.map((item) => ({ value: String(item.id), label: item.nama }))];
  return <div className={styles.page}>
    <PageHeader title="Materi Pembelajaran" subtitle="Cari dan unduh materi pembelajaran dari guru Anda."/>
    <div className={styles.toolbar}><SearchInput value={search} onChange={setSearch} placeholder="Cari materi pembelajaran..."/><Dropdown options={options} value={lessonId} onChange={setLessonId} placeholder="Pilih Pelajaran" label="Pilih pelajaran"/></div>
    {error || lessonError ? <Card><ErrorState message={[lessonError, error].filter(Boolean).join(" ")} onRetry={() => { void loadLessons(); void loadMaterials(); }}/></Card> : loadingMaterials || loadingLessons ? <div className={styles.grid}>{[0,1,2].map((key) => <Card className={styles.skeletonCard} key={key}><Skeleton/><Skeleton/><Skeleton/></Card>)}</div> : materials.length === 0 ? <Card><EmptyState title="Materi tidak ditemukan" description="Coba ubah kata pencarian atau pilih pelajaran lain."/></Card> : <div className={styles.grid}>{materials.map((item) => <Card className={styles.materialCard} key={item.id}>
      <div className={styles.cardTitle}><span className={styles.fileIcon} data-ext={extension(item)}>{extension(item).slice(0, 4)}</span><strong>{item.judul}</strong></div>
      <Badge>{subject(item.pelajaran)}</Badge>
      <p className={styles.uploaded}>▢ Diunggah: {formatDate(item.created_at)}</p>
      <button type="button" className={styles.download} disabled={downloadId === item.id} onClick={() => void download(item)}><span aria-hidden="true">↓</span>{downloadId === item.id ? "Mengunduh..." : "Unduh Materi"}</button>
    </Card>)}</div>}
  </div>;
}
