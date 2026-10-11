"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  hapusGuruAsesmen,
  listGuruAsesmen,
  listGuruKelas,
  tambahGuruAsesmen,
  ubahGuruAsesmen,
  type GuruAsesmen,
  type GuruKelasItem,
} from "@/lib/guru";
import { ConfirmDialog, EmptyState, Icon, Modal, PageHead, formatWaktu, pesanError, toInputDateTime, useNotice } from "../ui";
import ui from "../ui.module.css";
import x from "../extra.module.css";

type Form = {
  judul: string;
  jenis: "kuis" | "ujian_harian";
  guruKelasId: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
};
const KOSONG: Form = { judul: "", jenis: "kuis", guruKelasId: "", tanggal: "", jam_mulai: "", jam_selesai: "" };

function labelJenis(j: string) {
  return j === "ujian_harian" ? "Ujian Harian" : "Kuis";
}

export default function AsesmenGuruPage() {
  const [items, setItems] = useState<GuruAsesmen[]>([]);
  const [kelas, setKelas] = useState<GuruKelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState<{ edit: GuruAsesmen | null } | null>(null);
  const [form, setForm] = useState<Form>(KOSONG);
  const [hapus, setHapus] = useState<GuruAsesmen | null>(null);
  const [busy, setBusy] = useState(false);
  const { show, node } = useNotice();

  const muat = useCallback(async () => {
    try {
      const [a, k] = await Promise.all([listGuruAsesmen(), listGuruKelas()]);
      setItems(a);
      setKelas(k);
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Asesmen gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        (!filterKelas || String(a.kelas_id) === filterKelas) &&
        (!filterStatus || a.status === filterStatus) &&
        (!kata || a.judul.toLowerCase().includes(kata)),
    );
  }, [items, q, filterKelas, filterStatus]);

  const kelasUnik = useMemo(() => {
    const peta = new Map<number, string>();
    kelas.forEach((k) => peta.set(k.kelas_id, k.kelas_nama));
    return Array.from(peta.entries());
  }, [kelas]);

  function bukaTambah() {
    setForm(KOSONG);
    setModal({ edit: null });
  }

  function bukaUbah(a: GuruAsesmen) {
    const cocok = kelas.find((k) => k.kelas_id === a.kelas_id && k.pelajaran_id === a.pelajaran_id);
    const akhir = toInputDateTime(a.deadline);
    const awal = a.jadwal_mulai ? toInputDateTime(a.jadwal_mulai) : "";
    setForm({
      judul: a.judul,
      jenis: a.jenis,
      guruKelasId: cocok ? String(cocok.id) : "",
      tanggal: akhir.slice(0, 10),
      jam_mulai: awal.slice(11, 16),
      jam_selesai: akhir.slice(11, 16),
    });
    setModal({ edit: a });
  }

  async function simpan() {
    const pilih = kelas.find((k) => String(k.id) === form.guruKelasId);
    if (!form.judul.trim()) {
      show("Judul asesmen wajib diisi.", true);
      return;
    }
    if (!pilih) {
      show("Pilih kelas yang dituju.", true);
      return;
    }
    if (!form.tanggal || !form.jam_mulai || !form.jam_selesai) {
      show("Tanggal, jam mulai, dan jam selesai wajib diisi.", true);
      return;
    }
    setBusy(true);
    try {
      const input = {
        judul: form.judul.trim(),
        jenis: form.jenis,
        kelas_id: pilih.kelas_id,
        pelajaran_id: pilih.pelajaran_id,
        tanggal: form.tanggal,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
      };
      if (modal?.edit) {
        await ubahGuruAsesmen(modal.edit.id, input);
        show("Asesmen diperbarui.");
      } else {
        await tambahGuruAsesmen(input);
        show("Asesmen dibuat. Klik Kelola Soal untuk menambah soal.");
      }
      setModal(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Asesmen gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      await hapusGuruAsesmen(hapus.id);
      show("Asesmen dihapus.");
      setHapus(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Asesmen gagal dihapus."), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {node}
      <PageHead
        title="Asesmen"
        subtitle="Kelola kuis dan ujian harian beserta soalnya."
        action={
          <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={bukaTambah}>
            <Icon name="plus" />
            Tambah Asesmen
          </button>
        }
      />

      <div className={ui.toolbar}>
        <label className={ui.searchBox}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari asesmen..." aria-label="Cari asesmen" />
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
          <option value="aktif">Sedang Berlangsung</option>
          <option value="terjadwal">Terjadwal</option>
          <option value="berakhir">Berakhir</option>
        </select>
      </div>

      {loading ? (
        <div className={ui.state}>Memuat asesmen...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : tampil.length === 0 ? (
        <EmptyState title="Asesmen tidak ditemukan" text="Klik Tambah Asesmen untuk membuat kuis atau ujian pertama Anda." />
      ) : (
        <div className={ui.materiGrid}>
          {tampil.map((a) => (
            <article key={a.id} className={ui.materiCard}>
              <div className={ui.materiTop}>
                <span className={`${ui.badge} ${a.status === "aktif" ? ui.badgeGreen : a.status === "terjadwal" ? ui.badgeYellow : ui.badgeGray}`}>
                  {a.status === "aktif" ? "Berlangsung" : a.status === "terjadwal" ? "Terjadwal" : "Berakhir"}
                </span>
                <span className={ui.cardActions}>
                  <button type="button" className={ui.iconBtn} aria-label={`Edit ${a.judul}`} onClick={() => bukaUbah(a)}>
                    <Icon name="edit" />
                  </button>
                  <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label={`Hapus ${a.judul}`} onClick={() => setHapus(a)}>
                    <Icon name="trash" />
                  </button>
                </span>
              </div>
              <div className={ui.materiMeta}>
                <span className={ui.badge}>{a.kelas_nama}</span>
                <span>{labelJenis(a.jenis)}</span>
              </div>
              <h3>{a.judul}</h3>
              <div className={x.metaLine}>
                <span>{a.pelajaran_nama}</span>
                <span>{a.jumlah_soal} soal</span>
                <span>{a.durasi_menit} menit</span>
              </div>
              <div className={x.metaLine}>
                <span>Selesai: {formatWaktu(a.deadline)}</span>
                <span>
                  Terkumpul: {a.selesai}/{a.jumlah_siswa}
                </span>
              </div>
              <div className={ui.materiActions}>
                <Link href={`/guru/asesmen/${a.id}`} className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`}>
                  <Icon name="asesmen" />
                  Kelola Soal dan Hasil
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.edit ? "Edit Asesmen" : "Tambah Asesmen Baru"}
          size="lg"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpan()}>
                {busy ? "Menyimpan..." : modal.edit ? "Simpan Perubahan" : "Simpan Asesmen"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label htmlFor="a-judul">Judul Asesmen</label>
            <input id="a-judul" className={ui.input} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Contoh: Kuis Bab 1" />
          </div>
          <div className={ui.fieldRow}>
            <div className={ui.field}>
              <label htmlFor="a-jenis">Jenis</label>
              <select id="a-jenis" className={ui.select} value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as Form["jenis"] })}>
                <option value="kuis">Kuis</option>
                <option value="ujian_harian">Ujian Harian</option>
              </select>
            </div>
            <div className={ui.field}>
              <label htmlFor="a-kelas">Kelas</label>
              <select id="a-kelas" className={ui.select} value={form.guruKelasId} onChange={(e) => setForm({ ...form, guruKelasId: e.target.value })}>
                <option value="">Pilih kelas...</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kelas_nama} - {k.pelajaran_nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={ui.field}>
            <label htmlFor="a-tgl">Tanggal</label>
            <input id="a-tgl" type="date" className={ui.input} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <div className={ui.fieldRow}>
            <div className={ui.field}>
              <label htmlFor="a-mulai">Jam Mulai</label>
              <input id="a-mulai" type="time" className={ui.input} value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} />
            </div>
            <div className={ui.field}>
              <label htmlFor="a-selesai">Jam Selesai</label>
              <input id="a-selesai" type="time" className={ui.input} value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {hapus && (
        <ConfirmDialog
          title="Hapus Asesmen"
          text={`Hapus asesmen "${hapus.judul}"? Soal dan hasil pengerjaan siswa ikut terhapus.`}
          confirmLabel="Hapus Asesmen"
          busy={busy}
          onConfirm={() => void konfirmasiHapus()}
          onCancel={() => setHapus(null)}
        />
      )}
    </div>
  );
}