"use client";

import { useEffect, useMemo, useState } from "react";
import { listAktivitasGuru, type AktivitasGuruItem } from "@/lib/pemantau";
import { NotifShell, type NotifSection, type NotifTone } from "./NotifShell";

const STORAGE_KEY = "eclass_pemantau_aktivitas_seen_at";
const HREF = "/pemantau/aktivitas-guru";

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

const GAYA: Record<string, { icon: string; tone: NotifTone; label: string }> = {
  materi: { icon: "\u25A4", tone: "materi", label: "Materi" },
  tugas: { icon: "\u2713", tone: "tugas", label: "Tugas" },
  ulangan: { icon: "\u270E", tone: "asesmen", label: "Ulangan" },
};

export function PemantauNotif() {
  const [rows, setRows] = useState<AktivitasGuruItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seenAt, setSeenAt] = useState(0);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setRows(await listAktivitasGuru({ limit: 20 }));
      setError("");
    } catch (reason) {
      if (!quiet) setError(reason instanceof Error ? reason.message : "Aktivitas belum dapat dimuat.");
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

  const latestAt = useMemo(() => rows.reduce((latest, item) => Math.max(latest, stamp(item.dibuat_pada)), 0), [rows]);

  function markSeen() {
    const latest = latestAt || Date.now();
    setSeenAt(latest);
    try {
      localStorage.setItem(STORAGE_KEY, String(latest));
    } catch {
      // Penyimpanan browser bisa tidak tersedia.
    }
  }

  const sections: NotifSection[] = useMemo(() => [{
    key: "aktivitas",
    title: "Aktivitas Guru",
    emptyText: "Belum ada aktivitas guru.",
    items: [...rows].sort((a, b) => stamp(b.dibuat_pada) - stamp(a.dibuat_pada)).slice(0, 5).map((item) => {
      const g = GAYA[item.jenis] ?? GAYA.materi;
      return {
        key: `${item.jenis}-${item.id}`,
        href: HREF,
        icon: g.icon,
        tone: g.tone,
        title: `${g.label}: ${item.judul}`,
        meta: `${item.guru_nama} \u00B7 ${item.kelas} \u00B7 ${waktuRelatif(item.dibuat_pada)}`,
      };
    }),
  }], [rows]);

  return (
    <NotifShell
      hasUnread={latestAt > seenAt}
      loading={loading}
      error={error}
      sections={sections}
      emptyText="Belum ada aktivitas guru."
      allHref={HREF}
      onRefresh={() => void load()}
      onMarkRead={markSeen}
      canMarkRead={latestAt > seenAt}
    />
  );
}