export type UserRole = "admin" | "admin_kurikulum" | "kepala_sekolah" | "guru" | "siswa";

export type UserData = {
  id: number;
  nama: string;
  email: string;
  role: UserRole;
};

export type ProfileRecord = UserData & {
  username: string;
  telepon: string;
  alamat: string;
  foto_url: string;
  nip: string;
  status?: AccountStatus;
  created_at?: string;
};

export type LoginResult = {
  success: boolean;
  message?: string;
  token?: string;
  data?: UserData;
};

export type AdminRole = "admin" | "admin_kurikulum" | "kepala_sekolah";

export type AdminAccount = {
  id: number | string;
  nama: string;
  username?: string;
  email: string;
  role: AdminRole;
  nip?: string;
  telepon?: string;
  status?: "aktif" | "nonaktif";
  foto_url?: string;
  created_at?: string;
};

export type CreateAdminInput = {
  nama: string;
  username: string;
  email: string;
  password: string;
  nip: string;
  telepon: string;
  status: "aktif" | "nonaktif";
  foto_url: string;
};

export type UpdateAdminInput = {
  nama: string;
  username: string;
  email: string;
  password?: string;
  role: AdminRole;
  nip: string;
  telepon: string;
  status: "aktif" | "nonaktif";
  foto_url: string;
};

export type JenisKelamin = "L" | "P";
export type AccountStatus = "aktif" | "nonaktif";

export type GuruAccount = {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: "guru";
  nip: string;
  jenis_kelamin: JenisKelamin | "";
  telepon: string;
  alamat: string;
  status: AccountStatus;
  foto_url: string;
  pelajaran_id: number | null;
  nama_pelajaran: string;
  created_at: string;
};

export type SiswaAccount = {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: "siswa";
  nisn: string;
  jenis_kelamin: JenisKelamin | "";
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  telepon: string;
  nama_wali: string;
  telepon_wali: string;
  tahun_masuk: number | null;
  status: AccountStatus;
  foto_url: string;
  kelas_id: number | null;
  nama_kelas: string;
  jurusan_id: number | null;
  nama_jurusan: string;
  created_at: string;
};

export type GuruInput = {
  nama: string;
  username: string;
  email: string;
  password?: string;
  nip: string;
  jenis_kelamin: JenisKelamin | "";
  telepon: string;
  alamat: string;
  status: AccountStatus;
  foto_url: string;
  pelajaran_id?: number | null;
};

export type SiswaInput = {
  nama: string;
  username: string;
  email: string;
  password?: string;
  nisn: string;
  jenis_kelamin: JenisKelamin | "";
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  telepon: string;
  nama_wali: string;
  telepon_wali: string;
  tahun_masuk: number | null;
  status: AccountStatus;
  foto_url: string;
  kelas_id: number | null;
};

export type JurusanRecord = {
  id: number;
  nama: string;
  kode: string;
  kepala_jurusan: string;
  jumlah_kelas: number;
  jumlah_siswa: number;
};
export type JurusanInput = Pick<JurusanRecord, "nama" | "kode" | "kepala_jurusan">;
export type KelasRecord = {
  id: number;
  nama: string;
  tingkat: "X" | "XI" | "XII";
  jurusan_id: number;
  jurusan?: JurusanRecord;
  wali_kelas_id: number | null;
  wali_kelas_nama: string;
  jumlah_siswa: number;
};
export type KelasInput = {
  nama: string;
  tingkat: "X" | "XI" | "XII";
  jurusan_id: number;
  wali_kelas_id: number | null;
};
export type PelajaranGuru = Pick<GuruAccount, "id" | "nama" | "email" | "nip" | "status" | "foto_url">;
export type PelajaranRecord = { id: number; nama: string; kode: string; guru_ids: number[]; guru: PelajaranGuru[] };
export type PelajaranInput = { nama: string; kode: string; guru_ids: number[] };
export type AktivitasRecord = {
  id: number;
  aktor_nama: string;
  aksi: "menambahkan" | "mengubah" | "menghapus";
  objek_jenis: string;
  objek_nama: string;
  created_at: string;
};
type AktivitasResponse = { success: boolean; data: AktivitasRecord[] };

// Login ke backend Go (lewat proxy Next.js: /api -> localhost:8080)
export async function loginRequest(username: string, password: string): Promise<LoginResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const json = await res.json().catch(() => null);
  if (!json) {
    return {
      success: false,
      message: "Server tidak merespons. Pastikan backend Go sudah berjalan.",
    };
  }
  return json as LoginResult;
}

