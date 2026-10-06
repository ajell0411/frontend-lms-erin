import { apiFetch } from "@/lib/api";

export type JenisPengumuman = "materi" | "tugas" | "asesmen";

export type PengumumanSiswa = {
  id: number | string;
  jenis: JenisPengumuman;
  ref_id: number | string;
  judul: string;
  pelajaran?: string | { nama?: string } | null;
  guru?: string;
  created_at: string;
  dilihat?: boolean;
};

export type ProfilSiswa = {
  id: number;
  nama: string;
  username?: string;
  kelas?: string | { nama?: string } | null;
  nama_kelas?: string;
  foto_url?: string;
};

type Envelope<T> = { success?: boolean; message?: string; data?: T };

function unwrap<T>(response: T | Envelope<T>): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    const envelope = response as Envelope<T>;
    if (envelope.data !== undefined) return envelope.data;
  }
  return response as T;
}

export async function listPengumumanSiswa(): Promise<PengumumanSiswa[]> {
  const response = await apiFetch<PengumumanSiswa[] | Envelope<PengumumanSiswa[] | { items?: PengumumanSiswa[] }>>(
    "/siswa/pengumuman?limit=9",
  );
  const rows = unwrap(response);
  const items = Array.isArray(rows) ? rows : typeof rows === "object" && rows !== null && Array.isArray(rows.items) ? rows.items : null;
  if (!items) throw new Error("Format pengumuman siswa tidak sesuai.");
  return items.filter((item) => ["materi", "tugas", "asesmen"].includes(item.jenis));
}

export async function getProfilSiswa(): Promise<ProfilSiswa> {
  const response = await apiFetch<ProfilSiswa | Envelope<ProfilSiswa>>("/siswa/profil");
  const profile = unwrap(response);
  if (!profile || typeof profile !== "object" || typeof profile.nama !== "string") {
    throw new Error("Format profil siswa tidak sesuai.");
  }
  return profile;
}

export async function tandaiPengumumanDibaca(): Promise<void> {
  await apiFetch<unknown>("/siswa/pengumuman/dibaca", { method: "PUT" });
}
