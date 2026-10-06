"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDetailAsesmenSiswa, kirimAsesmenSiswa, mulaiAsesmenSiswa, simpanJawabanAsesmenSiswa, type DetailAsesmenSiswa, type HasilKirimAsesmen, type SoalSiswa } from "@/lib/siswa";
import { Badge, Card, EmptyState, ErrorState, Modal, Skeleton } from "../../components";
import styles from "./page.module.css";

function countdown(deadline: string, now: number) {
  const seconds = Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
  return { seconds, text: String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0") };
}
function mathText(text: string) {
  const pieces = text.split(/(\^[A-Za-z0-9+-]+|_[A-Za-z0-9+-]+)/g);
  return pieces.map((piece, index) => piece.startsWith("^")
    ? <sup key={index}>{piece.slice(1)}</sup>
    : piece.startsWith("_") ? <sub key={index}>{piece.slice(1)}</sub> : <span key={index}>{piece}</span>);
}

export default function KerjakanAsesmenPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const storageKey = "eclass-asesmen-jawaban-" + params.id;
  const [assessment, setAssessment] = useState<DetailAsesmenSiswa | null>(null);
  const [deadline, setDeadline] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [doubtful, setDoubtful] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [result, setResult] = useState<HasilKirimAsesmen | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const submitting = useRef(false);
  const saveTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) { setError("ID asesmen tidak valid."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const detail = await getDetailAsesmenSiswa(id);
      setAssessment(detail);
      if (detail.sudah_dikirim || detail.status === "selesai") {
        setAlreadySubmitted(true);
        return;
      }
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (typeof parsed === "object" && parsed !== null) {
            const values = Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
            setAnswers(values);
          }
        }
      } catch { sessionStorage.removeItem(storageKey); }
      const started = await mulaiAsesmenSiswa(id);
      if (started.sudah_dikirim) { setAlreadySubmitted(true); return; }
      setDeadline(started.waktu_selesai || detail.waktu_selesai || "");
      setNow(Date.now());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Asesmen gagal dimuat.");
    } finally { setLoading(false); }
  }, [id, storageKey]);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (automatic: boolean) => {
    if (submitting.current || submitted || alreadySubmitted) return;
    submitting.current = true;
    setSending(true);
    setConfirmOpen(false);
    try {
      const response = await kirimAsesmenSiswa(id, answers);
      setResult(response);
      setSubmitted(true);
      sessionStorage.removeItem(storageKey);
      if (automatic) setError("Waktu habis. Jawaban Anda telah dikirim otomatis.");
    } catch (reason) {
      submitting.current = false;
      setError(reason instanceof Error ? reason.message : "Jawaban gagal dikirim.");
    } finally { setSending(false); }
  }, [alreadySubmitted, answers, id, storageKey, submitted]);

  const remaining = useMemo(() => deadline ? countdown(deadline, now) : null, [deadline, now]);
  useEffect(() => {
    if (!deadline || submitted || alreadySubmitted) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline, submitted, alreadySubmitted]);
  useEffect(() => {
    if (remaining?.seconds === 0 && !loading && !submitted && !alreadySubmitted) void submit(true);
  }, [remaining, loading, submitted, alreadySubmitted, submit]);

  useEffect(() => {
    if (!assessment || !deadline || submitted || alreadySubmitted) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(answers)); } catch { /* Penyimpanan sesi bisa penuh atau tidak tersedia. */ }
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void simpanJawabanAsesmenSiswa(id, answers).catch(() => undefined); }, 900);
    return () => { if (saveTimer.current !== null) window.clearTimeout(saveTimer.current); };
  }, [answers, assessment, deadline, id, storageKey, submitted, alreadySubmitted]);
  useEffect(() => {
    if (!deadline || submitted || alreadySubmitted) return;
    const autosave = window.setInterval(() => { void simpanJawabanAsesmenSiswa(id, answers).catch(() => undefined); }, 30000);
    return () => window.clearInterval(autosave);
  }, [deadline, answers, id, submitted, alreadySubmitted]);
  useEffect(() => {
    if (!deadline || submitted || alreadySubmitted) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [deadline, submitted, alreadySubmitted]);

  const questions = assessment?.soal ?? [];
  const current = questions[index];
  const key = current ? String(current.id) : "";
  const answeredCount = Object.keys(answers).filter((answerId) => questions.some((question) => String(question.id) === answerId)).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const doubtfulCount = doubtful.length;

  const choose = useCallback((question: SoalSiswa, code: string) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [String(question.id)]: code }));
  }, []);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") setIndex((value) => Math.min(value + 1, questions.length - 1));
      else if (event.key === "ArrowLeft") setIndex((value) => Math.max(value - 1, 0));
      else if (/^[a-d]$/i.test(event.key) && current) choose(current, event.key.toUpperCase());
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [choose, current, questions.length]);

  function toggleDoubtful(questionId: number) {
    setDoubtful((currentValue) => currentValue.includes(questionId) ? currentValue.filter((item) => item !== questionId) : [...currentValue, questionId]);
  }

  if (loading) return <div className={styles.loading}><Skeleton/><Card><Skeleton/><Skeleton/><Skeleton/><Skeleton/></Card></div>;
  if (error && !assessment) return <Card><ErrorState message={error} onRetry={() => void load()}/></Card>;
  if (!assessment) return <Card><EmptyState title="Asesmen tidak ditemukan"/></Card>;
  if (alreadySubmitted || submitted) return <div className={styles.resultPage}>
    <Card className={styles.resultCard}><span className={styles.resultIcon} aria-hidden="true">{submitted ? "✓" : "!"}</span><h1>{submitted ? "Asesmen berhasil dikirim" : "Anda sudah mengerjakan asesmen ini"}</h1>
      {error && <p className={styles.resultNote}>{error}</p>}
      {submitted && result?.nilai !== undefined && <p className={styles.resultScore}>Nilai Anda: <strong>{result.nilai}</strong>/{result.nilai_maks ?? assessment.nilai_maks ?? 100}</p>}
      <p>{assessment.judul}</p><Link className={styles.returnButton} href="/siswa/asesmen">Kembali ke Asesmen</Link>
    </Card>
  </div>;
  if (questions.length === 0) return <Card><EmptyState title="Belum ada soal" description="Asesmen ini belum memiliki soal untuk dikerjakan."/></Card>;
  if (!current) return <Card><EmptyState title="Soal tidak ditemukan"/></Card>;

  return <div className={styles.page}>
    <div className={styles.examHeading}><h1>{assessment.judul}</h1><Badge variant="danger"><span aria-hidden="true">◷</span>{remaining?.text ?? "--:--"}</Badge></div>
    {error && <p className={styles.inlineError} role="alert">{error}</p>}
    <div className={styles.examGrid}>
      <Card className={styles.questionCard}>
        <div className={styles.questionMeta}><strong>Soal No. {current.nomor || index + 1}</strong><Badge variant="info">PILIHAN GANDA</Badge></div>
        <div className={styles.questionText}>{mathText(current.teks)}</div>
        <div className={styles.options}>{current.opsi.map((option) => <button type="button" className={answers[key] === option.kode ? styles.optionSelected : styles.option} aria-pressed={answers[key] === option.kode} key={option.kode} onClick={() => choose(current, option.kode)}>
          <span className={styles.optionCode}>{option.kode}.</span><span>{option.teks}</span>
        </button>)}</div>
        <div className={styles.questionActions}><button type="button" className={styles.doubtButton} aria-pressed={doubtful.includes(current.id)} onClick={() => toggleDoubtful(current.id)}>{doubtful.includes(current.id) ? "★ Ditandai Ragu-ragu" : "☆ Tandai Ragu-ragu"}</button>
          <div className={styles.stepActions}><button type="button" className={styles.previous} disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>← Soal Sebelumnya</button><button type="button" className={styles.next} onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}>{index === questions.length - 1 ? "Simpan" : "Simpan & Lanjut"} →</button></div>
        </div>
      </Card>
      <button type="button" className={[styles.mobileNavToggle, navOpen ? styles.mobileNavToggleHidden : ""].join(" ")} aria-expanded={navOpen} onClick={() => setNavOpen((value) => !value)}>Navigasi Soal ({index + 1}/{questions.length})</button>
      <Card className={[styles.questionNav, navOpen ? styles.questionNavOpen : ""].join(" ")}>
        <div className={styles.navHeading}><h2>Navigasi Soal</h2><button type="button" aria-label="Tutup navigasi soal" onClick={() => setNavOpen(false)}>×</button></div>
        <p className={styles.navCount}>{index + 1} / {questions.length} Soal</p>
        <div className={styles.numberGrid}>{questions.map((question, questionIndex) => {
          const isAnswered = Boolean(answers[String(question.id)]);
          const isDoubtful = doubtful.includes(question.id);
          const className = [styles.number, isDoubtful ? styles.numberDoubtful : isAnswered ? styles.numberAnswered : "", questionIndex === index ? styles.numberActive : ""].join(" ");
          return <button type="button" className={className} key={question.id} aria-label={"Soal " + question.nomor} aria-current={questionIndex === index ? "step" : undefined} onClick={() => { setIndex(questionIndex); setNavOpen(false); }}>{question.nomor || questionIndex + 1}</button>;
        })}</div>
        <div className={styles.legend}><span><i className={styles.legendAnswered}/>Sudah dijawab <strong>{answeredCount}</strong></span><span><i className={styles.legendEmpty}/>Belum dijawab <strong>{unansweredCount}</strong></span><span><i className={styles.legendDoubtful}/>Ragu-ragu <strong>{doubtfulCount}</strong></span></div>
        <button type="button" className={styles.endButton} onClick={() => setConfirmOpen(true)}>Akhiri Ujian</button>
      </Card>
    </div>
    <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Akhiri asesmen?" footer={<><button type="button" className={styles.previous} onClick={() => setConfirmOpen(false)}>Kembali</button><button type="button" className={styles.confirmEnd} disabled={sending} onClick={() => void submit(false)}>{sending ? "Mengirim…" : "Ya, Akhiri Ujian"}</button></>}>
      <p className={styles.confirmText}>Masih ada <strong>{unansweredCount} soal</strong> yang belum dijawab. Setelah dikirim, jawaban tidak dapat diubah.</p>
    </Modal>
  </div>;
}
