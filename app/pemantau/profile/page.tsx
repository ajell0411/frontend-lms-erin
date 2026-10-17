"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getProfile, type ProfileRecord } from "@/lib/api";
import { roleLabel, useRole } from "@/lib/role";
import styles from "@/app/admin/profile/page.module.css";

function initials(name: string): string { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : "Permintaan gagal. Silakan coba lagi."; }

export default function PemantauProfilePage() {
  const { role } = useRole();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getProfile().then((data) => { if (active) setProfile(data); }).catch((reason: unknown) => { if (active) setError(errorMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const name = profile?.nama || "Pengguna";
  const roleText = roleLabel(profile?.role ?? role) || "-";
  const orDash = (v?: string | null) => (v && v.trim() ? v : "-");

  return (
    <main className={styles.page}>
      <header className={styles.heading}><div><p className={styles.eyebrow}>Akun Saya</p><h1 className={styles.title}>Profil</h1><p className={styles.subtitle}>Informasi akun yang sedang digunakan.</p></div></header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? <p className={styles.subtitle}>Memuat profile...</p> : (
        <section className={styles.columns} aria-label="Informasi profil">
          <article className={styles.profileCard}>
            <div className={styles.profileCover} />
            <span className={styles.avatar} aria-hidden="true">{profile?.foto_url ? <Image src={profile.foto_url} alt="" width={92} height={92} unoptimized /> : initials(name) || "P"}</span>
            <h2>{name}</h2>
            <p className={styles.username}>@{profile?.username || "-"}</p>
            <div className={styles.profileBadges}><span className={styles.roleBadge}>{roleText}</span></div>
          </article>
          <div className={styles.details}>
            <article className={styles.dataCard}><h2><span aria-hidden="true">{"\u25A6"}</span>Data Akun</h2>
              <div className={styles.fields}>
                <label><span>Nama Lengkap</span><input readOnly value={orDash(profile?.nama)} /></label>
                <label><span>Username</span><input readOnly value={orDash(profile?.username)} /></label>
                <label><span>Role</span><input readOnly value={roleText} /></label>
              </div>
            </article>
            <article className={styles.dataCard}><h2><span aria-hidden="true">{"\u2709"}</span>Informasi Kontak</h2>
              <div className={styles.fields}>
                <label><span>Email</span><input readOnly value={orDash(profile?.email)} /></label>
                <label><span>Nomor Telepon</span><input readOnly value={orDash(profile?.telepon)} /></label>
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}