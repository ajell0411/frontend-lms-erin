"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRole, welcomeTitle } from "@/lib/role";
import { timeAgo } from "@/lib/aktivitas";
import { getPemantauStatistik, listAktivitasGuru } from "@/lib/pemantau";
import type { AktivitasGuruItem, PemantauStatistik } from "@/lib/pemantau";
import { StatCard, SectionTitle } from "@/app/admin/dashboard/StatCard";
import JurusanStat from "@/app/admin/dashboard/JurusanStat";
import styles from "@/app/admin/dashboard/page.module.css";

const JENIS_LABEL: Record<string, string> = { materi: "Materi", tugas: "Tugas", ulangan: "Ulangan" };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan";
}

export default function PemantauDashboardPage() {
  const { role, user } = useRole();
  const [stats, setStats] = useState<PemantauStatistik | null>(null);
  const [statsError, setStatsError] = useState("");
  const [acts, setActs] = useState<AktivitasGuruItem[]>([]);
  const [actsLoading, setActsLoading] = useState(true);
  const [actsError, setActsError] = useState("");

  useEffect(() => {
    let active = true;
    void getPemantauStatistik()
      .then((data) => { if (active) setStats(data); })
      .catch((e: unknown) => { if (active) setStatsError(errorMessage(e)); });
    void listAktivitasGuru({ limit: 5 })
      .then((rows) => { if (active) setActs(rows); })
      .catch((e: unknown) => { if (active) setActsError(errorMessage(e)); })
      .finally(() => { if (active) setActsLoading(false); });
    return () => { active = false; };
  }, []);

  const n = (v?: number) => v ?? 0;

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerDate} aria-hidden="true"><small>{new Date().toLocaleDateString("id-ID", { weekday: "long" })}</small><strong>{new Date().getDate()}</strong><span>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span></div>
        <h1 className={styles.bannerTitle}>{welcomeTitle(role, user?.nama)}</h1>
        <p className={styles.bannerText}>
          Pantau data akademik dan aktivitas guru E-CLASS dari sini.
        </p>
      </section>

      {statsError && <p className={styles.empty} role="alert">Statistik belum dapat dimuat: {statsError}</p>}

      <section className={styles.group}>
        <SectionTitle title="Ringkasan Data" desc="Jumlah guru, siswa, kelas, dan jurusan." />
        <div className={`${styles.statGrid} ${styles.statGrid4}`}>
          <StatCard label="Total Guru" value={n(stats?.total_guru)} icon="guru" />
          <StatCard label="Total Siswa" value={n(stats?.total_siswa)} icon="siswa" />
          <StatCard label="Total Kelas" value={n(stats?.total_kelas)} icon="kelas" />
          <StatCard label="Total Jurusan" value={n(stats?.total_jurusan)} icon="jurusan" />
        </div>
      </section>

      <div className={styles.splitRow}>
        <JurusanStat stats={stats} />

        <section className={`${styles.panel} ${styles.panelFill}`}>
          <div className={styles.panelHead}>
            <SectionTitle title="Aktivitas Guru Terbaru" desc="Materi, tugas, dan ulangan terbaru dari guru." />
            <Link href="/pemantau/aktivitas-guru" className={styles.seeAll}>
              Lihat Semua
            </Link>
          </div>
          {actsLoading && <p className={styles.empty}>Memuat aktivitas...</p>}
          {!actsLoading && actsError && <p className={styles.empty} role="alert">{actsError}</p>}
          {!actsLoading && !actsError && acts.length === 0 && <p className={styles.empty}>Belum ada aktivitas guru.</p>}
          <div className={styles.actList}>
            {acts.map((a) => (
              <Link key={`${a.jenis}-${a.id}`} href="/pemantau/aktivitas-guru" className={styles.actItem}>
                <span className={styles.actDot} />
                <span className={styles.actText}>
                  <span className={styles.actTitle}>{a.judul}</span>
                  <span className={styles.actDesc}>
                    {[a.guru_nama, JENIS_LABEL[a.jenis] ?? a.jenis, a.kelas, a.pelajaran].join(" \u00b7 ")}
                  </span>
                </span>
                <span className={styles.actTime}>{timeAgo(a.dibuat_pada)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}