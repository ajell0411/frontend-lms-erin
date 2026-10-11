"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchGuruFile,
  guruMateriFilePath,
  hapusGuruMateri,
  listGuruKelas,
  listGuruMateri,
  tambahGuruMateri,
  ubahGuruMateri,
  type GuruKelasItem,
  type GuruMateri,
} from "@/lib/guru";
import {
  ConfirmDialog,
  EmptyState,
  FilePreview,
  Icon,
  Modal,
  PageHead,
  formatTanggal,
  pesanError,
  saveBlob,
  useNotice,
} from "../ui";
import ui from "../ui.module.css";

const EKSTENSI = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"];
const MAKS_MB = 50;

function labelFile(nama: string) {
  const n = nama.toLowerCase();
  if (n.endsWith(".pdf")) return "PDF";
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "DOC";
  if (n.endsWith(".ppt") || n.endsWith(".pptx")) return "PPT";
  if (n.endsWith(".xls") || n.endsWith(".xlsx")) return "XLS";
  return "FILE";
}

type Form = { judul: string; guruKelasId: string; deskripsi: string; file: File | null };
const KOSONG: Form = { judul: "", guruKelasId: "", deskripsi: "", file: null };

export default function MateriGuruPage() {
  const [materi, setMateri] = useState<GuruMateri[]>([]);
  const [kelas, setKelas] = useState<GuruKelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [modal, setModal] = useState<{ edit: GuruMateri | null } | null>(null);
  const [form, setForm] = useState<Form>(KOSONG);
  const [hapus, setHapus] = useState<GuruMateri | null>(null);
  const [preview, setPreview] = useState<{ judul: string; blob: Blob; filename: string } | null>(null);
  const [bukaId, setBukaId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { show, node } = useNotice();

  const muat = useCallback(async () => {
    try {
      const [m, k] = await Promise.all([listGuruMateri(), listGuruKelas()]);
      setMateri(m);
      setKelas(k);
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Materi gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return materi.filter(
      (m) =>
        (!filterKelas || String(m.kelas_id) === filterKelas) &&
        (!kata || m.judul.toLowerCase().includes(kata) || m.deskripsi.toLowerCase().includes(kata)),
    );
  }, [materi, q, filterKelas]);

  const kelasUnik = useMemo(() => {
    const peta = new Map<number, string>();
    kelas.forEach((k) => peta.set(k.kelas_id, k.kelas_nama));
    return Array.from(peta.entries());
  }, [kelas]);

  function bukaTambah() {
    setForm(KOSONG);
    setModal({ edit: null });
  }

  function bukaUbah(m: GuruMateri) {
    const cocok = kelas.find((k) => k.kelas_id === m.kelas_id && k.pelajaran_id === m.pelajaran_id);
    setForm({ judul: m.judul, guruKelasId: cocok ? String(cocok.id) : "", deskripsi: m.deskripsi, file: null });
    setModal({ edit: m });
  }

  function pilihFile(file: File | undefined) {
    if (!file) return;
    const nama = file.name.toLowerCase();
    if (!EKSTENSI.some((e) => nama.endsWith(e))) {
      show("Format file harus PDF, DOC, DOCX, PPT, PPTX, XLS, atau XLSX.", true);
      return;
    }
    if (file.size > MAKS_MB * 1024 * 1024) {
      show(`Ukuran file maksimal ${MAKS_MB} MB.`, true);
      return;
    }
    setForm((f) => ({ ...f, file }));
  }

  async function simpan() {
    const pilih = kelas.find((k) => String(k.id) === form.guruKelasId);
    if (!form.judul.trim()) {
      show("Nama materi wajib diisi.", true);
      return;
    }
    if (!pilih) {
      show("Pilih kelas yang dituju.", true);
      return;
    }
    if (!modal?.edit && !form.file) {
      show("File materi wajib diunggah.", true);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("judul", form.judul.trim());
      fd.set("kelas_id", String(pilih.kelas_id));
      fd.set("pelajaran_id", String(pilih.pelajaran_id));
      fd.set("deskripsi", form.deskripsi.trim());
      if (form.file) fd.set("file", form.file);
      if (modal?.edit) {
        await ubahGuruMateri(modal.edit.id, fd);
        show("Materi diperbarui.");
      } else {
        await tambahGuruMateri(fd);
        show("Materi ditambahkan.");
      }
      setModal(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Materi gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  async function lihat(m: GuruMateri) {
    setBukaId(m.id);
    try {
      const hasil = await fetchGuruFile(guruMateriFilePath(m.id));
      setPreview({ judul: m.judul, blob: hasil.blob, filename: hasil.filename || m.nama_file });
    } catch (reason) {
      show(pesanError(reason, "Materi gagal dibuka."), true);
    } finally {
      setBukaId(null);
    }
  }

  async function unduh(m: GuruMateri) {
    setBukaId(m.id);
    try {
      const hasil = await fetchGuruFile(guruMateriFilePath(m.id));
      saveBlob(hasil.blob, hasil.filename || m.nama_file);
    } catch (reason) {
      show(pesanError(reason, "Materi gagal diunduh."), true);
    } finally {
      setBukaId(null);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      await hapusGuruMateri(hapus.id);
      show("Materi dihapus.");
      setHapus(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Materi gagal dihapus."), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {node}
      <PageHead
        title="Materi Pembelajaran"
        subtitle="Kelola dan bagikan materi pembelajaran untuk kelas Anda."
        action={
          <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={bukaTambah}>
            <Icon name="plus" />
            Tambah Materi
          </button>
        }
      />

      <div className={ui.toolbar}>
        <label className={ui.searchBox}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari materi..." aria-label="Cari materi" />
        </label>
        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} aria-label="Filter kelas">
          <option value="">Semua Kelas</option>
          {kelasUnik.map(([id, nama]) => (
            <option key={id} value={id}>
              {nama}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={ui.state}>Memuat materi...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : tampil.length === 0 ? (
        <EmptyState title="Materi tidak ditemukan" text="Klik Tambah Materi untuk mengunggah materi pertama Anda." />
      ) : (
        <div className={ui.materiGrid}>
          {tampil.map((m) => {
            const label = labelFile(m.nama_file);
            return (
              <article key={m.id} className={ui.materiCard}>
                <div className={ui.materiTop}>
                  <span className={`${ui.fileIcon} ${ui[`tone${label}`]}`}>{label}</span>
                  <span className={ui.cardActions}>
                    <button type="button" className={ui.iconBtn} aria-label={`Edit ${m.judul}`} onClick={() => bukaUbah(m)}>
                      <Icon name="edit" />
                    </button>
                    <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label={`Hapus ${m.judul}`} onClick={() => setHapus(m)}>
                      <Icon name="trash" />
                    </button>
                  </span>
                </div>
                <div className={ui.materiMeta}>
                  <span className={ui.badge}>{m.kelas_nama}</span>
                  <span>{formatTanggal(m.created_at)}</span>
                </div>
                <h3>{m.judul}</h3>
                {m.deskripsi && <p className={ui.materiDesc}>{m.deskripsi}</p>}
                <span className={ui.materiFile}>{m.ada_file ? m.nama_file : "File belum tersedia di server"}</span>
                <div className={ui.materiActions}>
                  <button type="button" className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`} disabled={bukaId === m.id} onClick={() => void lihat(m)}>
                    <Icon name="eye" />
                    {bukaId === m.id ? "Membuka..." : "Lihat Materi"}
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} ${ui.btnSm}`} disabled={bukaId === m.id} onClick={() => void unduh(m)}>
                    <Icon name="download" />
                    Unduh
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.edit ? "Edit Materi" : "Tambah Materi Baru"}
          size="lg"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpan()}>
                {busy ? "Menyimpan..." : modal.edit ? "Simpan Perubahan" : "Simpan Materi"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label htmlFor="m-judul">Nama Materi</label>
            <input id="m-judul" className={ui.input} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Contoh: Modul Struktur Data" />
          </div>
          <div className={ui.field}>
            <label htmlFor="m-kelas">Pilih Kelas</label>
            <select id="m-kelas" className={ui.select} value={form.guruKelasId} onChange={(e) => setForm({ ...form, guruKelasId: e.target.value })}>
              <option value="">Pilih kelas yang dituju...</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kelas_nama} - {k.pelajaran_nama}
                </option>
              ))}
            </select>
            {kelas.length === 0 && <span className={ui.hint}>Tambahkan kelas dulu di menu Kelas Saya.</span>}
          </div>
          <div className={ui.field}>
            <label htmlFor="m-desk">Deskripsi Materi (Opsional)</label>
            <textarea id="m-desk" className={ui.textarea} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          </div>
          <div className={ui.field}>
            <label>Unggah File {modal.edit ? "(kosongkan jika tidak diganti)" : ""}</label>
            {modal.edit && !form.file && modal.edit.nama_file && (
              <div className={ui.fileNow}>
                <Icon name="file" />
                <span>{modal.edit.nama_file}</span>
              </div>
            )}
            <div
              className={[ui.drop, drag ? ui.dropActive : ""].join(" ")}
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pilihFile(e.dataTransfer.files?.[0]);
              }}
            >
              <Icon name="upload" />
              <strong>{form.file ? form.file.name : "Klik atau seret file ke sini"}</strong>
              <span>PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (maks {MAKS_MB} MB)</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept={EKSTENSI.join(",")}
              onChange={(e) => {
                pilihFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </Modal>
      )}

      {hapus && (
        <ConfirmDialog
          title="Hapus Materi"
          text={`Hapus materi "${hapus.judul}"? File dan data materi akan dihapus permanen.`}
          confirmLabel="Hapus Materi"
          busy={busy}
          onConfirm={() => void konfirmasiHapus()}
          onCancel={() => setHapus(null)}
        />
      )}

      {preview && <FilePreview title={preview.judul} blob={preview.blob} filename={preview.filename} onClose={() => setPreview(null)} />}
    </div>
  );
}