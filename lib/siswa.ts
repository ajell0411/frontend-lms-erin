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
  nilai?: number;
  pengumpulan?: { nilai?: number; dikumpulkan_at?: string; nama_file?: string; catatan?: string; komentar?: string };
  deskripsi?: string;
  instruksi?: string;
  kriteria?: string[];
  guru?: string | { id?: number; nama?: string };
  kelas?: string | { nama?: string };
  bobot?: number;
  lampiran?: { nama?: string; url?: string } | null;
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
  nisn?: string;
  jurusan?: string | { nama?: string } | null;
  nama_jurusan?: string;
  email?: string;
  no_hp?: string;
  telepon?: string;
  kelas?: string | { nama?: string } | null;
  nama_kelas?: string;
  foto_url?: string;
};

export type OpsiSoalSiswa = { kode: "A" | "B" | "C" | "D"; teks: string };
export type SoalSiswa = { id: number; nomor: number; teks: string; opsi: OpsiSoalSiswa[] };
export type DetailAsesmenSiswa = AsesmenSiswa & {
  soal: SoalSiswa[];
  waktu_selesai?: string;
  sudah_dikirim?: boolean;
  nilai?: number;
};
export type StatusMulaiAsesmen = { waktu_selesai: string; sudah_dikirim?: boolean };
export type HasilKirimAsesmen = { sudah_dikirim: boolean; nilai?: number; nilai_maks?: number; message?: string };
export type DetailTugasSiswa = TugasSiswa & {
  guru?: string | { id?: number; nama?: string };
  kelas?: string | { nama?: string };
  bobot?: number;
  kriteria?: string[];
  instruksi?: string;
  pengumpulan?: { nama_file?: string; catatan?: string; dikumpulkan_at?: string; nilai?: number; komentar?: string } | null;
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

// TODO (backend bagian 4): endpoint detail harus mengirim soal tanpa kunci jawaban.
export async function getDetailAsesmenSiswa(id: number): Promise<DetailAsesmenSiswa> {
  const response = await apiFetch<DetailAsesmenSiswa | Envelope<DetailAsesmenSiswa>>("/siswa/asesmen/" + encodeURIComponent(String(id)));
  const assessment = unwrap(response);
  if (!assessment || !Array.isArray(assessment.soal)) throw new Error("Detail asesmen tidak sesuai.");
  return assessment;
}

// TODO (backend bagian 4): waktu selesai dikembalikan server dan idempoten saat asesmen sudah dimulai.
export async function mulaiAsesmenSiswa(id: number): Promise<StatusMulaiAsesmen> {
  const response = await apiFetch<StatusMulaiAsesmen | Envelope<StatusMulaiAsesmen>>(
    "/siswa/asesmen/" + encodeURIComponent(String(id)) + "/mulai",
    { method: "POST", body: JSON.stringify({}) },
  );
  const result = unwrap(response);
  if (!result || typeof result.waktu_selesai !== "string" || !Number.isFinite(new Date(result.waktu_selesai).getTime())) throw new Error("Waktu selesai asesmen tidak tersedia.");
  return result;
}

// TODO (backend bagian 4): simpan jawaban tanpa mengirimkan kunci jawaban.
export async function simpanJawabanAsesmenSiswa(id: number, jawaban: Record<string, string>): Promise<void> {
  await apiFetch<unknown>("/siswa/asesmen/" + encodeURIComponent(String(id)) + "/jawaban", {
    method: "PUT",
    body: JSON.stringify({ jawaban }),
  });
}

// TODO (backend bagian 4): kirim jawaban satu kali dan kembalikan nilai bila sudah dirilis.
export async function kirimAsesmenSiswa(id: number, jawaban: Record<string, string>): Promise<HasilKirimAsesmen> {
  const response = await apiFetch<HasilKirimAsesmen | Envelope<HasilKirimAsesmen>>(
    "/siswa/asesmen/" + encodeURIComponent(String(id)) + "/kirim",
    { method: "POST", body: JSON.stringify({ jawaban }) },
  );
  return unwrap(response);
}

// TODO (backend bagian 4): sediakan daftar tugas yang sesuai dengan kelas siswa.
export async function listTugasSiswa(filters: { search?: string; pelajaran_id?: number } = {}): Promise<TugasSiswa[]> {
  const response = await apiFetch<TugasSiswa[] | Envelope<TugasSiswa[]>>(
    "/siswa/tugas" + queryString({ search: filters.search, pelajaran_id: filters.pelajaran_id }),
  );
  const tasks = unwrap(response);
  if (!Array.isArray(tasks)) throw new Error("Format daftar tugas siswa tidak sesuai.");
  return tasks;
}

// TODO (backend bagian 4): sediakan detail, instruksi, dan status pengumpulan tugas.
export async function getDetailTugasSiswa(id: number): Promise<DetailTugasSiswa> {
  const response = await apiFetch<DetailTugasSiswa | Envelope<DetailTugasSiswa>>("/siswa/tugas/" + encodeURIComponent(String(id)));
  return unwrap(response);
}

// TODO (backend bagian 4): bila lampiran bersifat privat, URL harus tetap terautentikasi.
export async function downloadTugasLampiranSiswa(id: number, fileUrl: string, fallbackName?: string): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const url = fileUrl.startsWith("http") ? fileUrl : fileUrl.startsWith("/api/") ? fileUrl : "/api/siswa/tugas/" + encodeURIComponent(String(id)) + "/lampiran";
  const response = await fetch(url, { headers: token ? { Authorization: "Bearer " + token } : {} });
  if (response.status === 401) {
    clearSession();
    window.location.assign(new URL("/login", window.location.origin));
    throw new Error("Sesi berakhir, silakan login lagi.");
  }
  if (!response.ok) throw new Error("Lampiran gagal diunduh.");
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename=\"?([^\";]+)\"?/i)?.[1];
  let filename = fallbackName || "lampiran-tugas-" + id;
  try {
    if (encoded) filename = decodeURIComponent(encoded);
    else if (plain) filename = plain;
  } catch { filename = fallbackName || "lampiran-tugas-" + id; }
  return { blob: await response.blob(), filename };
}

