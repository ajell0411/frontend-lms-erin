"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGuruDashboard, type GuruDashboard, type GuruJadwal } from "@/lib/guru";
import { WAVE } from "@/lib/role";
import styles from "./page.module.css";

function timeAgo(iso: string) {
  const menit = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return "Baru saja";
  if (menit < 60) return `${menit} menit yang lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam yang lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari yang lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function sedangBerlangsung(j: GuruJadwal) {
  const now = new Date();
  const menit = now.getHours() * 60 + now.getMinutes();
  const ke = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  return menit >= ke(j.jam_mulai) && menit < ke(j.jam_selesai);
}

type StatIcon = "kelas" | "tugas" | "asesmen" | "nilai";

function StatSvg({ name }: { name: StatIcon }) {
  const props = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "kelas") return <svg {...props}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
  if (name === "tugas") return <svg {...props}><path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><rect x="8" y="2" width="8" height="5" rx="1" /><path d="M8 12h8M8 16h5" /></svg>;
  if (name === "asesmen") return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3.5h6M8 10l2 2 5-5M8 17h8" /></svg>;
  return <svg {...props}><path d="M5 12l4 4 10-10" /></svg>;
}

export default function GuruDashboardPage() {
  const [data, setData] = useState<GuruDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getGuruDashboard()
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Dashboard gagal dimuat."));
  }, []);

  const tanggal = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (error) return <div className={styles.state}>{error}</div>;
  if (!data) return <div className={styles.state}>Memuat dashboard...</div>;

  const perlu = data.perlu_dinilai_list ?? [];

  const stats: { label: string; value: number; icon: StatIcon }[] = [
    { label: "Kelas Saya", value: data.jumlah_kelas, icon: "kelas" },
    { label: "Tugas Aktif", value: data.tugas_aktif, icon: "tugas" },
    { label: "Asesmen Aktif", value: data.asesmen_aktif, icon: "asesmen" },
    { label: "Perlu Dinilai", value: data.perlu_dinilai, icon: "nilai" },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div>
          <h1>Selamat datang, {data.nama || "Guru"} {WAVE}</h1>
          <p>Ringkasan kegiatan mengajarmu hari ini.</p>
        </div>
        <div className={styles.bannerDate} aria-label={tanggal}>
          <small>{new Date().toLocaleDateString("id-ID", { weekday: "long" })}</small>
          <strong>{new Date().getDate()}</strong>
          <span>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
        </div>
      </section>

      <section className={styles.stats} aria-label="Ringkasan">
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statIcon}><StatSvg name={s.icon} /></span>
            <span>
              <strong className={styles.statValue}>{s.value}</strong>
              <small className={styles.statLabel}>{s.label}</small>
            </span>
          </div>
        ))}
      </section>

      <div className={styles.splitRow}>
        <section className={styles.box}>
          <div className={styles.sectionHead}>
            <h2>Jadwal Hari Ini</h2>
            <Link href="/guru/jadwal">Lihat Semua</Link>
          </div>
          {data.jadwal_hari_ini.length === 0 ? (
            <div className={styles.empty}>Tidak ada jadwal mengajar hari ini.</div>
          ) : (
            <div className={styles.jadwalGrid}>
              {data.jadwal_hari_ini.map((j) => (
                <article key={j.id} className={styles.jadwal}>
                  <div className={styles.jadwalTop}>
                    <span className={styles.jam}>{j.jam_mulai} - {j.jam_selesai}</span>
                    {sedangBerlangsung(j) && <span className={styles.live}>Sedang berlangsung</span>}
                  </div>
                  <strong>{j.kelas_nama}</strong>
                  <small>{j.pelajaran_nama}{j.ruangan ? " \u2022 " + j.ruangan : ""}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.box}>
          <div className={styles.sectionHead}>
            <h2>Aktivitas Terbaru</h2>
            <Link href="/guru/pengumuman">Lihat Semua</Link>
          </div>
          {data.aktivitas.length === 0 ? (
            <div className={styles.empty}>Belum ada aktivitas siswa.</div>
          ) : (
            <div className={styles.activity}>
              {data.aktivitas.map((a, i) => (
                <div key={`${a.jenis}-${a.siswa_id}-${a.waktu}-${i}`} className={styles.activityItem}>
                  <span className={styles.activityIcon}><StatSvg name={a.jenis === "tugas" ? "tugas" : "asesmen"} /></span>
                  <div>
                    <p>
                      <strong>{a.siswa_nama || "Siswa"}</strong>{" "}
                      {a.jenis === "tugas" ? "mengumpulkan tugas" : "selesai mengerjakan asesmen"}{" "}
                      <strong>{a.judul}</strong>
                    </p>
                    <small>{timeAgo(a.waktu)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={`${styles.box} ${styles.boxFull}`}>
        <div className={styles.sectionHead}>
          <h2>Perlu Dinilai</h2>
          <Link href="/guru/tugas">Lihat Semua</Link>
        </div>
        {perlu.length === 0 ? (
          <div className={styles.empty}>Semua pengumpulan tugas sudah dinilai.</div>
        ) : (
          <div className={styles.nilaiList}>
            {perlu.map((p) => (
              <Link key={p.tugas_id} href={`/guru/tugas/${p.tugas_id}`} className={styles.nilaiItem}>
                <span className={styles.nilaiText}>
                  <strong>{p.judul}</strong>
                  <small>{[p.kelas_nama, p.jurusan_kode || p.jurusan_nama].filter(Boolean).join(" \u2022 ")}</small>
                </span>
                <span className={styles.nilaiJumlah}>{p.jumlah} belum dinilai</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}