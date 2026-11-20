"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listGuruKelas, type GuruKelasItem } from "@/lib/guru";
import { Avatar, EmptyState, PageHead, pesanError } from "../ui";
import ui from "../ui.module.css";
import styles from "./page.module.css";

export default function KelasSayaPage() {
  const [items, setItems] = useState<GuruKelasItem[]>([]);
  const [search, setSearch] = useState("");
  const [angkatanFilter, setAngkatanFilter] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("");
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

  const angkatanOptions = Array.from(new Set(items.map((item) => item.tingkat).filter((value) => value.trim() !== "")))
    .sort((a, b) => a.localeCompare(b, "id-ID"));
  const jurusanOptions = Array.from(new Set(items.map((item) => item.jurusan_nama).filter((value) => value.trim() !== "")))
    .sort((a, b) => a.localeCompare(b, "id-ID"));
  const query = search.trim().toLocaleLowerCase("id-ID");
  const filteredItems = items.filter((item) =>
    (!query || `${item.kelas_nama} ${item.pelajaran_nama} ${item.jurusan_nama}`.toLocaleLowerCase("id-ID").includes(query)) &&
    (!angkatanFilter || item.tingkat === angkatanFilter) &&
    (!jurusanFilter || item.jurusan_nama === jurusanFilter),
  );

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
        <>
          <div className={styles.filters}>
            <input
              className={ui.input}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kelas, pelajaran, atau jurusan..."
              aria-label="Cari kelas, mata pelajaran, atau jurusan"
            />
            <select aria-label="Filter berdasarkan angkatan" value={angkatanFilter} onChange={(event) => setAngkatanFilter(event.target.value)}>
              <option value="">Semua Angkatan</option>
              {angkatanOptions.map((angkatan) => <option key={angkatan} value={angkatan}>{angkatan}</option>)}
            </select>
            <select aria-label="Filter berdasarkan jurusan" value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)}>
              <option value="">Semua Jurusan</option>
              {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
            </select>
          </div>
          {filteredItems.length === 0 ? (
            <EmptyState title="Kelas tidak ditemukan" text="Coba ubah pencarian, angkatan, atau jurusan." />
          ) : (
            <div className={ui.grid3}>
              {filteredItems.map((k) => (
                <article key={k.id} className={ui.classCard}>
                  <div className={ui.classTop}>
                    <span className={ui.badge}>Tingkat {k.tingkat}</span>
                  </div>
                  <h3>{k.kelas_nama}</h3>
                  <p className={ui.muted}>{k.jurusan_nama}</p>
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
        </>
      )}
    </div>
  );
}