import { apiFetch, getToken } from "@/lib/api";

export const HARI = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"] as const;
export type Hari = (typeof HARI)[number];

export type GuruAktivitas = {
  jenis: "tugas" | "asesmen";
  siswa_id: number;
  siswa_nama: string;
  judul: string;
  waktu: string;
};

export type GuruJadwal = {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  pelajaran_id: number;
  pelajaran_nama: string;
  hari: Hari;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
};

export type GuruPerluDinilai = {
  tugas_id: number;
  judul: string;
  kelas_nama: string;
  jurusan_kode: string;
  jurusan_nama: string;
  jumlah: number;
};

export type GuruDashboard = {
  nama: string;
  jumlah_kelas: number;
  tugas_aktif: number;
  asesmen_aktif: number;
  perlu_dinilai: number;
  perlu_dinilai_list?: GuruPerluDinilai[];
  jadwal_hari_ini: GuruJadwal[];
  aktivitas: GuruAktivitas[];
};

export type GuruKelasItem = {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  tingkat: string;
  pelajaran_id: number;
  pelajaran_nama: string;
  jumlah_siswa: number;
  siswa_preview: { nama: string; foto_url: string }[];
};

export type GuruKelasSiswa = {
  id: number;
  nama: string;
  nisn: string;
  foto_url: string;
  tugas_judul: string;
  tugas_nilai: number | null;
  asesmen_judul: string;
  asesmen_nilai: number | null;
};

export type GuruKelasDetail = {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  tingkat: string;
  pelajaran_id: number;
  pelajaran_nama: string;
  jumlah_siswa: number;
  siswa: GuruKelasSiswa[];
};

export type GuruKelasInput = { kelas_id?: number; pelajaran_id?: number };

export type GuruJadwalInput = {
  kelas_id: number;
  pelajaran_id: number;
  hari: Hari;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
};

type Wrapped<T> = { success: boolean; data: T; message?: string };

async function ambil<T>(path: string, options?: RequestInit): Promise<T> {
  const result = await apiFetch<Wrapped<T>>(path, options);
  return result.data;
}

export function getGuruDashboard(): Promise<GuruDashboard> {
  return ambil<GuruDashboard>("/guru/dashboard");
}

export function listGuruKelas(): Promise<GuruKelasItem[]> {
  return ambil<GuruKelasItem[]>("/guru/kelas");
}

export function getGuruKelas(id: number): Promise<GuruKelasDetail> {
  return ambil<GuruKelasDetail>(`/guru/kelas/${id}`);
}

export function tambahGuruKelas(input: Required<GuruKelasInput>): Promise<GuruKelasItem> {
  return ambil<GuruKelasItem>("/guru/kelas", { method: "POST", body: JSON.stringify(input) });
}

