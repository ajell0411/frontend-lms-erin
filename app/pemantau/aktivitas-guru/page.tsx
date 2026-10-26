"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { listGuru, listKelas, listPelajaran } from "@/lib/api";
import type { GuruAccount, KelasRecord, PelajaranRecord } from "@/lib/api";
import { getAktivitasGuruDetail, listAktivitasGuru } from "@/lib/pemantau";
import type { AktivitasGuruDetail, AktivitasGuruItem, JenisAktivitas } from "@/lib/pemantau";
import { formatWaktu } from "@/app/guru/ui";
import base from "@/app/admin/akun/guru/page.module.css";
import styles from "./page.module.css";

type Tab = "semua" | JenisAktivitas;

const TABS: [Tab, string][] = [["semua", "Semua"], ["materi", "Materi"], ["tugas", "Tugas"], ["ulangan", "Ulangan"]];
const JENIS_LABEL: Record<JenisAktivitas, string> = { materi: "Materi", tugas: "Tugas", ulangan: "Ulangan" };
const JENIS_CLASS: Record<JenisAktivitas, string> = { materi: styles.badgeMateri, tugas: styles.badgeTugas, ulangan: styles.badgeUlangan };

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}

function bolehDibuka(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith("/uploads/");
}

function namaFile(url: string): string {
  const last = url.split("?")[0].split("/").filter(Boolean).pop() ?? url;
  try { return decodeURIComponent(last); } catch { return last; }
}

function Chevron() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={base.selectChevron}><path d="m7 10 5 5 5-5" /></svg>;
}

