"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listPelajaranSiswa, listTugasSiswa, type PelajaranSiswa, type TugasSiswa } from "@/lib/siswa";
import { Badge, Card, Dropdown, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton } from "../components";
import styles from "./page.module.css";

function subject(value: TugasSiswa["pelajaran"]) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tasks, setTasks] = useState<TugasSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");

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

  useEffect(() => { void loadLessons(); }, [loadLessons]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const options = [{ value: "", label: "Semua Pelajaran" }, ...lessons.map((lesson) => ({ value: String(lesson.id), label: lesson.nama }))];
  return <div className={styles.page}>
    <PageHeader title="Tugas Pembelajaran" subtitle="Lihat tenggat dan status pengumpulan tugas Anda."/>
    <div className={styles.toolbar}><SearchInput value={search} onChange={setSearch} placeholder="Cari tugas..."/><Dropdown options={options} value={lessonId} onChange={setLessonId} placeholder="Pilih Pelajaran" label="Pilih pelajaran"/></div>
    {error || lessonError ? <Card><ErrorState message={[lessonError, error].filter(Boolean).join(" ")} onRetry={() => { void loadLessons(); void loadTasks(); }}/></Card> : loading || loadingLessons ? <div className={styles.grid}>{[0,1,2].map((key) => <Card className={styles.skeletonCard} key={key}><Skeleton/><Skeleton/><Skeleton/></Card>)}</div> : tasks.length === 0 ? <Card><EmptyState title="Belum ada tugas" description="Tugas dari guru akan muncul di sini."/></Card> : <div className={styles.grid}>{tasks.map((task) => {
      const isSubmitted = submitted(task);
      const isOverdue = !isSubmitted && (task.status === "terlambat" || Boolean(task.tenggat && new Date(task.tenggat).getTime() < Date.now()));
      const score = task.pengumpulan?.nilai ?? task.nilai;
      return <Card key={task.id} className={[styles.taskCard, styles["subject_" + (task.pelajaran && typeof task.pelajaran !== "string" ? task.pelajaran.id % 6 : 0)]].join(" ")}>
        <Badge>{subject(task.pelajaran)}</Badge><h2>{task.judul}</h2>
        <p className={isOverdue ? styles.overdue : styles.due}>Tenggat: {dateTime(task.tenggat)}</p>
        <div className={styles.cardFooter}>{isSubmitted ? <><span className={styles.doneText}><Badge variant="success">SELESAI</Badge>{score !== undefined && <strong>Nilai: {score}</strong>}</span><button type="button" className={styles.doneButton} disabled>Selesai</button></> : <><Badge variant={isOverdue ? "danger" : "info"}>{isOverdue ? "TERLAMBAT" : "PROSES"}</Badge><Link className={styles.startButton} href={"/siswa/tugas/" + task.id}>{isOverdue ? "Kumpulkan Tugas" : "Kerjakan Sekarang"} <span aria-hidden="true">→</span></Link></>}</div>
      </Card>;
    })}</div>}
  </div>;
}
