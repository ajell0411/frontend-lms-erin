"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken, getUser } from "@/lib/api";
import { useRole } from "@/lib/role";
import { timeAgo, useAktivitas } from "@/lib/aktivitas";
import styles from "./page.module.css";

// Ubah kalau alamat backend-mu berbeda
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const JURUSAN = ["PPLG", "DKV", "MPLB", "TKJT", "BDR", "Perhotelan"];

type Obj = Record<string, unknown>;
type Stats = {
  admin: number;
  guru: number;
  siswa: number;
  kelas: number;
  jurusan: Record<string, number>;
};

const KOSONG: Stats = { admin: 0, guru: 0, siswa: 0, kelas: 0, jurusan: {} };

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pick(o: Obj, keys: string[]): number {
  for (const k of keys) {
    if (k in o) return num(o[k]);
  }
  return 0;
}

function parseStats(json: unknown): Stats {
  const root: Obj = isObj(json) ? json : {};
  const d: Obj = isObj(root.data) ? root.data : root;
  const jur: Record<string, number> = {};
  const list = d.jurusan ?? d.per_jurusan ?? d.jurusan_stats;
  if (Array.isArray(list)) {
    for (const it of list) {
      if (!isObj(it)) continue;
      const nama = String(it.kode ?? it.nama ?? it.jurusan ?? it.name ?? "").toUpperCase();
      jur[nama] = pick(it, ["total_siswa", "jumlah_siswa", "siswa", "total", "jumlah", "count"]);
    }
  }
  return {
    admin: pick(d, ["total_admin", "totalAdmin", "admin"]),
    guru: pick(d, ["total_guru", "totalGuru", "guru"]),
    siswa: pick(d, ["total_siswa", "totalSiswa", "siswa"]),
    kelas: pick(d, ["total_kelas", "totalKelas", "kelas"]),
    jurusan: jur,
  };
}

const WARNA = ["#0057d9", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

function parseKelasJur(json: unknown): Record<string, number> {
  const root: Obj = isObj(json) ? json : {};
  const d: Obj = isObj(root.data) ? root.data : root;
  const out: Record<string, number> = {};
  const list = d.jurusan ?? d.per_jurusan ?? d.jurusan_stats;
  if (Array.isArray(list)) {
    for (const it of list) {
      if (!isObj(it)) continue;
      const keys = ["total_kelas", "jumlah_kelas", "kelas"];
      if (!keys.some((k) => k in it)) continue;
      const nama = String(it.kode ?? it.nama ?? it.jurusan ?? it.name ?? "").toUpperCase();
      out[nama] = pick(it, keys);
    }
  }
  return out;
}

type DataJur = { nama: string; siswa: number; kelas: number | null; color: string };

function DonutJurusan({ data, total }: { data: DataJur[]; total: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className={styles.donut}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#e2e8f0" strokeWidth="26" />
        {total > 0 &&
          data
            .filter((x) => x.siswa > 0)
            .map((x) => {
              const len = (x.siswa / total) * c;
              const off = acc;
              acc += len;
              return (
                <circle
                  key={x.nama}
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke={x.color}
                  strokeWidth="26"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-off}
                  transform="rotate(-90 100 100)"
                />
              );
            })}
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutNum}>{total}</span>
        <span className={styles.donutLbl}>murid</span>
      </div>
    </div>
  );
}
function Ring({ value, max }: { value: number; max: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className={styles.ring}>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="#0057d9"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 42 42)"
        />
      </svg>
      <span className={styles.ringValue}>{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  useRole();
  const aktivitas = useAktivitas();
  const [stats, setStats] = useState<Stats>(KOSONG);
  const [kelasJur, setKelasJur] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [nama, setNama] = useState("admin");

  useEffect(() => {
    const sessionUser = getUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize the display name from browser storage after mount
    if (sessionUser?.nama) setNama(sessionUser.nama);

    fetch(`${API}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server membalas status ${res.status}`);
        const json = await res.json();
        setStats(parseStats(json));
        setKelasJur(parseKelasJur(json));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Terjadi kesalahan"));
  }, []);

  const maxRing = Math.max(stats.admin, stats.guru, stats.siswa, stats.kelas, 1);
  const dataJur: DataJur[] = JURUSAN.map((j, i) => ({
    nama: j,
    siswa: stats.jurusan[j.toUpperCase()] ?? 0,
    kelas: kelasJur[j.toUpperCase()] ?? null,
    color: WARNA[i % WARNA.length],
  }));
  const totalJur = dataJur.reduce((s, x) => s + x.siswa, 0);

  const kartu = [
    { label: "Total Admin", value: stats.admin },
    { label: "Total Guru", value: stats.guru },
    { label: "Total Siswa", value: stats.siswa },
    { label: "Total Kelas", value: stats.kelas },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <h1 className={styles.bannerTitle}>Selamat datang {nama}</h1>
        <p className={styles.bannerText}>
          {error ? `Gagal memuat data: ${error}` : "Ringkasan data sekolah hari ini."}
        </p>
      </section>

      <section className={styles.cards}>
        {kartu.map((k) => (
          <div key={k.label} className={styles.card}>
            <p className={styles.cardLabel}>{k.label}</p>
            <Ring value={k.value} max={maxRing} />
          </div>
        ))}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Statistik per Jurusan</h2>

        <div className={styles.statWrap}>
          <DonutJurusan data={dataJur} total={totalJur} />
          <div className={styles.legend}>
            <div className={styles.legendHead}>
              <span>Jurusan</span>
              <span>Murid</span>
              <span>Kelas</span>
            </div>
            {dataJur.map((x) => (
              <div key={x.nama} className={styles.legendRow}>
                <span className={styles.legendName}>
                  <span className={styles.legendDot} style={{ background: x.color }} />
                  {x.nama}
                </span>
                <span>{x.siswa}</span>
                <span>{x.kelas ?? "-"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Aktivitas Terbaru</h2>
          <Link href="/admin/pengumuman" className={styles.seeAll}>
            Lihat Semua
          </Link>
        </div>
        {aktivitas.length === 0 && <p className={styles.empty}>Belum ada aktivitas.</p>}
        <div className={styles.actList}>
          {aktivitas.slice(0, 5).map((a) => (
            <Link key={a.id} href="/admin/pengumuman" className={styles.actItem}>
              <span className={styles.actDot} />
              <span className={styles.actText}>
                <span className={styles.actTitle}>{a.judul}</span>
                <span className={styles.actDesc}>{a.deskripsi}</span>
              </span>
              <span className={styles.actTime}>{timeAgo(a.waktu)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
