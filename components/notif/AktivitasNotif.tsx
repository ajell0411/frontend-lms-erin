"use client";

import { useEffect, useMemo, useState } from "react";
import { listAktivitas, type AktivitasRecord } from "@/lib/api";
import { NotifShell, type NotifSection, type NotifTone } from "./NotifShell";

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

function gaya(jenis: string): { icon: string; tone: NotifTone } {
  const j = jenis.toLowerCase();
  if (j.includes("materi")) return { icon: "\u25A4", tone: "materi" };
  if (j.includes("tugas")) return { icon: "\u2713", tone: "tugas" };
  if (j.includes("asesmen") || j.includes("ujian")) return { icon: "\u270E", tone: "asesmen" };
  return { icon: "\u2726", tone: "info" };
}

export function AktivitasNotif({ storageKey, href }: { storageKey: string; href: string }) {
  const [rows, setRows] = useState<AktivitasRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seenAt, setSeenAt] = useState(0);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await listAktivitas(100);
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
        setSeenAt(Number(localStorage.getItem(storageKey)) || 0);
      } catch {
        setSeenAt(0);
      }
    });
    void load();
    const timer = window.setInterval(() => void load(true), 30000);
    return () => window.clearInterval(timer);
  }, [storageKey]);

  useEffect(() => {
    const onSeen = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "number") setSeenAt(event.detail);
    };
    window.addEventListener("eclass-aktivitas-seen", onSeen);
    return () => window.removeEventListener("eclass-aktivitas-seen", onSeen);
  }, []);

  const latestAt = useMemo(
    () => rows.reduce((latest, item) => {
      const stamp = new Date(item.created_at).getTime();
      return Number.isFinite(stamp) ? Math.max(latest, stamp) : latest;
    }, 0),
    [rows]
  );

  function markSeen() {
    const latest = latestAt || Date.now();
    setSeenAt(latest);
    try {
      localStorage.setItem(storageKey, String(latest));
    } catch {
      // Penyimpanan browser bisa tidak tersedia.
    }
  }

  const akunKata = ["admin", "guru", "siswa", "murid", "kepala sekolah", "akun", "pengguna"];
  const isAkun = (jenis: string) => akunKata.some((kata) => jenis.toLowerCase().includes(kata));
  const terbaru = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const toItem = (item: AktivitasRecord) => {
    const g = gaya(item.objek_jenis);
    return {
      key: `a-${item.id}`,
      href,
      icon: g.icon,
      tone: g.tone,
      title: item.objek_nama ? `${item.objek_jenis}: ${item.objek_nama}` : item.objek_jenis,
      meta: `${item.aktor_nama} telah ${item.aksi} ${item.objek_jenis.toLowerCase()} \u00B7 ${waktuRelatif(item.created_at)}`,
    };
  };

  const sections: NotifSection[] = [
    {
      key: "akun",
      title: "Akun",
      emptyText: "Belum ada aktivitas akun.",
      items: terbaru.filter((item) => isAkun(item.objek_jenis)).slice(0, 3).map(toItem),
    },
    {
      key: "data",
      title: "Data",
      emptyText: "Belum ada aktivitas data.",
      items: terbaru.filter((item) => !isAkun(item.objek_jenis)).slice(0, 3).map(toItem),
    },
  ];

  return (
    <NotifShell
      hasUnread={latestAt > seenAt}
      loading={loading}
      error={error}
      sections={sections}
      emptyText="Belum ada pengumuman."
      allHref={href}
      onRefresh={() => void load()}
      onMarkRead={markSeen}
      canMarkRead={latestAt > seenAt}
    />
  );
}