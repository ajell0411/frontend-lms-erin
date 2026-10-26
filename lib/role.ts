"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/api";
import type { UserData, UserRole } from "@/lib/api";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  admin_kurikulum: "Kurikulum",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
  siswa: "Siswa",
};

export function roleLabel(role: UserRole | null): string {
  return role ? ROLE_LABELS[role] : "";
}
export const WAVE = "\u{1F44B}";

export function welcomeTitle(role: UserRole | null, nama?: string | null): string {
  switch (role) {
    case "admin":
    case "super_admin":
      return `Selamat datang, Admin E-CLASS ${WAVE}`;
    case "admin_kurikulum":
      return `Selamat datang, Admin Kurikulum E-CLASS ${WAVE}`;
    case "kepala_sekolah":
      return `Selamat datang, Admin Kepala Sekolah E-CLASS ${WAVE}`;
    default:
      return `Selamat datang, ${nama || roleLabel(role) || "pengguna"} ${WAVE}`;
  }
}

export function useRole(): { user: UserData | null; role: UserRole | null; canWrite: boolean; isSuperAdmin: boolean } {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setUser(getUser()));
  }, []);

  const role = user?.role ?? null;
  return { user, role, canWrite: role === "admin" || role === "super_admin", isSuperAdmin: role === "super_admin" };
}
export function isPemantauRole(role: UserRole | null | undefined): boolean {
  return role === "admin_kurikulum" || role === "kepala_sekolah";
}