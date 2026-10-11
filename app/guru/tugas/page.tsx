"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  hapusGuruTugas,
  listGuruKelas,
  listGuruTugas,
  nonaktifGuruTugas,
  tambahGuruTugas,
  ubahGuruTugas,
  type GuruKelasItem,
  type GuruTugas,
} from "@/lib/guru";
import { ConfirmDialog, EmptyState, Icon, Modal, PageHead, formatWaktu, pesanError, toInputDateTime, useNotice } from "../ui";
import ui from "../ui.module.css";
import x from "../extra.module.css";

const MAKS_MB = 50;

type Form = { judul: string; guruKelasId: string; deskripsi: string; deadline: string; file: File | null };
const KOSONG: Form = { judul: "", guruKelasId: "", deskripsi: "", deadline: "", file: null };

export default function TugasGuruPage() {
  const [tugas, setTugas] = useState<GuruTugas[]>([]);
  const [kelas, setKelas] = useState<GuruKelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState<{ edit: GuruTugas | null } | null>(null);
  const [form, setForm] = useState<Form>(KOSONG);
  const [hapus, setHapus] = useState<GuruTugas | null>(null);
  const [tutup, setTutup] = useState<GuruTugas | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { show, node } = useNotice();

  const muat = useCallback(async () => {
    try {
      const [t, k] = await Promise.all([listGuruTugas(), listGuruKelas()]);
      setTugas(t);
      setKelas(k);
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Tugas gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return tugas.filter(
      (t) =>
        (!filterKelas || String(t.kelas_id) === filterKelas) &&
        (!filterStatus || (filterStatus === "aktif" ? t.aktif : !t.aktif)) &&
        (!kata || t.judul.toLowerCase().includes(kata) || t.deskripsi.toLowerCase().includes(kata)),
    );
  }, [tugas, q, filterKelas, filterStatus]);

  const kelasUnik = useMemo(() => {
    const peta = new Map<number, string>();
    kelas.forEach((k) => peta.set(k.kelas_id, k.kelas_nama));
    return Array.from(peta.entries());
  }, [kelas]);

  function bukaTambah() {
    setForm(KOSONG);
    setModal({ edit: null });
  }

  function bukaUbah(t: GuruTugas) {
    const cocok = kelas.find((k) => k.kelas_id === t.kelas_id && k.pelajaran_id === t.pelajaran_id);
    setForm({
      judul: t.judul,
      guruKelasId: cocok ? String(cocok.id) : "",
      deskripsi: t.deskripsi,
      deadline: toInputDateTime(t.deadline),
      file: null,
    });
    setModal({ edit: t });
  }

  function pilihFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAKS_MB * 1024 * 1024) {
      show(`Ukuran file maksimal ${MAKS_MB} MB.`, true);
      return;
    }
    setForm((f) => ({ ...f, file }));
  }

  async function simpan() {
    const pilih = kelas.find((k) => String(k.id) === form.guruKelasId);
    if (!form.judul.trim()) {
      show("Judul tugas wajib diisi.", true);
      return;
    }
    if (!pilih) {
      show("Pilih kelas yang dituju.", true);
      return;
    }
    if (!form.deadline) {
      show("Deadline wajib diisi.", true);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("judul", form.judul.trim());
      fd.set("kelas_id", String(pilih.kelas_id));
      fd.set("pelajaran_id", String(pilih.pelajaran_id));
      fd.set("deskripsi", form.deskripsi.trim());
      fd.set("deadline", form.deadline);
      if (form.file) {
        fd.set("file", form.file);
        fd.set("lampiran", form.file);
      }
      if (modal?.edit) {
        await ubahGuruTugas(modal.edit.id, fd);
        show("Tugas diperbarui.");
      } else {
        await tambahGuruTugas(fd);
        show("Tugas ditambahkan.");
      }
      setModal(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Tugas gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      await hapusGuruTugas(hapus.id);
      show("Tugas dihapus.");
      setHapus(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Tugas gagal dihapus."), true);
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiTutup() {
    if (!tutup) return;
    setBusy(true);
    try {
      await nonaktifGuruTugas(tutup.id);
      show("Tugas dinonaktifkan.");
      setTutup(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Tugas gagal dinonaktifkan."), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {node}
      <PageHead
        title="Tugas"
        subtitle="Buat tugas, pantau pengumpulan, dan beri nilai."
        action={
          <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={bukaTambah}>
            <Icon name="plus" />
            Tambah Tugas
          </button>
        }
      />

      <div className={ui.toolbar}>
        <label className={ui.searchBox}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tugas..." aria-label="Cari tugas" />
        </label>
        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} aria-label="Filter kelas">
          <option value="">Semua Kelas</option>
          {kelasUnik.map(([id, nama]) => (
            <option key={id} value={id}>
              {nama}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {loading ? (
        <div className={ui.state}>Memuat tugas...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : tampil.length === 0 ? (
        <EmptyState title="Tugas tidak ditemukan" text="Klik Tambah Tugas untuk membuat tugas pertama Anda." />
      ) : (
        <div className={ui.materiGrid}>
          {tampil.map((t) => (
            <article key={t.id} className={ui.materiCard}>
              <div className={ui.materiTop}>
                <span className={`${ui.badge} ${t.aktif ? ui.badgeGreen : ui.badgeGray}`}>{t.aktif ? "Aktif" : "Nonaktif"}</span>
                <span className={ui.cardActions}>
                  <button type="button" className={ui.iconBtn} aria-label={`Edit ${t.judul}`} onClick={() => bukaUbah(t)}>
                    <Icon name="edit" />
                  </button>
                  <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label={`Hapus ${t.judul}`} onClick={() => setHapus(t)}>
                    <Icon name="trash" />
                  </button>
                </span>
              </div>
              <div className={ui.materiMeta}>
                <span className={ui.badge}>{t.kelas_nama}</span>
                <span>{t.pelajaran_nama}</span>
              </div>
              <h3>{t.judul}</h3>
              {t.deskripsi && <p className={ui.materiDesc}>{t.deskripsi}</p>}
              <div className={x.metaLine}>
                <span>Deadline: {formatWaktu(t.deadline)}</span>
                <span>
                  Terkumpul: {t.dikumpulkan}/{t.jumlah_siswa}
                </span>
              </div>
              <div className={ui.materiActions}>
                <Link href={`/guru/tugas/${t.id}`} className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`}>
                  <Icon name="eye" />
                  Lihat Pengumpulan
                </Link>
                {t.aktif && (
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} ${ui.btnSm}`} onClick={() => setTutup(t)}>
                    Nonaktifkan
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.edit ? "Edit Tugas" : "Tambah Tugas Baru"}
          size="lg"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpan()}>
                {busy ? "Menyimpan..." : modal.edit ? "Simpan Perubahan" : "Simpan Tugas"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label htmlFor="t-judul">Judul Tugas</label>
            <input id="t-judul" className={ui.input} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Contoh: Latihan Struktur Data" />
          </div>
          <div className={ui.fieldRow}>
            <div className={ui.field}>
              <label htmlFor="t-kelas">Kelas</label>
              <select id="t-kelas" className={ui.select} value={form.guruKelasId} onChange={(e) => setForm({ ...form, guruKelasId: e.target.value })}>
                <option value="">Pilih kelas...</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kelas_nama} - {k.pelajaran_nama}
                  </option>
                ))}
              </select>
              {kelas.length === 0 && <span className={ui.hint}>Tambahkan kelas dulu di menu Kelas Saya.</span>}
            </div>
            <div className={ui.field}>
              <label htmlFor="t-deadline">Deadline</label>
              <input id="t-deadline" type="datetime-local" className={ui.input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className={ui.field}>
            <label htmlFor="t-desk">Deskripsi / Instruksi</label>
            <textarea id="t-desk" className={ui.textarea} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          </div>
          <div className={ui.field}>
            <label>Lampiran (Opsional){modal.edit ? " - kosongkan jika tidak diganti" : ""}</label>
            {modal.edit && !form.file && modal.edit.nama_lampiran && (
              <div className={ui.fileNow}>
                <Icon name="file" />
                <span>{modal.edit.nama_lampiran}</span>
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
              <span>Maks {MAKS_MB} MB</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              hidden
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
          title="Hapus Tugas"
          text={`Hapus tugas "${hapus.judul}"? Pengumpulan siswa pada tugas ini ikut terhapus.`}
          confirmLabel="Hapus Tugas"
          busy={busy}
          onConfirm={() => void konfirmasiHapus()}
          onCancel={() => setHapus(null)}
        />
      )}

      {tutup && (
        <ConfirmDialog
          title="Nonaktifkan Tugas"
          text={`Nonaktifkan tugas "${tutup.judul}"? Siswa tidak bisa mengumpulkan lagi setelah ini.`}
          confirmLabel="Nonaktifkan"
          busy={busy}
          onConfirm={() => void konfirmasiTutup()}
          onCancel={() => setTutup(null)}
        />
      )}
    </div>
  );
}