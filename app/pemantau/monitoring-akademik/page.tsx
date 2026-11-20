"use client";

import { useEffect, useMemo, useState } from "react";
import { listPemantauanNilai } from "@/lib/pemantau";
import type { PemantauanNilaiItem } from "@/lib/pemantau";
import styles from "./page.module.css";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function MonitoringAkademikPage() {
  const [rows, setRows] = useState<PemantauanNilaiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("");
  const [pelajaran, setPelajaran] = useState("");
  const [jenis, setJenis] = useState("");

  useEffect(() => {
    let active = true;
    void listPemantauanNilai()
      .then((data) => { if (active) setRows(data); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const kelasOptions = useMemo(
    () => [...new Map(rows.map((row) => [row.kelas_id, row.kelas_nama])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "id")),
    [rows],
  );
  const pelajaranOptions = useMemo(
    () => [...new Map(rows.map((row) => [row.pelajaran_id, row.pelajaran_nama])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "id")),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("id");
    return rows.filter((row) => {
      const matchesSearch = !term || [
        row.siswa_nama, row.nisn, row.judul, row.guru_nama, row.pelajaran_nama, row.kelas_nama,
      ].some((value) => value.toLocaleLowerCase("id").includes(term));
      return matchesSearch
        && (!kelas || String(row.kelas_id) === kelas)
        && (!pelajaran || String(row.pelajaran_id) === pelajaran)
        && (!jenis || row.jenis === jenis);
    });
  }, [rows, search, kelas, pelajaran, jenis]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>PEMANTAUAN SEKOLAH</span>
          <h1>Monitoring Akademik</h1>
          <p>Nilai siswa berdasarkan tugas dan asesmen yang telah dikumpulkan.</p>
        </div>
        <div className={styles.count}>
          <strong>{loading ? "—" : filteredRows.length}</strong>
          <span>data nilai</span>
        </div>
      </header>

      <section className={styles.panel} aria-label="Daftar nilai siswa">
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className={styles.srOnly}>Cari siswa, NISN, tugas, atau pelajaran</span>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Cari nama siswa, NISN, tugas, atau pelajaran..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className={styles.selectLabel}>
            <span className={styles.srOnly}>Filter kelas</span>
            <select value={kelas} onChange={(event) => setKelas(event.target.value)}>
              <option value="">Semua kelas</option>
              {kelasOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className={styles.selectLabel}>
            <span className={styles.srOnly}>Filter pelajaran</span>
            <select value={pelajaran} onChange={(event) => setPelajaran(event.target.value)}>
              <option value="">Semua pelajaran</option>
              {pelajaranOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className={styles.selectLabel}>
            <span className={styles.srOnly}>Filter jenis penilaian</span>
            <select value={jenis} onChange={(event) => setJenis(event.target.value)}>
              <option value="">Semua jenis</option>
              <option value="Tugas">Tugas</option>
              <option value="Kuis">Kuis</option>
              <option value="Ujian">Ujian</option>
            </select>
          </label>
        </div>

        {error && <p className={styles.error} role="alert">Nilai belum dapat dimuat: {error}</p>}

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Kelas / Jurusan</th>
                <th>Pelajaran</th>
                <th>Tugas / Asesmen</th>
                <th>Jenis</th>
                <th>Nilai</th>
                <th>Guru</th>
                <th>Dikumpulkan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className={styles.empty} colSpan={8}>Memuat data nilai...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={8}>
                    {rows.length === 0 ? "Belum ada data pengumpulan nilai." : "Tidak ada nilai yang sesuai dengan pencarian."}
                  </td>
                </tr>
              ) : filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong className={styles.studentName}>{row.siswa_nama}</strong>
                    <span className={styles.subtext}>{row.nisn || "NISN tidak tersedia"}</span>
                  </td>
                  <td>
                    <strong>{row.kelas_nama || "-"}</strong>
                    <span className={styles.subtext}>{row.jurusan_nama || "-"}</span>
                  </td>
                  <td>{row.pelajaran_nama || "-"}</td>
                  <td>
                    <strong className={styles.assessmentTitle}>{row.judul}</strong>
                  </td>
                  <td><span className={styles.kind}>{row.jenis}</span></td>
                  <td>
                    {row.nilai === null ? (
                      <span className={styles.pending}>{row.status}</span>
                    ) : (
                      <strong className={styles.score}>{row.nilai}<span> / {row.nilai_maks}</span></strong>
                    )}
                  </td>
                  <td>{row.guru_nama || "-"}</td>
                  <td className={styles.date}>{formatDate(row.waktu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>Nilai yang belum diperiksa guru akan ditandai sebagai menunggu penilaian.</p>
      </section>
    </main>
  );
}
