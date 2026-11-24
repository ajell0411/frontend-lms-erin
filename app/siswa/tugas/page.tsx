"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { listPelajaranSiswa, listTugasSiswa, type PelajaranSiswa, type TugasSiswa } from "@/lib/siswa";
import { Badge, Card, Dropdown, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton } from "../components";
import styles from "./page.module.css";

type StatusFilter = "semua" | "belum" | "terlambat" | "sudah";

function subject(value: TugasSiswa["pelajaran"]) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
}

function colorAt(index: number) {
  const palette = ["#899477", "#14b8a6", "#a855f7", "#f97316", "#3b82f6", "#ec4899", "#22c55e", "#f59e0b"];
  return palette[index % palette.length];
}

function dateTime(value?: string) {
  if (!value) return "Belum ditentukan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Belum ditentukan" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function submitted(task: TugasSiswa) {
  return task.status === "dikumpulkan" || task.status === "dinilai" || task.status === "selesai" || Boolean(task.pengumpulan);
}

export default function TugasSiswaPage() {
  const [lessons, setLessons] = useState<PelajaranSiswa[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tasks, setTasks] = useState<TugasSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");
  const [now, setNow] = useState(0);

  const loadLessons = useCallback(async () => {
    setLoadingLessons(true);
    try { setLessons(await listPelajaranSiswa()); setLessonError(""); }
    catch (reason) { setLessonError(reason instanceof Error ? reason.message : "Daftar pelajaran gagal dimuat."); }
    finally { setLoadingLessons(false); }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setTasks(await listTugasSiswa({ search: debouncedSearch, pelajaran_id: lessonId ? Number(lessonId) : undefined })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Daftar tugas gagal dimuat."); setTasks([]); }
    finally { setLoading(false); }
  }, [debouncedSearch, lessonId]);

  useEffect(() => { void Promise.resolve().then(loadLessons); }, [loadLessons]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { void Promise.resolve().then(loadTasks); }, [loadTasks]);
  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const clock = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(clock);
    };
  }, []);

  const options = [{ value: "", label: "Semua Pelajaran" }, ...lessons.map((lesson) => ({ value: String(lesson.id), label: lesson.nama }))];
  const isOverdue = (task: TugasSiswa) => !submitted(task) && (task.status === "terlambat" || Boolean(task.tenggat && now > 0 && new Date(task.tenggat).getTime() < now));
  const visibleTasks = tasks.filter((task) => {
    if (statusFilter === "terlambat") return isOverdue(task);
    if (statusFilter === "belum") return !submitted(task) && !isOverdue(task);
    if (statusFilter === "sudah") return submitted(task);
    return true;
  });
  const statusOptions = [
    { value: "semua", label: `Semua (${tasks.length})` },
    { value: "belum", label: `Belum dikerjakan (${tasks.filter((task) => !submitted(task) && !isOverdue(task)).length})` },
    { value: "terlambat", label: `Terlambat (${tasks.filter(isOverdue).length})` },
    { value: "sudah", label: `Sudah dikerjakan (${tasks.filter(submitted).length})` },
  ];

  return <div className={styles.page}>
    <PageHeader title="Tugas Pembelajaran" subtitle="Lihat tenggat dan status pengumpulan tugas Anda."/>
    <div className={styles.toolbar}><SearchInput value={search} onChange={setSearch} placeholder="Cari tugas..."/><Dropdown options={options} value={lessonId} onChange={setLessonId} placeholder="Pilih Pelajaran" label="Pilih pelajaran"/><Dropdown options={statusOptions} value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} placeholder="Semua status" label="Filter status tugas"/></div>
    {error || lessonError ? <Card><ErrorState message={[lessonError, error].filter(Boolean).join(" ")} onRetry={() => { void loadLessons(); void loadTasks(); }}/></Card> : loading || loadingLessons ? <div className={styles.grid}>{[0,1,2].map((key) => <Card className={styles.skeletonCard} key={key}><Skeleton/><Skeleton/><Skeleton/></Card>)}</div> : tasks.length === 0 ? <Card><EmptyState title="Belum ada tugas" description="Tugas dari guru akan muncul di sini."/></Card> : visibleTasks.length === 0 ? <Card><EmptyState title={statusFilter === "terlambat" ? "Tidak ada tugas terlambat" : statusFilter === "sudah" ? "Belum ada tugas yang dikerjakan" : "Semua tugas sudah dikerjakan"} description="Coba pilih filter status lain untuk melihat daftar tugas."/></Card> : <div className={styles.grid}>{visibleTasks.map((task, index) => {
      const isSubmitted = submitted(task);
      const overdue = isOverdue(task);
      const score = task.pengumpulan?.nilai ?? task.nilai;
      const style = { "--siswa-subject-color": colorAt(index) } as CSSProperties;
      return <Card key={task.id} className={styles.taskCard} style={style}>
        <div className={styles.meta}><Badge variant={overdue ? "danger" : "info"}>{overdue ? "TERLAMBAT" : "TUGAS"}</Badge><Badge>{subject(task.pelajaran)}</Badge></div>
        <h2>{task.judul}</h2>
        <p className={styles.description}>Oleh: {typeof task.guru === "string" ? task.guru : task.guru?.nama || "Pengajar"}. Kerjakan dan kumpulkan tugas sebelum tenggat berakhir.</p>
        <div className={overdue ? styles.overdue : styles.duration}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Tenggat: {dateTime(task.tenggat)}</div>
        <div className={styles.cardFooter}>{isSubmitted ? <div className={styles.doneText}><Badge variant="success">SELESAI</Badge>{score !== undefined && <strong>Nilai: {score}/100</strong>}</div> : overdue ? <button type="button" className={`${styles.startButton} ${styles.overdueButton}`} disabled aria-disabled="true">Tenggat Terlewat</button> : <Link className={styles.startButton} href={"/siswa/tugas/" + task.id}>Kerjakan Sekarang <span aria-hidden="true">{"\u2192"}</span></Link>}</div>
      </Card>;
    })}</div>}
  </div>;
}
