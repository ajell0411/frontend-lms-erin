"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { getProfile, getToken, getUser, saveSession, updateProfile, updateProfilePassword, type ProfileRecord } from "@/lib/api";
import { roleLabel, useRole } from "@/lib/role";
import styles from "./page.module.css";

const EMPTY: ProfileRecord = { id: 0, nama: "", email: "", role: "admin", username: "", telepon: "", alamat: "", foto_url: "", nip: "" };
function initials(name: string): string { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : "Permintaan gagal. Silakan coba lagi."; }

export default function AdminProfilePage() {
  const { role } = useRole();
  const [profile, setProfile] = useState<ProfileRecord>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [passwordKonfirmasi, setPasswordKonfirmasi] = useState("");

  useEffect(() => {
    let active = true;
    void getProfile().then((data) => { if (active) setProfile(data); }).catch((reason: unknown) => { if (active) setError(errorMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      const saved = await updateProfile(profile);
      setProfile(saved);
      const existing = getUser();
      if (existing) saveSession(getToken() ?? "", { ...existing, nama: saved.nama, email: saved.email }, Boolean(localStorage.getItem("token")));
      setMessage("Profil berhasil disimpan.");
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setSaving(false); }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (passwordBaru.length < 8) { setError("Password baru minimal 8 karakter."); return; }
    if (passwordBaru !== passwordKonfirmasi) { setError("Konfirmasi password baru tidak sama."); return; }
    setSaving(true);
    try {
      const result = await updateProfilePassword(passwordLama, passwordBaru);
      setPasswordLama(""); setPasswordBaru(""); setPasswordKonfirmasi(""); setMessage(result.message);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setSaving(false); }
  }

  const name = profile.nama || "Pengguna";
  return (
    <main className={styles.page}>
      <header className={styles.heading}><div><p className={styles.eyebrow}>Akun Saya</p><h1 className={styles.title}>Profil</h1><p className={styles.subtitle}>Informasi akun yang sedang digunakan.</p></div></header>
      {message && <p className={styles.success} role="status">{message}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
      <section className={styles.profile} aria-label="Informasi profil">
        <article className={styles.profileCard}>
          <div className={styles.avatar} aria-hidden="true">{profile.foto_url ? <Image src={profile.foto_url} alt="" width={96} height={96} unoptimized /> : initials(name) || "A"}</div>
          <h2>{name}</h2><span className={styles.roleBadge}>{roleLabel(profile.role ?? role)}</span>
          <span className={profile.status === "nonaktif" ? styles.inactiveBadge : styles.activeBadge}>{profile.status === "nonaktif" ? "Nonaktif" : "Aktif"}</span>
        </article>
        <article className={styles.dataCard}><h2>Data Pribadi</h2>
          <dl><div><dt>Nama</dt><dd>{profile.nama || "-"}</dd></div><div><dt>Email</dt><dd>{profile.email || "-"}</dd></div><div><dt>Telepon</dt><dd>{profile.telepon || "-"}</dd></div><div className={styles.full}><dt>Alamat</dt><dd>{profile.alamat || "-"}</dd></div></dl>
        </article>
        <article className={styles.dataCard}><h2>Kredensial Akun</h2>
          <dl><div><dt>Username</dt><dd>{profile.username || "-"}</dd></div><div><dt>Role</dt><dd>{roleLabel(profile.role ?? role) || "-"}</dd></div><div className={styles.full}><dt>Akun dibuat</dt><dd>{profile.created_at ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(profile.created_at)) : "-"}</dd></div></dl>
        </article>
      </section>
      {loading ? <p className={styles.subtitle}>Memuat profile...</p> : <>
        <form className={styles.formCard} onSubmit={saveData}>
          <h2>Ubah Data Profil</h2><div className={styles.formGrid}>
            <label>Nama<input required value={profile.nama} onChange={(event) => setProfile({ ...profile, nama: event.target.value })}/></label>
            <label>Email<input required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })}/></label>
            <label>Username<input value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })}/></label>
            <label>Telepon<input value={profile.telepon} onChange={(event) => setProfile({ ...profile, telepon: event.target.value })}/></label>
            <label className={styles.full}>Alamat<input value={profile.alamat} onChange={(event) => setProfile({ ...profile, alamat: event.target.value })}/></label>
          </div><button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
        </form>
        <form id="credentials" className={styles.formCard} onSubmit={savePassword}>
          <h2>Ubah Password</h2><div className={styles.formGrid}>
            <label>Password Lama<input required type="password" value={passwordLama} onChange={(event) => setPasswordLama(event.target.value)}/></label>
            <label>Password Baru<input required minLength={8} type="password" value={passwordBaru} onChange={(event) => setPasswordBaru(event.target.value)}/></label>
            <label>Konfirmasi Password Baru<input required type="password" value={passwordKonfirmasi} onChange={(event) => setPasswordKonfirmasi(event.target.value)}/></label>
          </div><button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Password"}</button>
        </form>
      </>}
    </main>
  );
}
