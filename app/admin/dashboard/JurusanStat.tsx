"use client";

import type { PemantauStatistik } from "@/lib/pemantau";
import { SectionTitle } from "./StatCard";
import styles from "./page.module.css";

const JURUSAN = ["PPLG", "DKV", "MPLB", "TKJT", "BDR", "Perhotelan"];
const WARNA = ["#0057d9", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

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
              <circle key={x.nama} cx="80" cy="80" r={r} fill="none" stroke={x.color} strokeWidth="20"
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-off} transform="rotate(-90 80 80)" />
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

export default function JurusanStat({ stats }: { stats: PemantauStatistik | null }) {
  const n = (v?: number) => v ?? 0;
  const dataJur: DataJur[] = JURUSAN.map((j, i) => {
    const item = stats?.jurusan?.find((x) => String(x.kode ?? x.nama ?? "").toUpperCase() === j.toUpperCase());
    return { nama: j, siswa: n(item?.total_siswa), kelas: item?.total_kelas ?? null, color: WARNA[i % WARNA.length] };
  });
  const totalJur = dataJur.reduce((s, x) => s + x.siswa, 0);
  const maxJur = Math.max(...dataJur.map((x) => x.siswa), 1);
  return (
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
  );
}