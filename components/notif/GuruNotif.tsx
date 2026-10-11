"use client";

import { useEffect, useMemo, useState } from "react";
import { listGuruAktivitas, type GuruAktivitasItem } from "@/lib/guru";
import { NotifShell, type NotifSection } from "./NotifShell";

const STORAGE_KEY = "eclass_guru_aktivitas_seen_at";

function waktuRelatif(value: string): string {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time) || time < 946684800000) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Kemarin" : `${days} hari lalu`;
}

function stamp(value: string): number {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

const groups: { type: "tugas" | "asesmen"; title: string; icon: string }[] = [
  { type: "tugas", title: "Pengumpulan Tugas", icon: "\u2713" },
  { type: "asesmen", title: "Pengumpulan Asesmen", icon: "\u270E" },
];

export function GuruNotif() {
  const [rows, setRows] = useState<GuruAktivitasItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seenAt, setSeenAt] = useState(0);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await listGuruAktivitas({ limit: 50 });
      setRows(data);
      setError("");
    } catch (reason) {
      if (!quiet) setError(reason instanceof Error ? reason.message : "Pengumuman belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        setSeenAt(Number(localStorage.getItem(STORAGE_KEY)) || 0);
      } catch {
        setSeenAt(0);
      }
    });
    void load();
    const timer = window.setInterval(() => void load(true), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const latestAt = useMemo(() => rows.reduce((latest, item) => Math.max(latest, stamp(item.waktu)), 0), [rows]);

  function markSeen() {
    const latest = latestAt || Date.now();
    setSeenAt(latest);
    try {
      localStorage.setItem(STORAGE_KEY, String(latest));
    } catch {
      // Penyimpanan browser bisa tidak tersedia.
    }
  }

  const sections: NotifSection[] = useMemo(() => groups.map((group) => ({
    key: group.type,
    title: group.title,
    emptyText: `Belum ada ${group.title.toLowerCase()}.`,
    items: rows
      .filter((item) => item.jenis === group.type)
      .sort((a, b) => stamp(b.waktu) - stamp(a.waktu))
      .slice(0, 3)
      .map((item, index) => ({
        key: `${item.jenis}-${item.ref_id}-${item.siswa_id}-${index}`,
        href: `/guru/${item.jenis}/${item.ref_id}`,
        icon: group.icon,
        tone: group.type,
        title: item.judul,
        meta: `${item.siswa_nama} mengumpulkan${item.terlambat ? " (terlambat)" : ""} \u00B7 ${waktuRelatif(item.waktu)}`,
      })),
  })), [rows]);

  return (
    <NotifShell
      hasUnread={latestAt > seenAt}
      loading={loading}
      error={error}
      sections={sections}
      emptyText="Belum ada pengumuman."
      allHref="/guru/pengumuman"
      onRefresh={() => void load()}
      onMarkRead={markSeen}
      canMarkRead={latestAt > seenAt}
    />
  );
}