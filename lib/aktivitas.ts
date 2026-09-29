import { useEffect, useState } from "react";

export type Aktivitas = {
  id: string;
  judul: string;
  deskripsi: string;
  waktu: string;
};

const KEY = "eclass_aktivitas_v2";
const EVENT = "eclass-aktivitas-changed";

function seed(): Aktivitas[] {
  return [];
}

function urut(list: Aktivitas[]): Aktivitas[] {
  return [...list].sort(
    (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
  );
}

export function getAktivitas(): Aktivitas[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return urut(JSON.parse(raw) as Aktivitas[]);
  } catch {
    // abaikan, pakai data contoh
  }
  const data = seed();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // abaikan
  }
  return data;
}

export function addAktivitas(judul: string, deskripsi: string): void {
  const list = getAktivitas();
  const item: Aktivitas = {
    id: String(Date.now()),
    judul,
    deskripsi,
    waktu: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify([item, ...list].slice(0, 50)));
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event(EVENT));
}

export function timeAgo(iso: string): string {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit yang lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam yang lalu`;
  const hari = Math.floor(jam / 24);
  return `${hari} hari yang lalu`;
}

export function useAktivitas(): Aktivitas[] {
  const [list, setList] = useState<Aktivitas[]>([]);
  useEffect(() => {
    const muat = () => setList(getAktivitas());
    muat();
    window.addEventListener(EVENT, muat);
    window.addEventListener("storage", muat);
    const t = setInterval(muat, 30000);
    return () => {
      window.removeEventListener(EVENT, muat);
      window.removeEventListener("storage", muat);
      clearInterval(t);
    };
  }, []);
  return list;
}