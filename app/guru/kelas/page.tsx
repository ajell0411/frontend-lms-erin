"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listGuruKelas, type GuruKelasItem } from "@/lib/guru";
import { Avatar, EmptyState, PageHead, pesanError } from "../ui";
import ui from "../ui.module.css";

export default function KelasSayaPage() {
  const [items, setItems] = useState<GuruKelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const muat = useCallback(async () => {
    try {
      setItems(await listGuruKelas());
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Kelas gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(muat);
  }, [muat]);

  return (
    <div>
      <PageHead
        title="Kelas Saya"
        subtitle="Daftar kelas dan mata pelajaran ditetapkan oleh admin."
      />

      {loading ? (
        <div className={ui.state}>Memuat kelas...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada kelas" text="Admin belum menetapkan kelas dan mata pelajaran untuk Anda." />
      ) : (
        <div className={ui.grid3}>
          {items.map((k) => (
            <article key={k.id} className={ui.classCard}>
              <div className={ui.classTop}>
                <span className={ui.badge}>Tingkat {k.tingkat}</span>
              </div>
              <h3>{k.kelas_nama}</h3>
              <p className={ui.muted}>{k.pelajaran_nama}</p>
              <div className={ui.avatarRow}>
                <span className={ui.avatarStack}>
                  {k.siswa_preview.map((s, i) => (
                    <Avatar key={`${s.nama}-${i}`} nama={s.nama} foto={s.foto_url} size={26} />
                  ))}
                </span>
                <span>{k.jumlah_siswa} Siswa</span>
              </div>
              <Link href={`/guru/kelas/${k.id}`} className={`${ui.btn} ${ui.btnOutline} ${ui.btnBlock}`}>
                Lihat Detail Kelas
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}