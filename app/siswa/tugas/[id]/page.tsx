"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { downloadTugasLampiranSiswa, getDetailTugasSiswa, kumpulkanTugasSiswa, type DetailTugasSiswa } from "@/lib/siswa";
import { Badge, Card, EmptyState, ErrorState, FileDropzone, Skeleton, useToast } from "../../components";
import styles from "./page.module.css";

function subject(value: DetailTugasSiswa["pelajaran"]) {
  return typeof value === "string" ? value : value?.nama || "Pelajaran";
}
function named(value: string | { nama?: string } | undefined) {
  return typeof value === "string" ? value : value?.nama || "Pengajar";
}
function classNameOf(value: DetailTugasSiswa["kelas"]) {
  return typeof value === "string" ? value : value?.nama || "-";
}
function formatDate(value?: string) {
  if (!value) return "Belum ditentukan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Belum ditentukan" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function formatSize(value: number) {
  return value < 1024 * 1024 ? (value / 1024).toFixed(0) + " KB" : (value / 1024 / 1024).toFixed(1) + " MB";
}

export default function DetailTugasSiswaPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const showToast = useToast();
  const [task, setTask] = useState<DetailTugasSiswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) { setError("ID tugas tidak valid."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const result = await getDetailTugasSiswa(id);
      setTask(result);
      setNote(result.pengumpulan?.catatan || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Detail tugas gagal dimuat.");
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const dueDate = task?.tenggat ? new Date(task.tenggat).getTime() : 0;
  const hasSubmission = Boolean(task?.pengumpulan || ["dikumpulkan", "dinilai", "selesai"].includes(task?.status || ""));
  const locked = hasSubmission && dueDate > 0 && dueDate <= Date.now();
  const teacher = named(task?.guru);
  const classLabel = classNameOf(task?.kelas);

  async function submit() {
    if (!task || !file || sending) return;
    setSending(true);
    setProgress(0);
    try {
      await kumpulkanTugasSiswa(id, file, note, setProgress);
      showToast("Tugas berhasil dikumpulkan.");
      router.push("/siswa/tugas");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Tugas gagal dikumpulkan.", "error");
      setSending(false);
    }
  }

  async function downloadAttachment() {
    if (!task?.lampiran?.url) return;
    try {
      const result = await downloadTugasLampiranSiswa(id, task.lampiran.url, task.lampiran.nama);
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Lampiran gagal diunduh.", "error");
    }
  }

  if (loading) return <div className={styles.loading}><Skeleton/><Card><Skeleton/><Skeleton/><Skeleton/><Skeleton/></Card><Card><Skeleton/><Skeleton/></Card></div>;
  if (error) return <Card><ErrorState message={error} onRetry={() => void load()}/></Card>;
  if (!task) return <Card><EmptyState title="Tugas tidak ditemukan"/></Card>;

  return <div className={styles.page}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/siswa/tugas">Tugas Pembelajaran</Link><span>›</span><span>{subject(task.pelajaran)}</span><span>›</span><span>{task.judul}</span></nav>
    <header className={styles.taskHeader}>
      <div className={styles.taskHeaderMain}><div className={styles.headerBadges}><Badge variant="info">TUGAS INDIVIDU</Badge><span className={styles.due}>{task.tenggat ? "Tenggat: " + formatDate(task.tenggat) : "Tanpa tenggat"}</span></div>
        <h1>{task.judul}</h1><p>Oleh: {teacher} <span>•</span> {subject(task.pelajaran)} <span>•</span> {classLabel}</p></div>
      <div className={styles.weight}>Bobot Nilai<strong>{task.bobot ?? 0}%</strong></div>
    </header>

    <Card className={styles.instructionCard}>
      <h2><span aria-hidden="true">ⓘ</span>Instruksi Tugas</h2>
      <div className={styles.instructions}>{task.instruksi || task.deskripsi || "Tidak ada instruksi tambahan dari pengajar."}</div>
      {task.kriteria && task.kriteria.length > 0 && <div className={styles.criteria}><strong>Kriteria Penilaian:</strong><ul>{task.kriteria.map((criterion, index) => <li key={index}>{criterion}</li>)}</ul></div>}
      <div className={styles.infoBox}><span aria-hidden="true">ⓘ</span><span>Kumpulkan dalam format .zip, .rar, atau .pdf. Ukuran file maksimal 10 MB.</span></div>
      {task.lampiran?.url && <button type="button" className={styles.attachment} onClick={() => void downloadAttachment()}><span aria-hidden="true">↓</span> Unduh lampiran pengajar{task.lampiran.nama ? ": " + task.lampiran.nama : ""}</button>}
    </Card>

    <Card className={styles.submitCard}>
      <h2><span aria-hidden="true">⇧</span>Area Pengumpulan</h2>
      {hasSubmission && !editing ? <div className={styles.submitted}>
        <div className={styles.submittedStatus}><Badge variant="success">SUDAH DIKUMPULKAN</Badge><span>{formatDate(task.pengumpulan?.dikumpulkan_at)}</span></div>
        <p><strong>File:</strong> {task.pengumpulan?.nama_file || "File terkumpul"}</p>
        {task.pengumpulan?.nilai !== undefined && <p><strong>Nilai:</strong> {task.pengumpulan.nilai}</p>}
        {task.pengumpulan?.komentar && <p><strong>Komentar pengajar:</strong> {task.pengumpulan.komentar}</p>}
        {task.pengumpulan?.catatan && <p><strong>Catatan Anda:</strong> {task.pengumpulan.catatan}</p>}
        {!locked && <button type="button" className={styles.replaceButton} onClick={() => { setFile(null); setEditing(true); }}>Ganti File</button>}
      </div> : <>
        <label className={styles.fieldLabel}>File Tugas <span>*</span></label>
        <FileDropzone accept=".zip,.rar,.pdf" maxSizeMB={10} onFile={setFile} file={file}/>
        {file && <div className={styles.fileChip}><span>▧</span><span><strong>{file.name}</strong><small>{formatSize(file.size)}</small></span><button type="button" aria-label="Hapus file terpilih" onClick={() => setFile(null)}>×</button></div>}
        <p className={styles.fileHint}>Format yang diizinkan: .zip, .rar, .pdf (Maks: 10 MB)</p>
        <label className={styles.fieldLabel} htmlFor="teacher-note">Catatan untuk Pengajar (Opsional)</label>
        <textarea id="teacher-note" className={styles.note} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Tambahkan pesan atau penjelasan mengenai tugas yang dikumpulkan..."/>
        <div className={styles.noteCount}>{note.length}/500</div>
        {sending && <div className={styles.progress}><span style={{ width: progress + "%" }}/><small>Mengunggah {progress}%</small></div>}
        <div className={styles.formActions}><button type="button" className={styles.cancel} disabled={sending} onClick={() => router.push("/siswa/tugas")}>Batal</button><button type="button" className={styles.submit} disabled={!file || sending} onClick={() => void submit()}>{sending ? "Mengumpulkan…" : "Kumpulkan Tugas"}</button></div>
      </>}
    </Card>
  </div>;
}