function Info({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <label className={`${base.field} ${full ? base.fullWidth : ""}`}><span>{label}</span><input readOnly value={value} /></label>;
}

function LongInfo({ label, children }: { label: string; children: ReactNode }) {
  return <label className={`${base.field} ${base.fullWidth}`}><span>{label}</span><div className={styles.longText}>{children}</div></label>;
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return <>-</>;
  return <span className={status === "Aktif" ? base.activeBadge : `${styles.badge} ${styles.badgeDone}`}>{status}</span>;
}

export default function AktivitasGuruPage() {
  const [tab, setTab] = useState<Tab>("semua");
  const [guruId, setGuruId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [pelajaranId, setPelajaranId] = useState("");
  const [tglAwal, setTglAwal] = useState("");
  const [tglAkhir, setTglAkhir] = useState("");
  const [q, setQ] = useState("");

  const [items, setItems] = useState<AktivitasGuruItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [guruList, setGuruList] = useState<GuruAccount[]>([]);
  const [kelasList, setKelasList] = useState<KelasRecord[]>([]);
  const [pelajaranList, setPelajaranList] = useState<PelajaranRecord[]>([]);
  const [optionError, setOptionError] = useState("");

  const [selected, setSelected] = useState<AktivitasGuruItem | null>(null);
  const [detail, setDetail] = useState<AktivitasGuruDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const dateInvalid = Boolean(tglAwal && tglAkhir && tglAwal > tglAkhir);

  useEffect(() => {
    let active = true;
    void listGuru().then((rows) => { if (active) setGuruList(rows); }).catch((e: unknown) => { if (active) setOptionError(`Daftar guru gagal dimuat: ${message(e)}`); });
    void listKelas().then((rows) => { if (active) setKelasList(rows); }).catch((e: unknown) => { if (active) setOptionError(`Daftar kelas gagal dimuat: ${message(e)}`); });
    void listPelajaran().then((rows) => { if (active) setPelajaranList(rows); }).catch((e: unknown) => { if (active) setOptionError(`Daftar pelajaran gagal dimuat: ${message(e)}`); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (dateInvalid) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void listAktivitasGuru({ jenis: tab, guru: guruId, kelas: kelasId, pelajaran: pelajaranId, tanggal_awal: tglAwal, tanggal_akhir: tglAkhir, q: q.trim(), limit: 200 })
        .then((rows) => { if (active) setItems(rows); })
        .catch((e: unknown) => { if (active) setError(message(e)); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [tab, guruId, kelasId, pelajaranId, tglAwal, tglAkhir, q, dateInvalid, reloadKey]);

  useEffect(() => {
    if (!selected) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [selected]);

  function openDetail(item: AktivitasGuruItem) {
    setSelected(item);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    void getAktivitasGuruDetail(item.jenis, item.id)
      .then((data) => setDetail(data))
      .catch((e: unknown) => setDetailError(message(e)))
      .finally(() => setDetailLoading(false));
  }

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }

  const d: AktivitasGuruDetail | null = selected ? { ...selected, ...(detail ?? {}) } : null;
  const kriteria = d?.kriteria ? (Array.isArray(d.kriteria) ? d.kriteria.join("\n") : d.kriteria) : "";

  return (
    <div className={base.page}>
      <header className={base.pageHeader}>
        <div className={base.titleBlock}>
          <h1 className={base.title}>Aktivitas Guru</h1>
          <p className={base.subtitle}>Pantau materi, tugas, dan ulangan yang dibuat guru.</p>
        </div>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Jenis aktivitas">
        {TABS.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`} onClick={() => setTab(value)}>{label}</button>
        ))}
      </div>

      {error && <div className={base.errorMessage} role="alert"><span>{error}</span><button type="button" className={base.retryButton} onClick={retry}>Coba lagi</button></div>}

      <section className={base.panel} aria-label="Daftar aktivitas guru">
        <div className={base.toolbar}>
          <label className={base.searchBox}><svg aria-hidden="true" viewBox="0 0 24 24" className={base.searchIcon}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg><span className={base.visuallyHidden}>Cari judul</span><input type="search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari judul..." /></label>
          <label className={base.roleFilter}><span className={base.visuallyHidden}>Filter guru</span><select value={guruId} onChange={(event) => setGuruId(event.target.value)}><option value="">Semua Guru</option>{guruList.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}</select><Chevron /></label>
          <label className={base.roleFilter}><span className={base.visuallyHidden}>Filter kelas</span><select value={kelasId} onChange={(event) => setKelasId(event.target.value)}><option value="">Semua Kelas</option>{kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</select><Chevron /></label>
          <label className={base.roleFilter}><span className={base.visuallyHidden}>Filter pelajaran</span><select value={pelajaranId} onChange={(event) => setPelajaranId(event.target.value)}><option value="">Semua Pelajaran</option>{pelajaranList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select><Chevron /></label>
          <label className={styles.dateField}><span>Dari</span><input type="date" value={tglAwal} max={tglAkhir || undefined} onChange={(event) => setTglAwal(event.target.value)} /></label>
          <label className={styles.dateField}><span>Sampai</span><input type="date" value={tglAkhir} min={tglAwal || undefined} onChange={(event) => setTglAkhir(event.target.value)} /></label>
          <span className={base.resultCount}>{loading ? "Memuat data..." : `${items.length} aktivitas`}</span>
        </div>
        {dateInvalid && <p className={styles.dateError} role="alert">Tanggal awal tidak boleh lebih besar dari tanggal akhir.</p>}
        {optionError && <p className={styles.dateError} role="alert">{optionError}</p>}

        <div className={base.tableScroll}>
          <table className={base.table}>
            <thead><tr><th>Guru</th><th>Jenis</th><th>Judul</th><th>Kelas</th><th>Pelajaran</th><th>Waktu dibuat</th><th>Deadline</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className={base.stateCell}><span className={base.spinner} />Memuat aktivitas guru...</td></tr>
                : error ? <tr><td colSpan={8} className={base.stateCell}>Aktivitas guru belum dapat dimuat.</td></tr>
                : items.length === 0 ? <tr><td colSpan={8} className={base.emptyCell}><span className={base.emptyMark}>A</span><strong>Belum ada aktivitas</strong><span>Tidak ada aktivitas guru yang cocok dengan filter ini.</span></td></tr>
                : items.map((item) => (
                  <tr key={`${item.jenis}-${item.id}`} className={styles.clickRow} tabIndex={0} onClick={() => openDetail(item)} onKeyDown={(event) => { if (event.key === "Enter") openDetail(item); }}>
                    <td>{item.guru_nama || "-"}</td>
                    <td><span className={`${styles.badge} ${JENIS_CLASS[item.jenis] ?? ""}`}>{JENIS_LABEL[item.jenis] ?? item.jenis}</span></td>
                    <td className={styles.titleCell}>{item.judul}</td>
                    <td>{item.kelas || "-"}</td>
                    <td>{item.pelajaran || "-"}</td>
                    <td>{formatWaktu(item.dibuat_pada)}</td>
                    <td>{item.deadline ? formatWaktu(item.deadline) : "-"}</td>
                    <td><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <footer className={base.tableFooter}>Menampilkan {loading ? "-" : items.length} aktivitas</footer>
      </section>

      {selected && d && (
        <div className={base.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className={base.dialog} role="dialog" aria-modal="true" aria-labelledby="aktivitas-detail-title">
            <header className={base.dialogHeader}>
              <div className={base.dialogHeading}>
                <span className={base.headerIcon}><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></span>
                <div><h2 id="aktivitas-detail-title">Detail {JENIS_LABEL[d.jenis] ?? "Aktivitas"}</h2><p>Informasi lengkap aktivitas ini.</p></div>
              </div>
              <button type="button" className={base.closeButton} aria-label="Tutup" onClick={() => setSelected(null)}>×</button>
            </header>
            <div className={base.form}>
              <section className={base.formSection}>
                <h3 className={base.sectionTitle}>Informasi Umum</h3>
                <div className={base.accountGrid}>
                  <Info label="Guru" value={d.guru_nama || "-"} />
                  <Info label="Jenis" value={JENIS_LABEL[d.jenis] ?? d.jenis} />
                  <Info label="Judul" value={d.judul || "-"} full />
                  <Info label="Kelas" value={d.kelas || "-"} />
                  <Info label="Pelajaran" value={d.pelajaran || "-"} />
                  <Info label="Waktu dibuat" value={formatWaktu(d.dibuat_pada)} />
                  <Info label="Deadline" value={d.deadline ? formatWaktu(d.deadline) : "-"} />
                  <Info label="Status" value={d.status || "-"} />
                </div>
              </section>

              {detailLoading && <p className={base.subtitle}>Memuat rincian...</p>}
              {detailError && <p className={base.formError} role="alert">{detailError}</p>}

              {!detailLoading && detail && (
                <section className={base.formSection}>
                  <h3 className={base.sectionTitle}>Rincian</h3>
                  <div className={base.accountGrid}>
                    {d.kategori_ulangan && <Info label="Kategori" value={d.kategori_ulangan === "kuis" ? "Kuis" : "Ujian Harian"} />}
                    {typeof d.durasi_menit === "number" && <Info label="Durasi" value={`${d.durasi_menit} menit`} />}
                    {d.jadwal_mulai && <Info label="Jadwal mulai" value={formatWaktu(d.jadwal_mulai)} />}
                    {d.jadwal_selesai && <Info label="Jadwal selesai" value={formatWaktu(d.jadwal_selesai)} />}
                    {typeof d.bobot === "number" && <Info label="Bobot" value={String(d.bobot)} />}
                    {typeof d.jumlah_siswa === "number" && <Info label="Jumlah siswa" value={String(d.jumlah_siswa)} />}
                    {typeof d.jumlah_pengumpulan === "number" && <Info label="Jumlah pengumpulan" value={typeof d.jumlah_siswa === "number" ? `${d.jumlah_pengumpulan} dari ${d.jumlah_siswa} siswa` : String(d.jumlah_pengumpulan)} />}
                    {d.deskripsi && <LongInfo label="Deskripsi">{d.deskripsi}</LongInfo>}
                    {d.instruksi && <LongInfo label="Instruksi">{d.instruksi}</LongInfo>}
                    {kriteria && <LongInfo label="Kriteria">{kriteria}</LongInfo>}
                    {d.file_url && (
                      <label className={`${base.field} ${base.fullWidth}`}>
                        <span>File</span>
                        <div className={styles.fileRow}>
                          <span>{namaFile(d.file_url)}</span>
                          {bolehDibuka(d.file_url) && <a className={styles.fileLink} href={d.file_url} target="_blank" rel="noopener noreferrer">Unduh</a>}
                        </div>
                      </label>
                    )}
                  </div>
                </section>
              )}

              <footer className={base.dialogActions}>
                <button type="button" className={base.cancelButton} onClick={() => setSelected(null)}>Tutup</button>
              </footer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}