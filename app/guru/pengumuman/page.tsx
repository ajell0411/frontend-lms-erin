"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listGuruAktivitas, type GuruAktivitasItem } from "@/lib/guru";
import { EmptyState, Icon, PageHead, pesanError, waktuLalu } from "../ui";
import ui from "../ui.module.css";

const TAB: { nilai: string; label: string }[] = [
  { nilai: "", label: "Semua" },
  { nilai: "tugas", label: "Tugas" },
  { nilai: "asesmen", label: "Asesmen" },
];

export default function PengumumanGuruPage() {
  const [jenis, setJenis] = useState("");
  const [items, setItems] = useState<GuruAktivitasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    listGuruAktivitas({ jenis, limit: 50 })
      .then((data) => {
        setItems(data);
        setError("");
      })
      .catch((reason) => setError(pesanError(reason, "Aktivitas gagal dimuat.")))
      .finally(() => setLoading(false));
  }, [jenis]);

  return (
    <div>
      <PageHead title="Pengumuman" subtitle="Aktivitas terbaru siswa di kelas yang Anda ajar." />

      <div className={ui.tabs} role="tablist">
        {TAB.map((t) => (
          <button
            key={t.nilai}
            type="button"
            role="tab"
            aria-selected={jenis === t.nilai}
            className={[ui.tab, jenis === t.nilai ? ui.tabActive : ""].join(" ")}
            onClick={() => setJenis(t.nilai)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={ui.state}>Memuat aktivitas...</div>
      ) : error ? (
        <div className={`${ui.state} ${ui.stateError}`}>{error}</div>
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" text="Aktivitas muncul saat siswa mengumpulkan tugas atau menyelesaikan asesmen." />
      ) : (
        <div className={ui.feed}>
          {items.map((a, i) => (
            <Link
              key={`${a.jenis}-${a.siswa_id}-${a.waktu}-${i}`}
              href={a.jenis === "tugas" ? `/guru/tugas/${a.ref_id}` : `/guru/asesmen/${a.ref_id}`}
              className={ui.feedItem}
            >
              <span className={ui.feedIcon}>
                <Icon name={a.jenis === "tugas" ? "tugas" : "asesmen"} />
              </span>
              <span className={ui.feedText}>
                <p>
                  <strong>{a.siswa_nama || "Siswa"}</strong> {a.jenis === "tugas" ? "mengumpulkan tugas" : "selesai mengerjakan asesmen"}{" "}
                  <strong>{a.judul}</strong>
                </p>
                <small>{waktuLalu(a.waktu)}</small>
              </span>
              {a.terlambat && <span className={`${ui.badge} ${ui.badgeRed}`}>Terlambat</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}