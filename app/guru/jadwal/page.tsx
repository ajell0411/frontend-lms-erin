"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HARI,
  listGuruJadwal,
  type GuruJadwal,
} from "@/lib/guru";
import { PageHead, pesanError } from "../ui";
import ui from "../ui.module.css";

function namaHari(h: string) {
  return h.charAt(0).toUpperCase() + h.slice(1);
}

export default function JadwalPage() {
  const [jadwal, setJadwal] = useState<GuruJadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hariIni = HARI[(new Date().getDay() + 6) % 7];

  const muat = useCallback(async () => {
    try {
      setJadwal(await listGuruJadwal());
      setError("");
    } catch (reason) {
      setError(pesanError(reason, "Jadwal gagal dimuat."));
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
        title="Jadwal Mengajar"
        subtitle="Jadwal ditetapkan dan dikelola oleh admin."
      />

      {loading ? (
        <div className={ui.state}>Memuat jadwal...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : (
        <div className={ui.hariList}>
          {HARI.map((h) => {
            const list = jadwal.filter((j) => j.hari === h).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
            return (
              <section key={h} className={ui.hariCard}>
                <div className={ui.hariHead}>
                  <h2>{namaHari(h)}</h2>
                  {h === hariIni && <span className={ui.badge}>Hari ini</span>}
                </div>
                {list.length === 0 ? (
                  <p className={ui.jadwalKosong}>Tidak ada jadwal mengajar.</p>
                ) : (
                  list.map((j) => (
                    <div key={j.id} className={ui.jadwalItem}>
                      <div>
                        <div className={ui.jadwalJam}>
                          {j.jam_mulai} - {j.jam_selesai}
                        </div>
                        <strong>{j.kelas_nama}</strong>
                        <span className={ui.muted}>
                          {j.pelajaran_nama}
                          {j.ruangan ? ` \u2022 ${j.ruangan}` : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

    </div>
  );
}