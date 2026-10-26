"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listKelas } from "@/lib/api";
import type { KelasRecord } from "@/lib/api";
import { useViewMode } from "@/lib/view-mode";
import styles from "@/app/admin/data/jurusan/page.module.css";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}

export default function PemantauKelasPage() {
  const { basePath } = useViewMode();
  const [items, setItems] = useState<KelasRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    void listKelas().then((rows) => {
      if (active) setItems(rows);
    }).catch((error: unknown) => {
      if (active) setLoadError(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError("");
    setReloadKey((key) => key + 1);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Daftar Kelas</h1>
          <p className={styles.subtitle}>Seluruh kelas yang terdaftar di sekolah.</p>
        </div>
      </header>
      {loadError && <div className={styles.error} role="alert"><span>{loadError}</span><button type="button" onClick={retry}>Coba lagi</button></div>}
      <div className={styles.count}>{loading ? "Memuat data..." : `Menampilkan ${items.length} kelas`}</div>
      {loading ? (
        <div className={styles.state}>Memuat daftar kelas...</div>
      ) : loadError ? null : items.length === 0 ? (
        <div className={styles.state}><strong>Belum ada kelas</strong><span>Belum ada data kelas yang tersedia.</span></div>
      ) : (
        <section className={styles.grid} aria-label="Daftar kelas">
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.code}>{item.tingkat}</span>
              </div>
              <h2 className={styles.cardTitle}>{item.nama}</h2>
              {item.jurusan?.nama && <div className={styles.metaRow}><span>Jurusan</span><strong>{item.jurusan.nama}</strong></div>}
              <div className={styles.metaRow}><span>Wali Kelas</span><strong>{item.wali_kelas_nama || "Belum ditentukan"}</strong></div>
              <div className={styles.stats}>
                <span><strong>{item.jumlah_siswa}</strong> siswa</span>
              </div>
              <Link href={`${basePath}/data/kelas/${item.id}`} className={styles.cardLink}>Lihat Daftar Siswa <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}