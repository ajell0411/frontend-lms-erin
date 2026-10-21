"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRole } from "@/lib/role";
import { timeAgo } from "@/lib/aktivitas";
import { getPemantauStatistik, listAktivitasGuru } from "@/lib/pemantau";
import type { AktivitasGuruItem, PemantauStatistik } from "@/lib/pemantau";
import styles from "@/app/admin/dashboard/page.module.css";

const JENIS_LABEL: Record<string, string> = { materi: "Materi", tugas: "Tugas", ulangan: "Ulangan" };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan";
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

export default function PemantauDashboardPage() {
  const { user } = useRole();
  const nama = user?.nama ?? "Pemantau";
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
    void listAktivitasGuru({ limit: 8 })
      .then((rows) => { if (active) setActs(rows); })
      .catch((e: unknown) => { if (active) setActsError(errorMessage(e)); })
      .finally(() => { if (active) setActsLoading(false); });
    return () => { active = false; };
  }, []);

  const kartu = [
    { label: "Total Guru", value: stats?.total_guru ?? 0 },
    { label: "Total Siswa", value: stats?.total_siswa ?? 0 },
    { label: "Total Kelas", value: stats?.total_kelas ?? 0 },
    { label: "Total Jurusan", value: stats?.total_jurusan ?? 0 },
    { label: "Total Pelajaran", value: stats?.total_pelajaran ?? 0 },
  ];
  const maxRing = Math.max(...kartu.map((k) => k.value), 1);

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerDate} aria-hidden="true"><small>{new Date().toLocaleDateString("id-ID", { weekday: "long" })}</small><strong>{new Date().getDate()}</strong><span>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span></div>
        <h1 className={styles.bannerTitle}>Selamat datang, {nama}</h1>
        <p className={styles.bannerText}>
          Pantau data akademik dan aktivitas guru E-CLASS dari sini.
        </p>
      </section>

      {statsError && <p className={styles.empty} role="alert">Statistik belum dapat dimuat: {statsError}</p>}

      <section className={styles.cards} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {kartu.map((k) => (
          <div key={k.label} className={styles.card}>
            <p className={styles.cardLabel}>{k.label}</p>
            <Ring value={k.value} max={maxRing} />
          </div>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Aktivitas Guru Terbaru</h2>
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
                <span className={styles.actDesc}>{a.guru_nama} · {JENIS_LABEL[a.jenis] ?? a.jenis} · {a.kelas} · {a.pelajaran}</span>
              </span>
              <span className={styles.actTime}>{timeAgo(a.dibuat_pada)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}