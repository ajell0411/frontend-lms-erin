import { apiFetch, clearSession, getToken } from "@/lib/api";

export type JenisPengumuman = "materi" | "tugas" | "asesmen";

export type PelajaranSiswa = { id: number; nama: string; kode?: string };

export type MateriSiswa = {
  id: number;
  judul: string;
  nama_file: string;
  ekstensi?: string;
  ukuran?: number;
  created_at: string;
  pelajaran: PelajaranSiswa | string;
};

export type TugasSiswa = {
  id: number;
  judul: string;
  pelajaran: PelajaranSiswa | string;
  tenggat?: string;
  created_at?: string;
  status: "belum" | "dikumpulkan" | "dinilai" | "terlambat" | "proses" | "selesai";
  progres?: number;
  pengumpulan?: { nilai?: number; dikumpulkan_at?: string };
};

export type AsesmenSiswa = {
  id: number;
  judul: string;
  deskripsi?: string;
  tipe: "ujian_harian" | "kuis";
  pelajaran: PelajaranSiswa | string;
  durasi_menit?: number;
  jadwal_mulai?: string;
  jadwal_selesai?: string;
  status: "aktif" | "selesai" | "terkunci" | "berakhir";
  nilai?: number;
  nilai_maks?: number;
};

export type DashboardSiswa = {
  asesmen: AsesmenSiswa[];
  tugas: TugasSiswa[];
  materi: MateriSiswa[];
};

export type DaftarPengumumanSiswa = {
  items: PengumumanSiswa[];
  total?: number;
  has_more?: boolean;
};

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

function queryString(values: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && String(value).length > 0) query.set(key, String(value));
  });
  const result = query.toString();
  return result ? "?" + result : "";
}

function unwrap<T>(response: T | Envelope<T>): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    const envelope = response as Envelope<T>;
    if (envelope.data !== undefined) return envelope.data;
  }
  return response as T;
}

// TODO (backend bagian 4): sediakan feed terpaginasikan untuk siswa.
export async function listPengumumanSiswa(filters: { jenis?: JenisPengumuman | ""; page?: number; limit?: number } = {}): Promise<DaftarPengumumanSiswa> {
  const response = await apiFetch<DaftarPengumumanSiswa | PengumumanSiswa[] | Envelope<DaftarPengumumanSiswa | PengumumanSiswa[]>>(
    "/siswa/pengumuman" + queryString({ jenis: filters.jenis, page: filters.page ?? 1, limit: filters.limit ?? 9 }),
  );
  const rows = unwrap(response);
  const items = Array.isArray(rows) ? rows : typeof rows === "object" && rows !== null && Array.isArray(rows.items) ? rows.items : null;
  if (!items) throw new Error("Format pengumuman siswa tidak sesuai.");
  return {
    items: items.filter((item) => ["materi", "tugas", "asesmen"].includes(item.jenis)),
    total: Array.isArray(rows) ? items.length : rows.total,
    has_more: Array.isArray(rows) ? false : rows.has_more,
  };
}

// TODO (backend bagian 4): sediakan endpoint data dashboard siswa.
export async function getDashboardSiswa(): Promise<DashboardSiswa> {
  const response = await apiFetch<DashboardSiswa | Envelope<DashboardSiswa>>("/siswa/dashboard");
  const dashboard = unwrap(response);
  if (!dashboard || !Array.isArray(dashboard.asesmen) || !Array.isArray(dashboard.tugas) || !Array.isArray(dashboard.materi)) {
    throw new Error("Format dashboard siswa tidak sesuai.");
  }
  return { asesmen: dashboard.asesmen.slice(0, 3), tugas: dashboard.tugas.slice(0, 3), materi: dashboard.materi.slice(0, 3) };
}

// TODO (backend bagian 4): sediakan pelajaran yang diikuti siswa.
export async function listPelajaranSiswa(): Promise<PelajaranSiswa[]> {
  const response = await apiFetch<PelajaranSiswa[] | Envelope<PelajaranSiswa[]>>("/siswa/pelajaran");
  const lessons = unwrap(response);
  if (!Array.isArray(lessons)) throw new Error("Format daftar pelajaran siswa tidak sesuai.");
  return lessons;
}

// TODO (backend bagian 4): filter materi siswa berdasarkan pencarian dan pelajaran.
export async function listMateriSiswa(filters: { search?: string; pelajaran_id?: number } = {}): Promise<MateriSiswa[]> {
  const response = await apiFetch<MateriSiswa[] | Envelope<MateriSiswa[]>>(
    "/siswa/materi" + queryString({ search: filters.search, pelajaran_id: filters.pelajaran_id }),
  );
  const materials = unwrap(response);
  if (!Array.isArray(materials)) throw new Error("Format daftar materi siswa tidak sesuai.");
  return materials;
}

// TODO (backend bagian 4): stream lampiran materi dengan Content-Disposition.
export async function downloadMateriSiswa(id: number, fallbackName?: string): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const response = await fetch("/api/siswa/materi/" + encodeURIComponent(String(id)) + "/unduh", {
    headers: token ? { Authorization: "Bearer " + token } : {},
  });
  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.assign(new URL("/login", window.location.origin));
    throw new Error("Sesi berakhir, silakan login lagi.");
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string" ? payload.message : "Materi gagal diunduh.";
    throw new Error(message);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = fallbackName || "materi-" + id;
  try {
    if (encoded) filename = decodeURIComponent(encoded);
    else if (plain) filename = plain;
  } catch {
    filename = fallbackName || "materi-" + id;
  }
  return { blob: await response.blob(), filename };
}

// TODO (backend bagian 4): sediakan daftar asesmen sesuai kelas siswa.
export async function listAsesmenSiswa(filters: { search?: string; pelajaran_id?: number; tipe?: AsesmenSiswa["tipe"] } = {}): Promise<AsesmenSiswa[]> {
  const response = await apiFetch<AsesmenSiswa[] | Envelope<AsesmenSiswa[]>>(
    "/siswa/asesmen" + queryString({ search: filters.search, pelajaran_id: filters.pelajaran_id, tipe: filters.tipe }),
  );
  const assessments = unwrap(response);
  if (!Array.isArray(assessments)) throw new Error("Format daftar asesmen siswa tidak sesuai.");
  return assessments;
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