// "Ingat saya" dicentang -> localStorage, kalau tidak -> sessionStorage
export function saveSession(token: string, user: UserData, remember: boolean) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem("token") ?? sessionStorage.getItem("token");
}

export function getUser(): UserData | null {
  const storedLocally = localStorage.getItem("user") !== null;
  const raw = storedLocally ? localStorage.getItem("user") : sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as UserData;
    if (user.nama === "Super Admin") {
      user.nama = "Admin";
      (storedLocally ? localStorage : sessionStorage).setItem("user", JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

// Role di backend: admin | admin_kurikulum | kepala_sekolah | guru | siswa
export function dashboardPath(role: string): string {
  switch (role) {
    case "admin":
    case "admin_kurikulum":
    case "kepala_sekolah":
      return "/admin/dashboard";
    case "guru":
      return "/guru/dashboard";
    case "siswa":
      return "/siswa/dashboard";
    default:
      return "/admin/dashboard";
  }
}

// Untuk request lain (halaman admin, dll) yang butuh token
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(typeof FormData !== "undefined" && options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data: unknown = await res.json().catch(() => ({}));

  // Token kedaluwarsa atau tidak valid: bersihkan sesi dan kembali ke login
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.assign(new URL("/login", window.location.origin));
    throw new Error(responseMessage(data, "Sesi berakhir, silakan login lagi"));
  }

  if (!res.ok) throw new Error(responseMessage(data, "Terjadi kesalahan"));
  return data as T;
}

function responseMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null) return fallback;
  const payload = data as { message?: unknown; error?: unknown };
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function adminRequest<T>(path: string, options: Omit<RequestInit, "headers"> = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  });
}

const ADMIN_ENDPOINT: Record<AdminRole, string> = {
  admin: "/admin",
  admin_kurikulum: "/admin-kurikulum",
  kepala_sekolah: "/kepala-sekolah",
};

function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "admin_kurikulum" || value === "kepala_sekolah";
}

function isAdminAccount(value: unknown): value is AdminAccount {
  if (typeof value !== "object" || value === null) return false;
  const account = value as Record<string, unknown>;
  const optionalString = (key: string) => account[key] === undefined || typeof account[key] === "string";
  return (
    (typeof account.id === "string" ||
      (typeof account.id === "number" && Number.isFinite(account.id))) &&
    typeof account.nama === "string" &&
    typeof account.email === "string" &&
    isAdminRole(account.role) &&
    optionalString("username") &&
    optionalString("nip") &&
    optionalString("telepon") &&
    (account.status === undefined || account.status === "aktif" || account.status === "nonaktif") &&
    optionalString("foto_url") &&
    optionalString("created_at")
  );
}

export async function listAdmin(): Promise<AdminAccount[]> {
  const responses = await Promise.all(
    (Object.keys(ADMIN_ENDPOINT) as AdminRole[]).map((role) =>
      adminRequest<unknown>(ADMIN_ENDPOINT[role]).then((response) => ({ role, response })),
    ),
  );
  const accounts: AdminAccount[] = [];

  for (const { role, response } of responses) {
    const rows = Array.isArray(response)
      ? response
      : typeof response === "object" && response !== null && "data" in response &&
          Array.isArray(response.data)
        ? response.data
        : null;
    if (!rows || !rows.every(isAdminAccount)) {
      throw new Error("Format data admin dari server tidak sesuai.");
    }
    accounts.push(...rows.map((account) => ({ ...account, role })));
  }
  return accounts;
}

