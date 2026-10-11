"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGuruKelas, type GuruKelasDetail } from "@/lib/guru";
import { Avatar, EmptyState, Icon, nilaiTone, pesanError } from "../../ui";
import ui from "../../ui.module.css";

export default function DetailKelasPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [data, setData] = useState<GuruKelasDetail | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("Kelas tidak valid.");
      return;
    }
    getGuruKelas(id)
      .then(setData)
      .catch((reason) => setError(pesanError(reason, "Kelas gagal dimuat.")));
  }, [id]);

  const siswa = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return (data?.siswa ?? []).filter((s) => !kata || s.nama.toLowerCase().includes(kata) || s.nisn.includes(kata));
  }, [data, q]);

  if (error) return <div className={`${ui.state} ${ui.stateError}`}>{error}</div>;
  if (!data) return <div className={ui.state}>Memuat kelas...</div>;

  return (
    <div>
      <Link href="/guru/kelas" className={ui.back}>
        <Icon name="back" />
        Kembali ke Kelas Saya
      </Link>
      <div className={ui.detailHead}>
        <div>
          <span className={ui.badge}>{data.pelajaran_nama}</span>
          <h1>{data.kelas_nama}</h1>
          <p className={ui.muted}>{data.jumlah_siswa} Siswa Terdaftar</p>
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
                <th>Nama Tugas</th>
                <th className={ui.center}>Nilai Tugas</th>
                <th>Nama Asesmen</th>
                <th className={ui.center}>Nilai Asesmen</th>
              </tr>
            </thead>
            <tbody>
              {siswa.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className={ui.person}>
                      <Avatar nama={s.nama} foto={s.foto_url} size={32} />
                      <strong>{s.nama}</strong>
                    </span>
                  </td>
                  <td>{s.nisn || "-"}</td>
                  <td>{s.tugas_judul || "-"}</td>
                  <td className={ui.center}>
                    <span className={nilaiTone(s.tugas_nilai)}>{s.tugas_nilai ?? "-"}</span>
                  </td>
                  <td>{s.asesmen_judul || "-"}</td>
                  <td className={ui.center}>
                    <span className={nilaiTone(s.asesmen_nilai)}>{s.asesmen_nilai ?? "-"}</span>
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