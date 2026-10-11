"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { listAsesmenSiswa, listPelajaranSiswa, type AsesmenSiswa, type PelajaranSiswa } from "@/lib/siswa";
import { Badge, Card, Dropdown, EmptyState, ErrorState, Modal, PageHeader, SearchInput, Skeleton } from "../components";
import styles from "./page.module.css";

function subject(value: AsesmenSiswa["pelajaran"]) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
}
function dateTime(value?: string) {
  if (!value) return "Jadwal belum ditentukan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Jadwal belum ditentukan" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function colorAt(index: number) {
  const palette = ["#ef4444", "#14b8a6", "#a855f7", "#f97316", "#3b82f6", "#ec4899", "#22c55e", "#f59e0b"];
  return palette[index % palette.length];
}

export default function AsesmenSiswaPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<PelajaranSiswa[]>([]);
  const [items, setItems] = useState<AsesmenSiswa[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AsesmenSiswa | null>(null);
  const [lessonsFailed, setLessonsFailed] = useState(false);

  useEffect(() => {
    void listPelajaranSiswa().then(setLessons).catch(() => setLessonsFailed(true));
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listAsesmenSiswa({ search: debouncedSearch, pelajaran_id: lessonId ? Number(lessonId) : undefined, tipe: type ? type as AsesmenSiswa["tipe"] : undefined });
      setItems(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Daftar asesmen gagal dimuat.");
      setItems([]);
    } finally { setLoading(false); }
  }, [debouncedSearch, lessonId, type]);
  useEffect(() => { void load(); }, [load]);

  const lessonOptions = useMemo(() => [{ value: "", label: "Semua Pelajaran" }, ...lessons.map((item) => ({ value: String(item.id), label: item.nama }))], [lessons]);
  const typeOptions = [{ value: "", label: "Semua Asesmen" }, { value: "ujian_harian", label: "Ujian Harian" }, { value: "kuis", label: "Kuis" }];
  function begin() {
    if (!selected) return;
    const id = selected.id;
    setSelected(null);
    router.push("/siswa/asesmen/" + encodeURIComponent(String(id)));
  }

  return <div className={styles.page}>
    <PageHeader title="Asesmen Pembelajaran" subtitle="Kerjakan dan kerjakan evaluasi pembelajaran Anda di sini."/>
    <div className={styles.toolbar}><SearchInput value={search} onChange={setSearch} placeholder="Cari asesmen..."/><Dropdown options={lessonOptions} value={lessonId} onChange={setLessonId} placeholder="Pilih Pelajaran" label="Pilih pelajaran"/><Dropdown options={typeOptions} value={type} onChange={setType} placeholder="Pilih Asesmen" label="Pilih jenis asesmen"/></div>
    {lessonsFailed && <p className={styles.filterWarning}>Daftar pelajaran tidak tersedia. Filter pelajaran belum dapat digunakan.</p>}
    {error ? <Card><ErrorState message={error} onRetry={() => void load()}/></Card> : loading ? <div className={styles.grid}>{[0,1,2].map((key) => <Card className={styles.skeletonCard} key={key}><Skeleton/><Skeleton/><Skeleton/></Card>)}</div> : items.length === 0 ? <Card><EmptyState title="Asesmen tidak ditemukan" description="Coba ubah kata pencarian atau filter asesmen."/></Card> : <div className={styles.grid}>{items.map((item, index) => {
      const subjectName = subject(item.pelajaran);
      const locked = item.status === "terkunci" || item.status === "berakhir";
      const done = item.status === "selesai";
      const style = { "--siswa-subject-color": colorAt(index) } as CSSProperties;
      return <Card key={item.id} className={[styles.assessmentCard, locked ? styles.locked : ""].join(" ")} style={style}>
        <div className={styles.meta}><Badge variant={item.tipe === "kuis" ? "danger" : "info"}>{item.tipe === "kuis" ? "KUIS" : "UJIAN HARIAN"}</Badge><Badge>{subjectName}</Badge></div>
        <h2>{item.judul}</h2><p className={styles.description}>{item.deskripsi || "Evaluasi pembelajaran untuk mengukur pemahaman Anda."}</p>
        <div className={styles.duration}><span aria-hidden="true">◷</span>{item.durasi_menit ? item.durasi_menit + " menit" : "Durasi belum ditentukan"}</div>
        <div className={styles.cardFooter}>
          {done ? <div className={styles.score}><Badge variant="success">SELESAI</Badge><strong>Nilai: {item.nilai ?? "—"}/{item.nilai_maks ?? 100}</strong></div> :
           locked ? <><div className={styles.lockedText}><span aria-hidden="true">🔒</span><span>Terkunci hingga {dateTime(item.jadwal_mulai || item.jadwal_selesai)}</span></div><button type="button" className={styles.lockedButton} disabled>Belum Dimulai</button></> :
           <button type="button" className={styles.startButton} onClick={() => setSelected(item)}>Kerjakan Sekarang <span aria-hidden="true">→</span></button>}
        </div>
      </Card>;
    })}</div>}
    <Modal open={selected !== null} onClose={() => setSelected(null)} title="Mulai asesmen" footer={<><button type="button" className={styles.cancel} onClick={() => setSelected(null)}>Batal</button><button type="button" className={styles.confirm} onClick={begin}>Mulai sekarang</button></>}>
      <p className={styles.confirmText}>Apakah Anda siap mengerjakan <strong>{selected?.judul}</strong>? Pastikan Anda memiliki waktu yang cukup sebelum memulai.</p>
    </Modal>
  </div>;
}
