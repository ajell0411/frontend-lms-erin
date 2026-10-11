"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getUser, listKelas, listPelajaran, type KelasRecord, type PelajaranRecord } from "@/lib/api";
import { hapusGuruKelas, listGuruKelas, tambahGuruKelas, ubahGuruKelas, type GuruKelasItem } from "@/lib/guru";
import { Avatar, ConfirmDialog, EmptyState, Icon, Modal, PageHead, pesanError, useNotice } from "../ui";
import ui from "../ui.module.css";

type ModalState = { mode: "tambah" } | { mode: "ubah"; item: GuruKelasItem } | null;

export default function KelasSayaPage() {
  const [items, setItems] = useState<GuruKelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [hapus, setHapus] = useState<GuruKelasItem | null>(null);
  const [kelasOpts, setKelasOpts] = useState<KelasRecord[]>([]);
  const [pelOpts, setPelOpts] = useState<PelajaranRecord[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [pelId, setPelId] = useState("");
  const [busy, setBusy] = useState(false);
  const { show, node } = useNotice();

  const muat = useCallback(async () => {
    try {
      setItems(await listGuruKelas());
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Kelas gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function siapkanMaster() {
    if (kelasOpts.length > 0 && pelOpts.length > 0) return;
    try {
      const [kelas, pelajaran] = await Promise.all([listKelas(), listPelajaran()]);
      const uid = getUser()?.id;
      const milik = pelajaran.filter((p) => uid !== undefined && (p.guru_ids ?? []).includes(uid));
      setKelasOpts(kelas);
      setPelOpts(milik.length > 0 ? milik : pelajaran);
    } catch (reason) {
      show(pesanError(reason, "Daftar kelas gagal dimuat."), true);
    }
  }

  function bukaTambah() {
    setKelasId("");
    setPelId("");
    setModal({ mode: "tambah" });
    void siapkanMaster();
  }

  function bukaUbah(item: GuruKelasItem) {
    setKelasId(String(item.kelas_id));
    setPelId(String(item.pelajaran_id));
    setModal({ mode: "ubah", item });
    void siapkanMaster();
  }

  async function simpan() {
    if (!kelasId || !pelId) {
      show("Pilih kelas dan pelajaran.", true);
      return;
    }
    setBusy(true);
    try {
      const input = { kelas_id: Number(kelasId), pelajaran_id: Number(pelId) };
      if (modal?.mode === "ubah") {
        await ubahGuruKelas(modal.item.id, input);
        show("Kelas diperbarui.");
      } else {
        await tambahGuruKelas(input);
        show("Kelas ditambahkan.");
      }
      setModal(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Kelas gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      await hapusGuruKelas(hapus.id);
      show("Kelas dilepas dari daftarmu.");
      setHapus(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Kelas gagal dihapus."), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {node}
      <PageHead
        title="Kelas Saya"
        subtitle="Kelola daftar kelas dan mata pelajaran yang Anda ampu."
        action={
          <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={bukaTambah}>
            <Icon name="plus" />
            Tambah Kelas
          </button>
        }
      />

      {loading ? (
        <div className={ui.state}>Memuat kelas...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada kelas" text="Klik Tambah Kelas untuk memilih kelas dan pelajaran yang Anda ampu." />
      ) : (
        <div className={ui.grid3}>
          {items.map((k) => (
            <article key={k.id} className={ui.classCard}>
              <div className={ui.classTop}>
                <span className={ui.badge}>Tingkat {k.tingkat}</span>
                <span className={ui.cardActions}>
                  <button type="button" className={ui.iconBtn} aria-label={`Edit ${k.kelas_nama}`} onClick={() => bukaUbah(k)}>
                    <Icon name="edit" />
                  </button>
                  <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label={`Hapus ${k.kelas_nama}`} onClick={() => setHapus(k)}>
                    <Icon name="trash" />
                  </button>
                </span>
              </div>
              <h3>{k.kelas_nama}</h3>
              <p className={ui.muted}>{k.pelajaran_nama}</p>
              <div className={ui.avatarRow}>
                <span className={ui.avatarStack}>
                  {k.siswa_preview.map((s, i) => (
                    <Avatar key={`${s.nama}-${i}`} nama={s.nama} foto={s.foto_url} size={26} />
                  ))}
                </span>
                <span>{k.jumlah_siswa} Siswa</span>
              </div>
              <Link href={`/guru/kelas/${k.id}`} className={`${ui.btn} ${ui.btnOutline} ${ui.btnBlock}`}>
                Lihat Detail Kelas
              </Link>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === "ubah" ? "Edit Kelas" : "Tambah Kelas Baru"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpan()}>
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label htmlFor="kelas-pilih">Kelas</label>
            <select id="kelas-pilih" className={ui.select} value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
              <option value="">Pilih kelas...</option>
              {kelasOpts.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div className={ui.field}>
            <label htmlFor="pel-pilih">Mata Pelajaran</label>
            <select id="pel-pilih" className={ui.select} value={pelId} onChange={(e) => setPelId(e.target.value)}>
              <option value="">Pilih pelajaran...</option>
              {pelOpts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {hapus && (
        <ConfirmDialog
          title="Hapus Kelas"
          text={`Lepas ${hapus.kelas_nama} (${hapus.pelajaran_nama}) dari daftar Kelas Saya? Data kelas aslinya tidak ikut terhapus.`}
          confirmLabel="Hapus"
          busy={busy}
          onConfirm={() => void konfirmasiHapus()}
          onCancel={() => setHapus(null)}
        />
      )}
    </div>
  );
}