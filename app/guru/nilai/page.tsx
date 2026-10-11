"use client";

import { useEffect, useMemo, useState } from "react";
import { getGuruNilai, listGuruKelas, type GuruKelasItem, type GuruNilaiData } from "@/lib/guru";
import { EmptyState, Icon, PageHead, pesanError, saveBlob } from "../ui";
import ui from "../ui.module.css";

function toneNilai(n: number | null) {
  if (n === null) return "";
  if (n >= 75) return "";
  return ui.chipRed;
}

function tonePredikat(p: string) {
  if (p === "-") return ui.chip;
  if (p.startsWith("A")) return `${ui.chip} ${ui.chipGreen}`;
  if (p.startsWith("B")) return `${ui.chip} ${ui.chipBlue}`;
  if (p === "C") return `${ui.chip} ${ui.chipYellow}`;
  return `${ui.chip} ${ui.chipRed}`;
}

function eksporCsv(d: GuruNilaiData) {
  const kepala: (string | number)[] = ["No", "Nama Siswa", "NISN", ...d.kolom.map((k) => k.judul), "Nilai Akhir", "Predikat"];
  const baris: (string | number)[][] = d.siswa.map((s, i) => [
    i + 1,
    s.nama,
    s.nisn,
    ...d.kolom.map((k) => s.nilai[k.key] ?? ""),
    s.nilai_akhir ?? "",
    s.predikat,
  ]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [kepala, ...baris].map((r) => r.map(esc).join(",")).join("\r\n");
  saveBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `rekap-nilai-${d.kelas_nama}.csv`);
}

export default function NilaiPage() {
  const [kelas, setKelas] = useState<GuruKelasItem[]>([]);
  const [pilih, setPilih] = useState("");
  const [data, setData] = useState<GuruNilaiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    listGuruKelas()
      .then((k) => {
        setKelas(k);
        if (k.length > 0) setPilih(String(k[0].id));
        else setLoading(false);
      })
      .catch((reason) => {
        setError(pesanError(reason, "Kelas gagal dimuat."));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!pilih) return;
    setLoading(true);
    getGuruNilai(Number(pilih))
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((reason) => setError(pesanError(reason, "Rekap nilai gagal dimuat.")))
      .finally(() => setLoading(false));
  }, [pilih]);

  const siswa = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return (data?.siswa ?? []).filter((s) => !kata || s.nama.toLowerCase().includes(kata) || s.nisn.includes(kata));
  }, [data, q]);

  return (
    <div>
      <PageHead
        title="Rekap Nilai"
        subtitle="Nilai tugas dan asesmen siswa per kelas."
        action={
          <button type="button" className={`${ui.btn} ${ui.btnExport}`} disabled={!data || data.siswa.length === 0} onClick={() => data && eksporCsv(data)}>
            <Icon name="download" />
            Export Data
          </button>
        }
      />

      <div className={ui.toolbar}>
        <label className={ui.searchBox}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama siswa..." aria-label="Cari siswa" />
        </label>
        <select value={pilih} onChange={(e) => setPilih(e.target.value)} aria-label="Pilih kelas">
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.kelas_nama} - {k.pelajaran_nama}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={ui.state}>Memuat rekap nilai...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : kelas.length === 0 ? (
        <EmptyState title="Belum ada kelas" text="Tambahkan kelas di menu Kelas Saya terlebih dahulu." />
      ) : !data || siswa.length === 0 ? (
        <EmptyState title="Tidak ada data siswa" text="Belum ada siswa di kelas ini atau tidak cocok dengan pencarian." />
      ) : (
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>NISN</th>
                {data.kolom.map((k) => (
                  <th key={k.key} className={ui.center} title={k.judul}>
                    {k.judul.length > 16 ? k.judul.slice(0, 15) + "\u2026" : k.judul}
                  </th>
                ))}
                <th className={ui.center}>Nilai Akhir</th>
                <th className={ui.center}>Predikat</th>
              </tr>
            </thead>
            <tbody>
              {siswa.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{s.nama}</strong>
                  </td>
                  <td>{s.nisn || "-"}</td>
                  {data.kolom.map((k) => {
                    const n = s.nilai[k.key] ?? null;
                    return (
                      <td key={k.key} className={ui.center}>
                        <span className={toneNilai(n)} style={n !== null && n < 75 ? { padding: "2px 8px", borderRadius: 6 } : undefined}>
                          {n ?? "-"}
                        </span>
                      </td>
                    );
                  })}
                  <td className={ui.center}>
                    <strong style={{ color: "var(--siswa-primary)" }}>{s.nilai_akhir ?? "-"}</strong>
                  </td>
                  <td className={ui.center}>
                    <span className={tonePredikat(s.predikat)}>{s.predikat}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}