// TODO (backend bagian 4): validasi file dan proses multipart berada di handler siswa.
export function kumpulkanTugasSiswa(id: number, file: File, catatan: string, onProgress: (progress: number) => void): Promise<DetailTugasSiswa> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/siswa/tugas/" + encodeURIComponent(String(id)) + "/kumpul");
    const token = getToken();
    if (token) request.setRequestHeader("Authorization", "Bearer " + token);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      let payload: unknown;
      try { payload = JSON.parse(request.responseText) as unknown; } catch { payload = null; }
      if (request.status === 401) {
        clearSession();
        window.location.assign(new URL("/login", window.location.origin));
        reject(new Error("Sesi berakhir, silakan login lagi."));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        const message = typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string" ? payload.message : "Tugas gagal dikumpulkan.";
        reject(new Error(message));
        return;
      }
      try {
        const result = unwrap(payload as DetailTugasSiswa | Envelope<DetailTugasSiswa>);
        resolve(result);
      } catch {
        reject(new Error("Respons pengumpulan tugas tidak sesuai."));
      }
    });
    request.addEventListener("error", () => reject(new Error("Jaringan bermasalah. Tugas gagal dikumpulkan.")));
    request.addEventListener("abort", () => reject(new Error("Pengumpulan tugas dibatalkan.")));
    const form = new FormData();
    form.append("file", file);
    form.append("catatan", catatan);
    request.send(form);
  });
}

// TODO (backend bagian 4): profil siswa hanya dapat mengubah nomor HP dan password sendiri.
export async function perbaruiProfilSiswa(input: { no_hp: string; password_lama?: string; password_baru?: string }): Promise<ProfilSiswa> {
  const response = await apiFetch<ProfilSiswa | Envelope<ProfilSiswa>>("/siswa/profil", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return unwrap(response);
}

// TODO (backend bagian 4): unggah foto profil JPG/PNG maksimal 2 MB.
export async function unggahFotoProfilSiswa(file: File): Promise<string> {
  const form = new FormData();
  form.append("foto", file);
  const response = await apiFetch<{ foto_url?: string; url?: string; success?: boolean } | Envelope<{ foto_url?: string; url?: string }>>(
    "/siswa/profil/foto",
    { method: "POST", body: form },
  );
  const result = unwrap(response);
  const url = result.foto_url || result.url;
  if (!url) throw new Error("Foto profil gagal disimpan.");
  return url;
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
