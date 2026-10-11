"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getGuruAsesmen,
  getGuruAsesmenHasil,
  getGuruAsesmenMurid,
  hapusGuruSoal,
  tambahGuruSoal,
  ubahGuruSoal,
  type GuruAsesmenDetail,
  type GuruAsesmenHasil,
  type GuruAsesmenMurid,
  type GuruSoalInput,
  type GuruSoalItem,
} from "@/lib/guru";
import { Avatar, ConfirmDialog, EmptyState, Icon, Modal, formatWaktu, nilaiTone, pesanError, useNotice } from "../../ui";
import ui from "../../ui.module.css";
import x from "../../extra.module.css";

const KODE = ["A", "B", "C", "D", "E"];

type SoalForm = { teks: string; poin: string; opsi: string[]; kunci: number; pembahasan: string };
const SOAL_KOSONG: SoalForm = { teks: "", poin: "1", opsi: ["", "", "", ""], kunci: 0, pembahasan: "" };

function labelJenis(j: string) {
  return j === "ujian_harian" ? "Ujian Harian" : "Kuis";
}

export default function DetailAsesmenPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [data, setData] = useState<GuruAsesmenDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"soal" | "murid">("soal");
  const [murid, setMurid] = useState<GuruAsesmenMurid[] | null>(null);
  const [muridError, setMuridError] = useState("");
  const [q, setQ] = useState("");
  const [soalModal, setSoalModal] = useState<{ nomor: number | null } | null>(null);
  const [soalForm, setSoalForm] = useState<SoalForm>(SOAL_KOSONG);
  const [hapusSoal, setHapusSoal] = useState<GuruSoalItem | null>(null);
  const [hasil, setHasil] = useState<GuruAsesmenHasil | null>(null);
  const [bukaId, setBukaId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { show, node } = useNotice();

  const muat = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("Asesmen tidak valid.");
      return;
    }
    try {
      setData(await getGuruAsesmen(id));
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Asesmen gagal dimuat."));
    }
  }, [id]);

  useEffect(() => {
    void muat();
  }, [muat]);

  useEffect(() => {
    if (tab !== "murid" || !Number.isFinite(id) || id <= 0) return;
    getGuruAsesmenMurid(id)
      .then((r) => {
        setMurid(r.murid);
        setMuridError("");
      })
      .catch((reason) => setMuridError(pesanError(reason, "Daftar murid gagal dimuat.")));
  }, [tab, id]);

  function bukaTambahSoal() {
    setSoalForm(SOAL_KOSONG);
    setSoalModal({ nomor: null });
  }

  function bukaUbahSoal(s: GuruSoalItem) {
    const idx = s.opsi.findIndex((o) => o.kode === s.kunci);
    setSoalForm({
      teks: s.teks,
      poin: String(s.poin ?? 1),
      opsi: s.opsi.map((o) => o.teks),
      kunci: idx >= 0 ? idx : 0,
      pembahasan: s.pembahasan || "",
    });
    setSoalModal({ nomor: s.nomor });
  }

  function ubahOpsi(i: number, teks: string) {
    setSoalForm((f) => ({ ...f, opsi: f.opsi.map((o, n) => (n === i ? teks : o)) }));
  }

  function tambahOpsi() {
    setSoalForm((f) => (f.opsi.length >= KODE.length ? f : { ...f, opsi: [...f.opsi, ""] }));
  }

  function hapusOpsi(i: number) {
    setSoalForm((f) => {
      if (f.opsi.length <= 2) return f;
      const opsi = f.opsi.filter((_, n) => n !== i);
      let kunci = f.kunci;
      if (i < kunci) kunci -= 1;
      if (kunci >= opsi.length) kunci = opsi.length - 1;
      return { ...f, opsi, kunci };
    });
  }

  async function simpanSoal() {
    if (!soalModal || !data) return;
    if (!soalForm.teks.trim()) {
      show("Teks soal wajib diisi.", true);
      return;
    }
    if (soalForm.opsi.some((o) => !o.trim())) {
      show("Semua pilihan jawaban harus diisi.", true);
      return;
    }
    const poin = Number(soalForm.poin);
    if (!Number.isFinite(poin) || poin <= 0) {
      show("Poin harus lebih dari 0.", true);
      return;
    }
    const input: GuruSoalInput = {
      teks: soalForm.teks.trim(),
      poin,
      opsi: soalForm.opsi.map((o) => ({ teks: o.trim() })),
      kunci: KODE[soalForm.kunci],
      pembahasan: soalForm.pembahasan.trim(),
    };
    setBusy(true);
    try {
      const daftar = soalModal.nomor === null ? await tambahGuruSoal(data.id, input) : await ubahGuruSoal(data.id, soalModal.nomor, input);
      setData({ ...data, soal: daftar, jumlah_soal: daftar.length });
      show(soalModal.nomor === null ? "Soal ditambahkan." : "Soal diperbarui.");
      setSoalModal(null);
    } catch (reason) {
      show(pesanError(reason, "Soal gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapusSoal() {
    if (!hapusSoal || !data) return;
    setBusy(true);
    try {
      const daftar = await hapusGuruSoal(data.id, hapusSoal.nomor);
      setData({ ...data, soal: daftar, jumlah_soal: daftar.length });
      show("Soal dihapus.");
      setHapusSoal(null);
    } catch (reason) {
      show(pesanError(reason, "Soal gagal dihapus."), true);
    } finally {
      setBusy(false);
    }
  }

  async function bukaHasil(m: GuruAsesmenMurid) {
    setBukaId(m.siswa_id);
    try {
      setHasil(await getGuruAsesmenHasil(id, m.siswa_id));
    } catch (reason) {
      show(pesanError(reason, "Hasil gagal dibuka."), true);
    } finally {
      setBukaId(null);
    }
  }

  if (error) return <div className={`${ui.state} ${ui.stateError}`}>{error}</div>;
  if (!data) return <div className={ui.state}>Memuat asesmen...</div>;

  const kata = q.trim().toLowerCase();
  const daftarMurid = (murid ?? []).filter((m) => !kata || m.nama.toLowerCase().includes(kata) || m.nisn.includes(kata));

  return (
    <div>
      {node}
      <Link href="/guru/asesmen" className={ui.back}>
        <Icon name="back" />
        Kembali ke Asesmen
      </Link>
      <div className={ui.detailHead}>
        <div>
          <span className={ui.badge}>{labelJenis(data.jenis)}</span>
          <h1>{data.judul}</h1>
          <div className={x.metaLine}>
            <span>{data.kelas_nama}</span>
            <span>{data.pelajaran_nama}</span>
            <span>{data.jumlah_soal} soal</span>
            <span>{data.durasi_menit} menit</span>
          </div>
          <div className={x.metaLine}>
            <span>
              {data.jadwal_mulai ? `${formatWaktu(data.jadwal_mulai)} - ` : "Sampai "}
              {formatWaktu(data.deadline)}
            </span>
            <span>
              Selesai: {data.selesai}/{data.jumlah_siswa} siswa
            </span>
          </div>
        </div>
      </div>

      <div className={ui.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === "soal"} className={[ui.tab, tab === "soal" ? ui.tabActive : ""].join(" ")} onClick={() => setTab("soal")}>
          Soal ({data.soal.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === "murid"} className={[ui.tab, tab === "murid" ? ui.tabActive : ""].join(" ")} onClick={() => setTab("murid")}>
          Murid dan Hasil
        </button>
      </div>

      {tab === "soal" && (
        <div>
          <div className={ui.toolbar} style={{ justifyContent: "space-between" }}>
            <span className={ui.muted}>Pilihan ganda. Kunci jawaban ditandai hijau.</span>
            <button type="button" className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`} onClick={bukaTambahSoal}>
              <Icon name="plus" />
              Tambah Soal
            </button>
          </div>
          {data.soal.length === 0 ? (
            <EmptyState title="Belum ada soal" text="Klik Tambah Soal untuk membuat soal pertama." />
          ) : (
            <div className={x.soalList}>
              {data.soal.map((s) => (
                <article key={s.nomor} className={x.soalCard}>
                  <div className={x.soalHead}>
                    <span className={ui.badge}>Soal {s.nomor}</span>
                    <span className={ui.cardActions}>
                      <button type="button" className={ui.iconBtn} aria-label={`Edit soal ${s.nomor}`} onClick={() => bukaUbahSoal(s)}>
                        <Icon name="edit" />
                      </button>
                      <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label={`Hapus soal ${s.nomor}`} onClick={() => setHapusSoal(s)}>
                        <Icon name="trash" />
                      </button>
                    </span>
                  </div>
                  <p className={x.soalTeks}>{s.teks}</p>
                  <div className={x.opsiList}>
                    {s.opsi.map((o) => (
                      <div key={o.kode} className={[x.opsi, o.kode === s.kunci ? x.opsiBenar : ""].join(" ")}>
                        <b>{o.kode}.</b>
                        <span>{o.teks}</span>
                      </div>
                    ))}
                  </div>
                  {s.pembahasan && <p className={x.pembahasan}>Pembahasan: {s.pembahasan}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "murid" && (
        <div>
          <div className={ui.toolbar}>
            <label className={ui.searchBox}>
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau NISN..." aria-label="Cari murid" />
            </label>
          </div>
          {muridError ? (
            <div className={`${ui.state} ${ui.stateError}`}>{muridError}</div>
          ) : !murid ? (
            <div className={ui.state}>Memuat daftar murid...</div>
          ) : daftarMurid.length === 0 ? (
            <EmptyState title="Tidak ada murid" text="Belum ada murid di kelas ini atau tidak cocok dengan pencarian." />
          ) : (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Murid</th>
                    <th>NISN</th>
                    <th>Status</th>
                    <th>Waktu Kumpul</th>
                    <th className={ui.center}>Nilai</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {daftarMurid.map((m) => (
                    <tr key={m.siswa_id}>
                      <td>
                        <span className={ui.person}>
                          <Avatar nama={m.nama} foto={m.foto_url} size={32} />
                          <strong>{m.nama}</strong>
                        </span>
                      </td>
                      <td>{m.nisn || "-"}</td>
                      <td>
                        <span className={`${ui.badge} ${m.status === "selesai" ? (m.terlambat ? ui.badgeYellow : ui.badgeGreen) : m.status === "mengerjakan" ? ui.badgeYellow : ui.badgeGray}`}>
                          {m.status === "selesai" ? (m.terlambat ? "Selesai (terlambat)" : "Selesai") : m.status === "mengerjakan" ? "Mengerjakan" : "Belum"}
                        </span>
                      </td>
                      <td>{formatWaktu(m.waktu_kumpul)}</td>
                      <td className={ui.center}>
                        <span className={nilaiTone(m.nilai)}>{m.nilai ?? "-"}</span>
                      </td>
                      <td>
                        <div className={x.rowActions}>
                          {m.status === "selesai" ? (
                            <button type="button" className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`} disabled={bukaId === m.siswa_id} onClick={() => void bukaHasil(m)}>
                              {bukaId === m.siswa_id ? "Membuka..." : "Lihat Hasil"}
                            </button>
                          ) : (
                            <span className={ui.muted}>-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {soalModal && (
        <Modal
          title={soalModal.nomor === null ? "Tambah Soal" : `Edit Soal ${soalModal.nomor}`}
          size="lg"
          onClose={() => setSoalModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setSoalModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpanSoal()}>
                {busy ? "Menyimpan..." : "Simpan Soal"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label htmlFor="s-teks">Pertanyaan</label>
            <textarea id="s-teks" className={ui.textarea} value={soalForm.teks} onChange={(e) => setSoalForm({ ...soalForm, teks: e.target.value })} />
          </div>
          <div className={ui.field}>
            <label>Pilihan Jawaban (pilih bulatan untuk kunci jawaban)</label>
            {soalForm.opsi.map((o, i) => (
              <div key={i} className={x.opsiRow}>
                <input type="radio" name="kunci" checked={soalForm.kunci === i} onChange={() => setSoalForm({ ...soalForm, kunci: i })} aria-label={`Kunci jawaban ${KODE[i]}`} />
                <b>{KODE[i]}</b>
                <input className={ui.input} value={o} onChange={(e) => ubahOpsi(i, e.target.value)} placeholder={`Pilihan ${KODE[i]}`} aria-label={`Pilihan ${KODE[i]}`} />
                <button type="button" className={`${ui.iconBtn} ${ui.iconDanger}`} aria-label={`Hapus pilihan ${KODE[i]}`} disabled={soalForm.opsi.length <= 2} onClick={() => hapusOpsi(i)}>
                  <Icon name="trash" />
                </button>
              </div>
            ))}
            {soalForm.opsi.length < KODE.length && (
              <button type="button" className={`${ui.btn} ${ui.btnGhost} ${ui.btnSm}`} style={{ justifySelf: "start" }} onClick={tambahOpsi}>
                <Icon name="plus" />
                Tambah Pilihan
              </button>
            )}
          </div>
          <div className={ui.fieldRow}>
            <div className={ui.field}>
              <label htmlFor="s-poin">Poin</label>
              <input id="s-poin" type="number" min={1} className={ui.input} value={soalForm.poin} onChange={(e) => setSoalForm({ ...soalForm, poin: e.target.value })} />
            </div>
          </div>
          <div className={ui.field}>
            <label htmlFor="s-bahas">Pembahasan (Opsional)</label>
            <textarea id="s-bahas" className={ui.textarea} value={soalForm.pembahasan} onChange={(e) => setSoalForm({ ...soalForm, pembahasan: e.target.value })} />
          </div>
        </Modal>
      )}

      {hapusSoal && (
        <ConfirmDialog
          title="Hapus Soal"
          text={`Hapus soal nomor ${hapusSoal.nomor}? Nomor soal setelahnya akan bergeser.`}
          confirmLabel="Hapus Soal"
          busy={busy}
          onConfirm={() => void konfirmasiHapusSoal()}
          onCancel={() => setHapusSoal(null)}
        />
      )}

      {hasil && (
        <Modal
          title={`Hasil: ${hasil.siswa_nama}`}
          size="lg"
          onClose={() => setHasil(null)}
          footer={
            <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setHasil(null)}>
              Tutup
            </button>
          }
        >
          <div className={x.hasilTop}>
            <div className={x.stat}>
              <strong>{hasil.nilai ?? "-"}</strong>
              <span>Nilai (maks {hasil.nilai_maks})</span>
            </div>
            <div className={x.stat}>
              <strong>
                {hasil.jumlah_benar}/{hasil.jumlah_soal}
              </strong>
              <span>Jawaban benar</span>
            </div>
            <div className={x.stat}>
              <strong>{hasil.lulus ? "Lulus" : "Belum Lulus"}</strong>
              <span>KKM {hasil.kkm}</span>
            </div>
          </div>
          <p className={ui.muted} style={{ marginBottom: 14 }}>
            NISN {hasil.siswa_nisn || "-"} | Dikirim {formatWaktu(hasil.waktu_kumpul)}
            {!hasil.sudah_dikirim ? " | Belum dikirim" : ""}
          </p>
          <div className={x.soalList}>
            {hasil.detail.map((d) => (
              <article key={d.nomor} className={x.soalCard}>
                <div className={x.soalHead}>
                  <span className={ui.badge}>Soal {d.nomor}</span>
                  <span className={`${ui.badge} ${d.benar ? ui.badgeGreen : ui.badgeRed}`}>{d.benar ? `Benar (+${d.poin})` : "Salah"}</span>
                </div>
                <p className={x.soalTeks}>{d.teks}</p>
                <div className={x.opsiList}>
                  {d.opsi.map((o) => (
                    <div key={o.kode} className={[x.opsi, o.kode === d.kunci ? x.opsiBenar : o.kode === d.jawaban ? x.opsiSalah : ""].join(" ")}>
                      <b>{o.kode}.</b>
                      <span>
                        {o.teks}
                        {o.kode === d.jawaban ? " (jawaban siswa)" : ""}
                      </span>
                    </div>
                  ))}
                </div>
                {!d.jawaban && <p className={x.pembahasan}>Siswa tidak menjawab soal ini.</p>}
                {d.pembahasan && <p className={x.pembahasan}>Pembahasan: {d.pembahasan}</p>}
              </article>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}