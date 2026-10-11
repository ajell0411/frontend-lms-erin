"use client";

import { useEffect, useMemo, useState } from "react";
import { listPengumumanSiswa, tandaiPengumumanDibaca, type JenisPengumuman, type PengumumanSiswa } from "@/lib/siswa";
import { NotifShell, type NotifSection } from "@/components/notif/NotifShell";

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

const groups: { type: JenisPengumuman; title: string; icon: string }[] = [
  { type: "materi", title: "Materi Terbaru", icon: "\u25A4" },
  { type: "tugas", title: "Tugas Terbaru", icon: "\u2713" },
  { type: "asesmen", title: "Asesmen Terbaru", icon: "\u270E" },
];

function target(item: PengumumanSiswa): string {
  if (item.jenis === "materi") return "/siswa/materi";
  return `/siswa/${item.jenis}/${encodeURIComponent(String(item.ref_id))}`;
}

export function NotifPopup() {
  const [items, setItems] = useState<PengumumanSiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPengumumanSiswa();
      setItems(data.items.slice(0, 9));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pengumuman belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const sections: NotifSection[] = useMemo(() => groups.map((group) => ({
    key: group.type,
    title: group.title,
    emptyText: `Belum ada ${group.title.toLowerCase()}.`,
    items: items
      .filter((item) => item.jenis === group.type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((item) => {
        const subject = typeof item.pelajaran === "string" ? item.pelajaran : item.pelajaran?.nama;
        return {
          key: `${item.jenis}-${item.id}`,
          href: target(item),
          icon: group.icon,
          tone: group.type,
          title: item.judul,
          meta: `${subject || "Pelajaran"} \u00B7 ${waktuRelatif(item.created_at)}`,
        };
      }),
  })), [items]);

  async function markRead() {
    try {
      await tandaiPengumumanDibaca();
      setItems((current) => current.map((item) => ({ ...item, dilihat: true })));
    } catch {
      setError("Pengumuman belum dapat ditandai sudah dibaca. Coba lagi.");
    }
  }

  const unread = items.some((item) => !item.dilihat);

  return (
    <NotifShell
      hasUnread={unread}
      loading={loading}
      error={error}
      sections={sections}
      emptyText="Belum ada pengumuman."
      allHref="/siswa/pengumuman"
      onRefresh={() => void load()}
      onMarkRead={() => void markRead()}
      canMarkRead={unread}
    />
  );
}