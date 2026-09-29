import { useEffect, useState } from "react";

export type Pengumuman = {
  id: string;
  judul: string;
  isi: string;
  waktu: string;
};

const KEY = "eclass_pengumuman_v2";
const EVENT = "eclass-pengumuman-changed";

export function getPengumuman(): Pengumuman[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Pengumuman[];
  } catch {
    // abaikan
  }
  return [];
}

function simpan(list: Pengumuman[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addPengumuman(judul: string, isi: string): void {
  const item: Pengumuman = {
    id: String(Date.now()),
    judul,
    isi,
    waktu: new Date().toISOString(),
  };
  simpan([item, ...getPengumuman()]);
}

export function removePengumuman(id: string): void {
  simpan(getPengumuman().filter((p) => p.id !== id));
}

export function usePengumuman(): Pengumuman[] {
  const [list, setList] = useState<Pengumuman[]>([]);
  useEffect(() => {
    const muat = () => setList(getPengumuman());
    muat();
    window.addEventListener(EVENT, muat);
    window.addEventListener("storage", muat);
    return () => {
      window.removeEventListener(EVENT, muat);
      window.removeEventListener("storage", muat);
    };
  }, []);
  return list;
}