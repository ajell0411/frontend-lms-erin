"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRole, welcomeTitle } from "@/lib/role";
import { timeAgo, useAktivitas } from "@/lib/aktivitas";
import { getPemantauStatistik } from "@/lib/pemantau";
import type { PemantauStatistik } from "@/lib/pemantau";
import { StatCard, SectionTitle, Svg } from "./StatCard";
import type { StatIcon } from "./StatCard";
import { ROUTES } from "./aksi";
import styles from "./page.module.css";

const JURUSAN = ["PPLG", "DKV", "MPLB", "TKJT", "BDR", "Perhotelan"];
const WARNA = ["#0057d9", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

const AKSI: { label: string; desc: string; href: string; icon: StatIcon }[] = [
  { label: "Tambah Admin", desc: "Buat akun admin baru", href: ROUTES.admin, icon: "admin" },
  { label: "Tambah Guru", desc: "Daftarkan guru pengajar", href: ROUTES.guru, icon: "guru" },
  { label: "Tambah Siswa", desc: "Daftarkan siswa baru", href: ROUTES.siswa, icon: "siswa" },
  { label: "Tambah Jurusan", desc: "Buat jurusan baru", href: ROUTES.jurusan, icon: "jurusan" },
  { label: "Tambah Kelas", desc: "Buat kelas baru", href: ROUTES.kelas, icon: "kelas" },
];

type DataJur = { nama: string; siswa: number; kelas: number | null; color: string };

function DonutJurusan({ data, total }: { data: DataJur[]; total: number }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const aktif = data.filter((x) => x.siswa > 0);
  const gap = aktif.length > 1 ? 3 : 0;
  let acc = 0;
  return (
    <div className={styles.donut2}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#eef2f7" strokeWidth="20" />
        {total > 0 &&
          aktif.map((x) => {
            const len = (x.siswa / total) * c;
            const off = acc;
            acc += len;
            const dash = Math.max(len - gap, 0.5);
            return (
              <circle
                key={x.nama}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={x.color}
                strokeWidth="20"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-off}
                transform="rotate(-90 80 80)"
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

export default function DashboardPage() {
  const { role, user } = useRole();
  const aktivitas = useAktivitas();
  const [stats, setStats] = useState<PemantauStatistik | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getPemantauStatistik()
      .then((d) => { if (active) setStats(d); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Terjadi kesalahan"); });
    return () => { active = false; };
  }, []);

  const n = (v?: number) => v ?? 0;

  const dataJur: DataJur[] = JURUSAN.map((j, i) => {
    const item = stats?.jurusan?.find((x) => String(x.kode ?? x.nama ?? "").toUpperCase() === j.toUpperCase());
    return {
      nama: j,
      siswa: n(item?.total_siswa),
      kelas: item?.total_kelas ?? null,
      color: WARNA[i % WARNA.length],
    };
  });
  const totalJur = dataJur.reduce((s, x) => s + x.siswa, 0);
  const maxJur = Math.max(...dataJur.map((x) => x.siswa), 1);

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerDate} aria-hidden="true"><small>{new Date().toLocaleDateString("id-ID", { weekday: "long" })}</small><strong>{new Date().getDate()}</strong><span>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span></div>
        <h1 className={styles.bannerTitle}>{welcomeTitle(role, user?.nama)}</h1>
        <p className={styles.bannerText}>
          Kelola akun, jurusan, kelas, dan pelajaran E-CLASS dari sini.
        </p>
      </section>

      {error && <p className={styles.empty} role="alert">Statistik belum dapat dimuat: {error}</p>}

      <section className={styles.group}>
        <SectionTitle title="Ringkasan Data" desc="Jumlah akun, kelas, dan jurusan di E-CLASS." />
        <div className={styles.statGrid}>
          <StatCard label="Total Admin" value={n(stats?.total_admin)} icon="admin" />
          <StatCard label="Total Guru" value={n(stats?.total_guru)} icon="guru" />
          <StatCard label="Total Siswa" value={n(stats?.total_siswa)} icon="siswa" />
          <StatCard label="Total Kelas" value={n(stats?.total_kelas)} icon="kelas" />
          <StatCard label="Total Jurusan" value={n(stats?.total_jurusan)} icon="jurusan" />
        </div>
      </section>

      <div className={styles.splitRow}>
        <section className={styles.panel}>
          <SectionTitle title="Statistik per Jurusan" desc="Jumlah murid dan kelas di setiap jurusan." />
          <div className={styles.statBox}>
            <DonutJurusan data={dataJur} total={totalJur} />
            <div className={styles.jurList2}>
              {dataJur.map((x) => (
                <div key={x.nama} className={styles.jurItem}>
                  <div className={styles.jurTop}>
                    <span className={styles.jurName2}>
                      <span className={styles.jurDot} style={{ background: x.color }} />
                      {x.nama}
                    </span>
                    <span className={styles.jurMeta}><b>{x.siswa}</b> murid · {x.kelas ?? 0} kelas</span>
                  </div>
                  <div className={styles.jurTrack}>
                    <div className={styles.jurFill} style={{ width: `${(x.siswa / maxJur) * 100}%`, background: x.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelFill}`}>
          <SectionTitle title="Aksi Cepat" desc="Tambah akun, jurusan, dan kelas dengan cepat." />
          <div className={styles.aksiGrid}>
            {AKSI.map((a) => (
              <Link key={a.label} href={a.href} className={styles.aksiItem}>
                <span className={styles.aksiIcon}><Svg name={a.icon} size={20} /></span>
                <span className={styles.aksiText}>
                  <span className={styles.aksiLabel}>{a.label}</span>
                  <span className={styles.aksiDesc}>{a.desc}</span>
                </span>
                <span className={styles.aksiPlus} aria-hidden="true">+</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <SectionTitle title="Aktivitas Terbaru" desc="Perubahan terbaru di E-CLASS." />
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