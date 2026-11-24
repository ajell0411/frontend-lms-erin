"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { downloadTugasLampiranSiswa, getDetailTugasSiswa, kumpulkanTugasSiswa, type DetailTugasSiswa } from "@/lib/siswa";
import { FilePreview } from "@/app/guru/ui";
import { Badge, Card, EmptyState, ErrorState, MultiFileDropzone, Skeleton, useToast } from "../../components";
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
export default function DetailTugasSiswaPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const showToast = useToast();
  const [task, setTask] = useState<DetailTugasSiswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [now, setNow] = useState(0);
  const [preview, setPreview] = useState<{ judul: string; blob: Blob; filename: string } | null>(null);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) { setError("ID tugas tidak valid."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const result = await getDetailTugasSiswa(id);
      setTask(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Detail tugas gagal dimuat.");
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const clock = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(clock);
    };
  }, []);

  const dueDate = task?.tenggat ? new Date(task.tenggat).getTime() : 0;
  const hasSubmission = Boolean(task?.pengumpulan || ["dikumpulkan", "dinilai", "selesai"].includes(task?.status || ""));
  const isOverdue = !hasSubmission && Boolean(task && (task.status === "terlambat" || (dueDate > 0 && now > 0 && dueDate <= now)));
  const locked = dueDate > 0 && now > 0 && dueDate <= now;
  const teacher = named(task?.guru);
  const classLabel = classNameOf(task?.kelas);

  async function submit() {
    if (!task || isOverdue || !files.length || sending) return;
    setSending(true);
    setProgress(0);
    try {
      await kumpulkanTugasSiswa(id, files, setProgress);
      showToast("Tugas berhasil dikumpulkan.");
      router.push("/siswa/tugas");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Tugas gagal dikumpulkan.", "error");
      setSending(false);
    }
  }

  async function downloadAttachment(index = 0) {
    const attachments = task?.lampiran_files?.length ? task.lampiran_files : task?.lampiran ? [task.lampiran] : [];
    const attachment = attachments[index];
    if (!attachment?.url) return;
    try {
      const result = await downloadTugasLampiranSiswa(id, attachment.url, attachment.nama, index);
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

  async function viewAttachment(index = 0) {
    const attachments = task?.lampiran_files?.length ? task.lampiran_files : task?.lampiran ? [task.lampiran] : [];
    const attachment = attachments[index];
    if (!attachment?.url) return;
    try {
      const result = await downloadTugasLampiranSiswa(id, attachment.url, attachment.nama, index);
      setPreview({ judul: attachment.nama || task?.judul || "Lampiran tugas", blob: result.blob, filename: result.filename || attachment.nama || "lampiran" });
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Lampiran gagal dibuka.", "error");
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
      <div className={styles.infoBox}><span aria-hidden="true">ⓘ</span><span>Kumpulkan beberapa dokumen sekaligus. Ukuran setiap file maksimal 10 MB.</span></div>
      {(task.lampiran_files?.length ? task.lampiran_files : task.lampiran ? [task.lampiran] : []).map((attachment, index) => <div className={styles.attachmentActions} key={`${attachment.nama}-${index}`}><span className={styles.attachmentName}>{attachment.nama || `Lampiran ${index + 1}`}</span><button type="button" className={styles.attachment} onClick={() => void viewAttachment(index)}>Lihat</button><button type="button" className={styles.attachment} onClick={() => void downloadAttachment(index)}>Unduh</button></div>)}
    </Card>

    <Card className={styles.submitCard}>
      <h2><span aria-hidden="true">⇧</span>Area Pengumpulan</h2>
      {isOverdue ? <div className={styles.overdueNotice} role="status"><strong>Tenggat tugas sudah lewat.</strong><span>Pengumpulan tugas ini sudah ditutup.</span><Link href="/siswa/tugas">Kembali ke daftar tugas</Link></div> : hasSubmission && !editing ? <div className={styles.submitted}>
        <div className={styles.submittedStatus}><Badge variant="success">SUDAH DIKUMPULKAN</Badge><span>{formatDate(task.pengumpulan?.dikumpulkan_at)}</span></div>
        <p><strong>File:</strong> {(task.pengumpulan?.files?.length ? task.pengumpulan.files.join(", ") : task.pengumpulan?.nama_file) || "File terkumpul"}</p>
        {task.pengumpulan?.nilai !== undefined && <p><strong>Nilai:</strong> {task.pengumpulan.nilai}</p>}
        {!locked && <button type="button" className={styles.replaceButton} onClick={() => { setFiles([]); setEditing(true); }}>Ganti File</button>}
      </div> : <>
        <label className={styles.fieldLabel}>File Tugas <span>*</span></label>
        <MultiFileDropzone accept=".zip,.rar,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" maxSizeMB={10} onFiles={setFiles} files={files}/>
        <p className={styles.fileHint}>Pilih beberapa file dokumen sekaligus (maksimal 10 MB per file).</p>
        {sending && <div className={styles.progress}><span style={{ width: progress + "%" }}/><small>Mengunggah {progress}%</small></div>}
        <div className={styles.formActions}><button type="button" className={styles.cancel} disabled={sending} onClick={() => router.push("/siswa/tugas")}>Batal</button><button type="button" className={styles.submit} disabled={!files.length || sending} onClick={() => void submit()}>{sending ? "Mengumpulkan…" : "Kumpulkan Tugas"}</button></div>
      </>}
    </Card>
    {preview && <FilePreview title={preview.judul} blob={preview.blob} filename={preview.filename} onClose={() => setPreview(null)} />}
  </div>;
}