export async function createAdmin(role: AdminRole, input: CreateAdminInput): Promise<void> {
  await adminRequest<unknown>(ADMIN_ENDPOINT[role], {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdmin(
  role: AdminRole,
  id: number | string,
  input: UpdateAdminInput,
): Promise<void> {
  await adminRequest<unknown>(`${ADMIN_ENDPOINT[role]}/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteAdmin(role: AdminRole, id: number | string): Promise<void> {
  await adminRequest<unknown>(`${ADMIN_ENDPOINT[role]}/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

export async function uploadAdminPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("foto", file);
  const result = await adminRequest<{ success: boolean; url?: string; message?: string }>(
    "/upload/foto",
    { method: "POST", body: formData },
  );
  if (!result.success || !result.url) {
    throw new Error(result.message ?? "Foto gagal diunggah.");
  }
  return result.url;
}

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && String(value) !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listGuru(filters: { search?: string; status?: string; pelajaran_id?: number } = {}): Promise<GuruAccount[]> {
  return apiFetch<GuruAccount[]>(`/guru${queryString(filters)}`);
}

export function getGuru(id: number): Promise<GuruAccount> {
  return apiFetch<GuruAccount>(`/guru/${id}`);
}

export function createGuru(input: GuruInput): Promise<GuruAccount> {
  return apiFetch<GuruAccount>("/guru", { method: "POST", body: JSON.stringify(input) });
}

export function updateGuru(id: number, input: Partial<GuruInput>): Promise<GuruAccount> {
  return apiFetch<GuruAccount>(`/guru/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteGuru(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/guru/${id}`, { method: "DELETE" });
}

export function listSiswa(filters: { search?: string; status?: string; jurusan_id?: number; kelas_id?: number } = {}): Promise<SiswaAccount[]> {
  return apiFetch<SiswaAccount[]>(`/siswa${queryString(filters)}`);
}

export function getSiswa(id: number): Promise<SiswaAccount> {
  return apiFetch<SiswaAccount>(`/siswa/${id}`);
}

export function createSiswa(input: SiswaInput): Promise<SiswaAccount> {
  return apiFetch<SiswaAccount>("/siswa", { method: "POST", body: JSON.stringify(input) });
}

export function updateSiswa(id: number, input: Partial<SiswaInput>): Promise<SiswaAccount> {
  return apiFetch<SiswaAccount>(`/siswa/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteSiswa(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/siswa/${id}`, { method: "DELETE" });
}

export function listJurusan(): Promise<JurusanRecord[]> {
  return apiFetch<JurusanRecord[]>("/jurusan");
}

export function getJurusan(id: number): Promise<JurusanRecord> {
  return apiFetch<JurusanRecord>(`/jurusan/${id}`);
}

export function createJurusan(input: JurusanInput): Promise<JurusanRecord> {
  return apiFetch<JurusanRecord>("/jurusan", { method: "POST", body: JSON.stringify(input) });
}

export function updateJurusan(id: number, input: Partial<JurusanInput>): Promise<JurusanRecord> {
  return apiFetch<JurusanRecord>(`/jurusan/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteJurusan(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/jurusan/${id}`, { method: "DELETE" });
}

export function listKelas(jurusanId?: number): Promise<KelasRecord[]> {
  return apiFetch<KelasRecord[]>(`/kelas${queryString({ jurusan_id: jurusanId })}`);
}

export function getKelas(id: number): Promise<KelasRecord> {
  return apiFetch<KelasRecord>(`/kelas/${id}`);
}

export function createKelas(input: KelasInput): Promise<KelasRecord> {
  return apiFetch<KelasRecord>("/kelas", { method: "POST", body: JSON.stringify(input) });
}

export function updateKelas(id: number, input: Partial<KelasInput>): Promise<KelasRecord> {
  return apiFetch<KelasRecord>(`/kelas/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteKelas(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/kelas/${id}`, { method: "DELETE" });
}

export function listPelajaran(): Promise<PelajaranRecord[]> {
  return apiFetch<PelajaranRecord[]>("/pelajaran");
}

export function getPelajaran(id: number): Promise<PelajaranRecord> {
  return apiFetch<PelajaranRecord>(`/pelajaran/${id}`);
}

export function createPelajaran(input: PelajaranInput): Promise<PelajaranRecord> {
  return apiFetch<PelajaranRecord>("/pelajaran", { method: "POST", body: JSON.stringify(input) });
}

export function updatePelajaran(id: number, input: Partial<PelajaranInput>): Promise<PelajaranRecord> {
  return apiFetch<PelajaranRecord>(`/pelajaran/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deletePelajaran(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/pelajaran/${id}`, { method: "DELETE" });
}

export function listGuruPelajaran(id: number): Promise<PelajaranGuru[]> {
  return apiFetch<PelajaranGuru[]>(`/pelajaran/${id}/guru`);
}

export async function listAktivitas(limit = 20): Promise<AktivitasRecord[]> {
  const result = await apiFetch<AktivitasResponse>(`/aktivitas${queryString({ limit })}`);
  return result.data;
}

export function getProfile(): Promise<ProfileRecord> {
  return apiFetch<ProfileRecord>("/profile");
}

export function updateProfile(input: Pick<ProfileRecord, "nama" | "email" | "username" | "telepon" | "alamat" | "foto_url">): Promise<ProfileRecord> {
  return apiFetch<ProfileRecord>("/profile", { method: "PUT", body: JSON.stringify(input) });
}

export function updateProfilePassword(password_lama: string, password_baru: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/profile/password", { method: "PUT", body: JSON.stringify({ password_lama, password_baru }) });
}
