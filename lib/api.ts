export type UserData = {
  id: number;
  nama: string;
  email: string;
  role: string;
};

export type LoginResult = {
  success: boolean;
  message?: string;
  token?: string;
  data?: UserData;
};

// Login ke backend Go (lewat proxy Next.js: /api -> localhost:8080)
export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
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

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

// Role di backend: admin | admin_kurikulum | kepala_sekolah | guru | siswa
export function dashboardPath(role: string): string {
  switch (role) {
    case "guru":
      return "/guru/dashboard";
    case "siswa":
      return "/siswa/dashboard";
    case "admin_kurikulum":
      return "/kurikulum/dashboard";
    case "kepala_sekolah":
      return "/kepala-sekolah/dashboard";
    default:
      return "/admin/dashboard";
  }
}

// Untuk request lain (halaman admin, dll) yang butuh token
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  // Token kedaluwarsa atau tidak valid: bersihkan sesi dan kembali ke login
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error(data.error ?? data.message ?? "Sesi berakhir, silakan login lagi");
  }

  if (!res.ok) throw new Error(data.error ?? data.message ?? "Terjadi kesalahan");
  return data as T;
}