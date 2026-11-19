"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { getProfile, updateProfilePassword, type ProfileRecord } from "@/lib/api";
import { roleLabel, useRole } from "@/lib/role";
import styles from "@/app/admin/profile/page.module.css";

function initials(name: string): string { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : "Permintaan gagal. Silakan coba lagi."; }

export default function PemantauProfilePage() {
  const { role } = useRole();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [passwordKonfirmasi, setPasswordKonfirmasi] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getProfile().then((data) => { if (active) setProfile(data); }).catch((reason: unknown) => { if (active) setError(errorMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!passwordLama) { setPasswordError("Password saat ini wajib diisi."); return; }
    if (!/^[A-Za-z0-9]{8,}$/.test(passwordBaru)) { setPasswordError("Password baru minimal 8 karakter dan hanya boleh berisi huruf dan angka."); return; }
    if (passwordBaru !== passwordKonfirmasi) { setPasswordError("Konfirmasi password baru tidak sama."); return; }
    setPasswordSaving(true);
    try {
      const result = await updateProfilePassword(passwordLama, passwordBaru);
      setPasswordLama("");
      setPasswordBaru("");
      setPasswordKonfirmasi("");
      setPasswordSuccess(result.message);
    } catch (reason) {
      setPasswordError(errorMessage(reason));
    } finally {
      setPasswordSaving(false);
    }
  }

  const name = profile?.nama || "Pengguna";
  const roleText = roleLabel(profile?.role ?? role) || "-";
  const orDash = (v?: string | null) => (v && v.trim() ? v : "-");

  return (
    <main className={styles.page}>
      <header className={styles.heading}><div><h1 className={styles.title}>Profil</h1><p className={styles.subtitle}>Informasi akun yang sedang digunakan.</p></div></header>
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
      {!loading && !error && <>
        {passwordError && <p className={styles.error} role="alert">{passwordError}</p>}
        {passwordSuccess && <p className={styles.success} role="status">{passwordSuccess}</p>}
        <form className={styles.formCard} onSubmit={savePassword}>
          <h2>Ubah Kata Sandi</h2>
          <div className={styles.formGrid}>
            <label>Password Saat Ini<input required type="password" autoComplete="current-password" value={passwordLama} onChange={(event) => setPasswordLama(event.target.value)} disabled={passwordSaving} /></label>
            <label>Password Baru<input required minLength={8} type="password" autoComplete="new-password" value={passwordBaru} onChange={(event) => setPasswordBaru(event.target.value)} disabled={passwordSaving} /></label>
            <label>Konfirmasi Password Baru<input required minLength={8} type="password" autoComplete="new-password" value={passwordKonfirmasi} onChange={(event) => setPasswordKonfirmasi(event.target.value)} disabled={passwordSaving} /></label>
          </div>
          <button type="submit" disabled={passwordSaving}>{passwordSaving ? "Menyimpan..." : "Simpan Kata Sandi"}</button>
        </form>
      </>}
    </main>
  );
}