export function ubahGuruKelas(id: number, input: GuruKelasInput): Promise<GuruKelasItem> {
  return ambil<GuruKelasItem>(`/guru/kelas/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function hapusGuruKelas(id: number): Promise<void> {
  await apiFetch<Wrapped<null>>(`/guru/kelas/${id}`, { method: "DELETE" });
}

export function listGuruJadwal(hari?: Hari): Promise<GuruJadwal[]> {
  return ambil<GuruJadwal[]>(`/guru/jadwal${hari ? `?hari=${hari}` : ""}`);
}

export function tambahGuruJadwal(input: GuruJadwalInput): Promise<GuruJadwal> {
  return ambil<GuruJadwal>("/guru/jadwal", { method: "POST", body: JSON.stringify(input) });
}

export function ubahGuruJadwal(id: number, input: GuruJadwalInput): Promise<GuruJadwal> {
  return ambil<GuruJadwal>(`/guru/jadwal/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function hapusGuruJadwal(id: number): Promise<void> {
  await apiFetch<Wrapped<null>>(`/guru/jadwal/${id}`, { method: "DELETE" });
}

function qs(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && String(value) !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function fetchGuruFile(path: string): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const res = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(json?.message || "File gagal dibuka.");
  }
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return { blob: await res.blob(), filename: match ? match[1] : "file" };
}

export const guruMateriFilePath = (id: number) => `/guru/materi/${id}/unduh`;
export const guruPengumpulanFilePath = (id: number) => `/guru/pengumpulan/${id}/file`;

// ===== Materi =====
export type GuruMateri = {
  id: number;
  judul: string;
  deskripsi: string;
  kelas_id: number;
  kelas_nama: string;
  pelajaran_id: number;
  pelajaran_nama: string;
  file_url: string;
  nama_file: string;
  ada_file: boolean;
  created_at: string;
};

export function listGuruMateri(filter: { kelas_id?: number; q?: string } = {}): Promise<GuruMateri[]> {
  return ambil<GuruMateri[]>(`/guru/materi${qs(filter)}`);
}
export function tambahGuruMateri(form: FormData): Promise<GuruMateri> {
  return ambil<GuruMateri>("/guru/materi", { method: "POST", body: form });
}
export function ubahGuruMateri(id: number, form: FormData): Promise<GuruMateri> {
  return ambil<GuruMateri>(`/guru/materi/${id}`, { method: "PUT", body: form });
}
export async function hapusGuruMateri(id: number): Promise<void> {
  await apiFetch<Wrapped<null>>(`/guru/materi/${id}`, { method: "DELETE" });
}

// ===== Tugas =====
export type GuruTugas = {
  id: number;
  judul: string;
  deskripsi: string;
  deadline: string;
  aktif: boolean;
  kelas_id: number;
  kelas_nama: string;
  pelajaran_id: number;
  pelajaran_nama: string;
  lampiran_url: string;
  nama_lampiran: string;
  dikumpulkan: number;
  jumlah_siswa: number;
};
export type GuruTugasSiswa = {
  siswa_id: number;
  nama: string;
  nisn: string;
  foto_url: string;
  status: "belum" | "dikumpulkan";
  waktu_kumpul: string | null;
  terlambat: boolean;
  nilai: number | null;
  pengumpulan_id: number | null;
};
export type GuruTugasDetail = GuruTugas & { siswa: GuruTugasSiswa[] };
export type GuruPengumpulan = {
  id: number;
  tugas_id: number;
  tugas_judul: string;
  kelas_nama: string;
  pelajaran_nama: string;
  siswa_id: number;
  siswa_nama: string;
  siswa_nisn: string;
  siswa_foto: string;
  waktu_submit: string;
  terlambat: boolean;
  nilai: number | null;
  feedback: string;
  nama_file: string;
  ada_file: boolean;
};

export function listGuruTugas(filter: { kelas_id?: number; q?: string; status?: string } = {}): Promise<GuruTugas[]> {
  return ambil<GuruTugas[]>(`/guru/tugas${qs(filter)}`);
}
export function tambahGuruTugas(form: FormData): Promise<GuruTugas> {
  return ambil<GuruTugas>("/guru/tugas", { method: "POST", body: form });
}
export function getGuruTugas(id: number): Promise<GuruTugasDetail> {
  return ambil<GuruTugasDetail>(`/guru/tugas/${id}`);
}
export function ubahGuruTugas(id: number, form: FormData): Promise<GuruTugas> {
  return ambil<GuruTugas>(`/guru/tugas/${id}`, { method: "PUT", body: form });
}
export async function hapusGuruTugas(id: number): Promise<void> {
  await apiFetch<Wrapped<null>>(`/guru/tugas/${id}`, { method: "DELETE" });
}
export async function nonaktifGuruTugas(id: number): Promise<void> {
  await apiFetch<Wrapped<null>>(`/guru/tugas/${id}/nonaktif`, { method: "POST" });
}
export function getGuruPengumpulan(id: number): Promise<GuruPengumpulan> {
  return ambil<GuruPengumpulan>(`/guru/pengumpulan/${id}`);
}
export async function nilaiGuruPengumpulan(id: number, input: { nilai: number; feedback: string }): Promise<void> {
  await apiFetch<Wrapped<unknown>>(`/guru/pengumpulan/${id}/nilai`, { method: "PUT", body: JSON.stringify(input) });
}

// ===== Asesmen =====
export type GuruSoalOpsi = { kode: string; teks: string };
export type GuruSoalItem = {
  id: number;
  nomor: number;
  teks: string;
  opsi: GuruSoalOpsi[];
  kunci: string;
  poin?: number;
  pembahasan?: string;
};
export type GuruAsesmen = {
  id: number;
  judul: string;
  jenis: "kuis" | "ujian_harian";
  kelas_id: number;
  kelas_nama: string;
  pelajaran_id: number;
  pelajaran_nama: string;
  deadline: string;
  jadwal_mulai: string | null;
  durasi_menit: number;
  status: "aktif" | "terjadwal" | "berakhir";
  jumlah_soal: number;
  selesai: number;
  jumlah_siswa: number;
};
export type GuruAsesmenDetail = GuruAsesmen & { soal: GuruSoalItem[] };
export type GuruAsesmenInput = {
  judul: string;
  jenis: "kuis" | "ujian_harian";
  kelas_id: number;
  pelajaran_id: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
};
export type GuruSoalInput = {
  teks: string;
  poin: number;
  opsi: { teks: string }[];
  kunci: string;
  pembahasan: string;
};
export type GuruAsesmenMurid = {
  siswa_id: number;
  nama: string;
  nisn: string;
  foto_url: string;
  kelas_nama: string;
  status: "belum" | "mengerjakan" | "selesai";
  waktu_kumpul: string | null;
  terlambat: boolean;
  nilai: number | null;
};
export type GuruAsesmenHasil = {
  asesmen_judul: string;
  kelas_nama: string;
  pelajaran_nama: string;
  siswa_id: number;
  siswa_nama: string;
  siswa_nisn: string;
  siswa_foto: string;
  nilai: number | null;
  nilai_maks: number;
  lulus: boolean;
  kkm: number;
  jumlah_benar: number;
  jumlah_soal: number;
  waktu_kumpul: string | null;
  sudah_dikirim: boolean;
  detail: {
    nomor: number;
    teks: string;
    opsi: GuruSoalOpsi[];
    kunci: string;
    jawaban: string;
    benar: boolean;
    poin: number;
    pembahasan: string;
  }[];
};

export function listGuruAsesmen(filter: { kelas_id?: number; q?: string } = {}): Promise<GuruAsesmen[]> {
  return ambil<GuruAsesmen[]>(`/guru/asesmen${qs(filter)}`);
}
export function tambahGuruAsesmen(input: GuruAsesmenInput): Promise<GuruAsesmen> {
  return ambil<GuruAsesmen>("/guru/asesmen", { method: "POST", body: JSON.stringify(input) });
}
export function getGuruAsesmen(id: number): Promise<GuruAsesmenDetail> {
  return ambil<GuruAsesmenDetail>(`/guru/asesmen/${id}`);
}
export function ubahGuruAsesmen(id: number, input: GuruAsesmenInput): Promise<GuruAsesmen> {
  return ambil<GuruAsesmen>(`/guru/asesmen/${id}`, { method: "PUT", body: JSON.stringify(input) });
}
export async function hapusGuruAsesmen(id: number): Promise<void> {
  await apiFetch<Wrapped<null>>(`/guru/asesmen/${id}`, { method: "DELETE" });
}
export function tambahGuruSoal(id: number, input: GuruSoalInput): Promise<GuruSoalItem[]> {
  return ambil<GuruSoalItem[]>(`/guru/asesmen/${id}/soal`, { method: "POST", body: JSON.stringify(input) });
}
export function ubahGuruSoal(id: number, nomor: number, input: GuruSoalInput): Promise<GuruSoalItem[]> {
  return ambil<GuruSoalItem[]>(`/guru/asesmen/${id}/soal/${nomor}`, { method: "PUT", body: JSON.stringify(input) });
}
export function hapusGuruSoal(id: number, nomor: number): Promise<GuruSoalItem[]> {
  return ambil<GuruSoalItem[]>(`/guru/asesmen/${id}/soal/${nomor}`, { method: "DELETE" });
}
export function getGuruAsesmenMurid(id: number): Promise<{ asesmen: GuruAsesmen; murid: GuruAsesmenMurid[] }> {
  return ambil<{ asesmen: GuruAsesmen; murid: GuruAsesmenMurid[] }>(`/guru/asesmen/${id}/murid`);
}
export function getGuruAsesmenHasil(id: number, siswaId: number): Promise<GuruAsesmenHasil> {
  return ambil<GuruAsesmenHasil>(`/guru/asesmen/${id}/hasil/${siswaId}`);
}

// ===== Nilai =====
export type GuruNilaiData = {
  kelas_nama: string;
  pelajaran_nama: string;
  kolom: { key: string; jenis: "tugas" | "asesmen"; judul: string }[];
  siswa: {
    id: number;
    nama: string;
    nisn: string;
    nilai: Record<string, number | null>;
    nilai_akhir: number | null;
    predikat: string;
  }[];
};
export function getGuruNilai(guruKelasId: number): Promise<GuruNilaiData> {
  return ambil<GuruNilaiData>(`/guru/nilai${qs({ guru_kelas_id: guruKelasId })}`);
}

// ===== Aktivitas =====
export type GuruAktivitasItem = {
  jenis: "tugas" | "asesmen";
  siswa_id: number;
  siswa_nama: string;
  judul: string;
  waktu: string;
  ref_id: number;
  pengumpulan_id?: number;
  terlambat: boolean;
};
export function listGuruAktivitas(filter: { jenis?: string; limit?: number } = {}): Promise<GuruAktivitasItem[]> {
  return ambil<GuruAktivitasItem[]>(`/guru/aktivitas${qs(filter)}`);
}