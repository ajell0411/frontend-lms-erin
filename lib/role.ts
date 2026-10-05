"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/api";
import type { UserData, UserRole } from "@/lib/api";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  admin_kurikulum: "Admin Kurikulum",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
  siswa: "Siswa",
};

export function roleLabel(role: UserRole | null): string {
  return role ? ROLE_LABELS[role] : "";
}

export function useRole(): { user: UserData | null; role: UserRole | null; canWrite: boolean } {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setUser(getUser()));
  }, []);

  const role = user?.role ?? null;
  return { user, role, canWrite: role === "admin" };
}