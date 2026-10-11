"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HARI,
  hapusGuruJadwal,
  listGuruJadwal,
  listGuruKelas,
  tambahGuruJadwal,
  ubahGuruJadwal,
  type GuruJadwal,
  type GuruKelasItem,
  type Hari,
} from "@/lib/guru";
import { ConfirmDialog, Icon, Modal, PageHead, pesanError, useNotice } from "../ui";
import ui from "../ui.module.css";

type Form = { guruKelasId: string; hari: Hari; jam_mulai: string; jam_selesai: string; ruangan: string };
const KOSONG: Form = { guruKelasId: "", hari: "senin", jam_mulai: "", jam_selesai: "", ruangan: "" };

function namaHari(h: string) {
  return h.charAt(0).toUpperCase() + h.slice(1);
}

export default function JadwalPage() {
  const [jadwal, setJadwal] = useState<GuruJadwal[]>([]);
  const [kelas, setKelas] = useState<GuruKelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{ edit: GuruJadwal | null } | null>(null);
  const [form, setForm] = useState<Form>(KOSONG);
  const [hapus, setHapus] = useState<GuruJadwal | null>(null);
  const [busy, setBusy] = useState(false);
  const { show, node } = useNotice();

  const hariIni = HARI[(new Date().getDay() + 6) % 7];

  const muat = useCallback(async () => {
    try {
      const [j, k] = await Promise.all([listGuruJadwal(), listGuruKelas()]);
      setJadwal(j);
      setKelas(k);
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Jadwal gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  function bukaTambah() {
    setForm({ ...KOSONG, hari: hariIni });
    setModal({ edit: null });
  }

  function bukaUbah(j: GuruJadwal) {
    const cocok = kelas.find((k) => k.kelas_id === j.kelas_id && k.pelajaran_id === j.pelajaran_id);
    setForm({
      guruKelasId: cocok ? String(cocok.id) : "",
      hari: j.hari,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      ruangan: j.ruangan,
    });
    setModal({ edit: j });
  }

  async function simpan() {
    if (form.jam_mulai && form.jam_selesai && form.jam_selesai <= form.jam_mulai) {
      show(`Jam selesai (${form.jam_selesai}) harus lebih besar dari jam mulai (${form.jam_mulai}). Contoh: 07:00 sampai 08:30.`, true);
      return;
    }
    const pilih = kelas.find((k) => String(k.id) === form.guruKelasId);
    if (!pilih) {
      show("Pilih kelas terlebih dahulu.", true);
      return;
    }
    if (!form.jam_mulai || !form.jam_selesai) {
      show("Jam mulai dan jam selesai wajib diisi.", true);
      return;
    }
    setBusy(true);
    try {
      const input = {
        kelas_id: pilih.kelas_id,
        pelajaran_id: pilih.pelajaran_id,
        hari: form.hari,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        ruangan: form.ruangan,
      };
      if (modal?.edit) {
        await ubahGuruJadwal(modal.edit.id, input);
        show("Jadwal diperbarui.");
      } else {
        await tambahGuruJadwal(input);
        show("Jadwal ditambahkan.");
      }
      setModal(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Jadwal gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      await hapusGuruJadwal(hapus.id);
      show("Jadwal dihapus.");
      setHapus(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Jadwal gagal dihapus."), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {node}
      <PageHead
        title="Jadwal Mengajar Lengkap"
        subtitle="Jadwal mengajar mingguan Anda."
        action={
          <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={bukaTambah}>
            <Icon name="plus" />
            Tambah Jadwal
          </button>
        }
      />

      {loading ? (
        <div className={ui.state}>Memuat jadwal...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : (
        <div className={ui.hariList}>
          {HARI.map((h) => {
            const list = jadwal.filter((j) => j.hari === h).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
            return (
              <section key={h} className={ui.hariCard}>
                <div className={ui.hariHead}>
                  <h2>{namaHari(h)}</h2>
                  {h === hariIni && <span className={ui.badge}>Hari ini</span>}
                </div>
                {list.length === 0 ? (
                  <p className={ui.jadwalKosong}>Tidak ada jadwal mengajar.</p>
                ) : (
                  list.map((j) => (
                    <div key={j.id} className={ui.jadwalItem}>
                      <div>
                        <div className={ui.jadwalJam}>
                          {j.jam_mulai} - {j.jam_selesai}
                        </div>
                        <strong>{j.kelas_nama}</strong>
                        <span className={ui.muted}>
                          {j.pelajaran_nama}
                          {j.ruangan ? ` \u2022 ${j.ruangan}` : ""}
                        </span>
                      </div>
                      <span className={ui.cardActions}>
                        <button type="button" className={ui.iconBtn} aria-label="Edit jadwal" onClick={() => bukaUbah(j)}>
                          <Icon name="edit" />
                        </button>
                        <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label="Hapus jadwal" onClick={() => setHapus(j)}>
                          <Icon name="trash" />
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.edit ? "Edit Jadwal" : "Tambah Jadwal Baru"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpan()}>
                {busy ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label htmlFor="j-kelas">Kelas dan Pelajaran</label>
            <select id="j-kelas" className={ui.select} value={form.guruKelasId} onChange={(e) => setForm({ ...form, guruKelasId: e.target.value })}>
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
            <label htmlFor="j-hari">Hari</label>
            <select id="j-hari" className={ui.select} value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value as Hari })}>
              {HARI.map((h) => (
                <option key={h} value={h}>
                  {namaHari(h)}
                </option>
              ))}
            </select>
          </div>
          <div className={ui.fieldRow}>
            <div className={ui.field}>
              <label htmlFor="j-mulai">Jam Mulai</label>
              <input id="j-mulai" type="time" className={ui.input} value={form.jam_mulai} onChange={(e) => { const v = e.target.value; const parts = v.split(":"); const t = Math.min(Number(parts[0]) * 60 + Number(parts[1]) + 60, 1439); const auto = Number.isNaN(t) ? "" : String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); setForm({ ...form, jam_mulai: v, jam_selesai: form.jam_selesai && form.jam_selesai > v ? form.jam_selesai : auto }); }} />
            </div>
            <div className={ui.field}>
              <label htmlFor="j-selesai">Jam Selesai</label>
              <input id="j-selesai" type="time" className={ui.input} value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} />
            </div>
          </div>
          <div className={ui.field}>
            <label htmlFor="j-ruang">Ruangan (opsional)</label>
            <input id="j-ruang" className={ui.input} value={form.ruangan} onChange={(e) => setForm({ ...form, ruangan: e.target.value })} placeholder="Contoh: Lab Komputer 1" />
          </div>
        </Modal>
      )}

      {hapus && (
        <ConfirmDialog
          title="Hapus Jadwal"
          text={`Hapus jadwal ${hapus.kelas_nama} (${namaHari(hapus.hari)}, ${hapus.jam_mulai} - ${hapus.jam_selesai})?`}
          confirmLabel="Hapus"
          busy={busy}
          onConfirm={() => void konfirmasiHapus()}
          onCancel={() => setHapus(null)}
        />
      )}
    </div>
  );
}