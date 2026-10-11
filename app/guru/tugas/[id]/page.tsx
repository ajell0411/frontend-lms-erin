"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchGuruFile,
  getGuruPengumpulan,
  getGuruTugas,
  guruPengumpulanFilePath,
  nilaiGuruPengumpulan,
  type GuruPengumpulan,
  type GuruTugasDetail,
  type GuruTugasSiswa,
} from "@/lib/guru";
import { Avatar, EmptyState, FilePreview, Icon, Modal, formatWaktu, nilaiTone, pesanError, saveBlob, useNotice } from "../../ui";
import ui from "../../ui.module.css";
import x from "../../extra.module.css";

export default function DetailTugasPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [data, setData] = useState<GuruTugasDetail | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [bukaId, setBukaId] = useState<number | null>(null);
  const [nilaiModal, setNilaiModal] = useState<GuruPengumpulan | null>(null);
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");
  const [preview, setPreview] = useState<{ judul: string; blob: Blob; filename: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { show, node } = useNotice();

  const muat = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("Tugas tidak valid.");
      return;
    }
    try {
      setData(await getGuruTugas(id));
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Tugas gagal dimuat."));
    }
  }, [id]);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function bukaNilai(s: GuruTugasSiswa) {
    if (!s.pengumpulan_id) return;
    setBukaId(s.siswa_id);
    try {
      const p = await getGuruPengumpulan(s.pengumpulan_id);
      setNilaiModal(p);
      setNilai(p.nilai === null ? "" : String(p.nilai));
      setFeedback(p.feedback || "");
    } catch (reason) {
      show(pesanError(reason, "Pengumpulan gagal dibuka."), true);
    } finally {
      setBukaId(null);
    }
  }

  async function ambilFile(): Promise<{ blob: Blob; filename: string } | null> {
    if (!nilaiModal) return null;
    try {
      const hasil = await fetchGuruFile(guruPengumpulanFilePath(nilaiModal.id));
      return { blob: hasil.blob, filename: hasil.filename || nilaiModal.nama_file || "jawaban" };
    } catch (reason) {
      show(pesanError(reason, "File jawaban gagal dibuka."), true);
      return null;
    }
  }

  async function lihatFile() {
    const hasil = await ambilFile();
    if (hasil && nilaiModal) setPreview({ judul: `Jawaban ${nilaiModal.siswa_nama}`, ...hasil });
  }

  async function unduhFile() {
    const hasil = await ambilFile();
    if (hasil) saveBlob(hasil.blob, hasil.filename);
  }

  async function simpanNilai() {
    if (!nilaiModal) return;
    const n = Number(nilai);
    if (nilai.trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      show("Nilai harus berupa angka 0 sampai 100.", true);
      return;
    }
    setBusy(true);
    try {
      await nilaiGuruPengumpulan(nilaiModal.id, { nilai: n, feedback: feedback.trim() });
      show("Nilai disimpan.");
      setNilaiModal(null);
      await muat();
    } catch (reason) {
      show(pesanError(reason, "Nilai gagal disimpan."), true);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className={`${ui.state} ${ui.stateError}`}>{error}</div>;
  if (!data) return <div className={ui.state}>Memuat tugas...</div>;

  const kata = q.trim().toLowerCase();
  const siswa = data.siswa.filter((s) => !kata || s.nama.toLowerCase().includes(kata) || s.nisn.includes(kata));
  const belum = data.siswa.filter((s) => s.status === "belum").length;
  const dinilai = data.siswa.filter((s) => s.nilai !== null).length;

  return (
    <div>
      {node}
      <Link href="/guru/tugas" className={ui.back}>
        <Icon name="back" />
        Kembali ke Tugas
      </Link>
      <div className={ui.detailHead}>
        <div>
          <span className={`${ui.badge} ${data.aktif ? ui.badgeGreen : ui.badgeGray}`}>{data.aktif ? "Aktif" : "Nonaktif"}</span>
          <h1>{data.judul}</h1>
          <div className={x.metaLine}>
            <span>{data.kelas_nama}</span>
            <span>{data.pelajaran_nama}</span>
            <span>Deadline: {formatWaktu(data.deadline)}</span>
          </div>
          {data.deskripsi && <p className={ui.pageSub}>{data.deskripsi}</p>}
          {data.nama_lampiran && (
            <div className={x.lampiran}>
              <Icon name="file" />
              <span>Lampiran: {data.nama_lampiran}</span>
            </div>
          )}
        </div>
      </div>

      <div className={x.statRow}>
        <div className={x.stat}>
          <strong>
            {data.dikumpulkan}/{data.jumlah_siswa}
          </strong>
          <span>Sudah mengumpulkan</span>
        </div>
        <div className={x.stat}>
          <strong>{belum}</strong>
          <span>Belum mengumpulkan</span>
        </div>
        <div className={x.stat}>
          <strong>{dinilai}</strong>
          <span>Sudah dinilai</span>
        </div>
      </div>

      <div className={ui.toolbar}>
        <label className={ui.searchBox}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau NISN..." aria-label="Cari siswa" />
        </label>
      </div>

      {siswa.length === 0 ? (
        <EmptyState title="Tidak ada siswa" text="Belum ada siswa di kelas ini atau tidak cocok dengan pencarian." />
      ) : (
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Siswa</th>
                <th>NISN</th>
                <th>Status</th>
                <th>Waktu Kumpul</th>
                <th className={ui.center}>Nilai</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {siswa.map((s) => (
                <tr key={s.siswa_id}>
                  <td>
                    <span className={ui.person}>
                      <Avatar nama={s.nama} foto={s.foto_url} size={32} />
                      <strong>{s.nama}</strong>
                    </span>
                  </td>
                  <td>{s.nisn || "-"}</td>
                  <td>
                    {s.status === "dikumpulkan" ? (
                      <span className={`${ui.badge} ${s.terlambat ? ui.badgeYellow : ui.badgeGreen}`}>{s.terlambat ? "Terlambat" : "Dikumpulkan"}</span>
                    ) : (
                      <span className={`${ui.badge} ${ui.badgeGray}`}>Belum</span>
                    )}
                  </td>
                  <td>{formatWaktu(s.waktu_kumpul)}</td>
                  <td className={ui.center}>
                    <span className={nilaiTone(s.nilai)}>{s.nilai ?? "-"}</span>
                  </td>
                  <td>
                    <div className={x.rowActions}>
                      {s.pengumpulan_id ? (
                        <button type="button" className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`} disabled={bukaId === s.siswa_id} onClick={() => void bukaNilai(s)}>
                          {bukaId === s.siswa_id ? "Membuka..." : s.nilai === null ? "Beri Nilai" : "Ubah Nilai"}
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

      {nilaiModal && (
        <Modal
          title={`Penilaian: ${nilaiModal.siswa_nama}`}
          size="lg"
          onClose={() => setNilaiModal(null)}
          footer={
            <>
              <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={() => setNilaiModal(null)}>
                Batal
              </button>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => void simpanNilai()}>
                {busy ? "Menyimpan..." : "Simpan Nilai"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <div className={x.metaLine}>
              <span>NISN: {nilaiModal.siswa_nisn || "-"}</span>
              <span>Dikumpulkan: {formatWaktu(nilaiModal.waktu_submit)}</span>
              {nilaiModal.terlambat && <span className={`${ui.badge} ${ui.badgeYellow}`}>Terlambat</span>}
            </div>
          </div>
          <div className={ui.field}>
            <label>File Jawaban</label>
            {nilaiModal.ada_file ? (
              <>
                <div className={ui.fileNow}>
                  <Icon name="file" />
                  <span>{nilaiModal.nama_file}</span>
                </div>
                <div className={x.rowActions} style={{ justifyContent: "flex-start" }}>
                  <button type="button" className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`} onClick={() => void lihatFile()}>
                    <Icon name="eye" />
                    Lihat Jawaban
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} ${ui.btnSm}`} onClick={() => void unduhFile()}>
                    <Icon name="download" />
                    Unduh
                  </button>
                </div>
              </>
            ) : (
              <span className={ui.hint}>Siswa tidak melampirkan file atau file tidak tersedia di server.</span>
            )}
          </div>
          <div className={ui.field}>
            <label htmlFor="n-nilai">Nilai (0-100)</label>
            <input id="n-nilai" type="number" min={0} max={100} className={ui.input} value={nilai} onChange={(e) => setNilai(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label htmlFor="n-fb">Feedback (Opsional)</label>
            <textarea id="n-fb" className={ui.textarea} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
        </Modal>
      )}

      {preview && <FilePreview title={preview.judul} blob={preview.blob} filename={preview.filename} onClose={() => setPreview(null)} />}
    </div>
  );
}