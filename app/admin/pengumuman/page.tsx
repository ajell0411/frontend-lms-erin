"use client";

import { timeAgo } from "@/lib/aktivitas";
import { removePengumuman, usePengumuman } from "@/lib/pengumuman";
import styles from "./page.module.css";

export default function PengumumanPage() {
  const daftar = usePengumuman();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pengumuman</h1>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Daftar Pengumuman</h2>
        {daftar.length === 0 && <p className={styles.empty}>Belum ada pengumuman.</p>}
        {daftar.map((p) => (
          <div key={p.id} className={styles.item}>
            <span className={styles.dot} />
            <div className={styles.text}>
              <p className={styles.itemTitle}>{p.judul}</p>
              {p.isi && <p className={styles.itemDesc}>{p.isi}</p>}
              <p className={styles.time}>{timeAgo(p.waktu)}</p>
            </div>
            <button
              type="button"
              className={styles.del}
              onClick={() => removePengumuman(p.id)}
            >
              Hapus
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}