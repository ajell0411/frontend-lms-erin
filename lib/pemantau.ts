import { apiFetch } from "@/lib/api";

export type JenisAktivitas = "materi" | "tugas" | "ulangan";

export type PemantauStatistik = {
  total_admin: number;
  total_guru: number;
  total_siswa: number;
  total_kelas: number;
  total_jurusan: number;
  total_pelajaran: number;
  aktif_admin: number;
  aktif_guru: number;
  aktif_siswa: number;
  total_akun_aktif: number;
  total_akun: number;
  jurusan?: { kode?: string; nama?: string; total_siswa?: number; total_kelas?: number }[];
};

export type AktivitasGuruItem = {
  id: number;
  jenis: JenisAktivitas;
  guru_id: number;
  guru_nama: string;
  judul: string;
  kelas_id: number;
  kelas: string;
  pelajaran_id: number;
  pelajaran: string;
  dibuat_pada: string;
  deadline: string | null;
  status: "Aktif" | "Selesai" | "";
};

export type AktivitasGuruDetail = AktivitasGuruItem & {
  deskripsi?: string;
  file_url?: string;
  instruksi?: string;
  kriteria?: string | string[];
  bobot?: number;
  kategori_ulangan?: "kuis" | "ujian_harian";
  durasi_menit?: number;
  jadwal_mulai?: string | null;
  jadwal_selesai?: string | null;
  jumlah_siswa?: number;
  jumlah_pengumpulan?: number;
};

export type AktivitasGuruFilter = {
  jenis?: JenisAktivitas | "semua" | "";
  guru?: number | string;
  kelas?: number | string;
  pelajaran?: number | string;
  tanggal_awal?: string;
  tanggal_akhir?: string;
  q?: string;
  limit?: number;
};

type Wrapped<T> = { success: boolean; data: T };

function qs(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    const text = value === undefined ? "" : String(value).trim();
    if (text !== "" && text !== "semua") params.set(key, text);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getPemantauStatistik(): Promise<PemantauStatistik> {
  const result = await apiFetch<Wrapped<PemantauStatistik>>("/pemantauan/statistik");
  return result.data;
}

export async function listAktivitasGuru(filter: AktivitasGuruFilter = {}): Promise<AktivitasGuruItem[]> {
  const result = await apiFetch<Wrapped<AktivitasGuruItem[]>>(`/pemantauan/aktivitas-guru${qs({ ...filter })}`);
  return Array.isArray(result.data) ? result.data : [];
}

export async function getAktivitasGuruDetail(jenis: JenisAktivitas, id: number): Promise<AktivitasGuruDetail> {
  const result = await apiFetch<Wrapped<AktivitasGuruDetail>>(`/pemantauan/aktivitas-guru/${jenis}/${id}`);
  return result.data;
}