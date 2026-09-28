"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest, saveSession, dashboardPath } from "@/lib/api";
import styles from "./page.module.css";

const poin = [
  { icon: "📚", title: "Materi lengkap", desc: "Modul, slide, dan video kapan pun dibutuhkan" },
  { icon: "📝", title: "Tugas online", desc: "Kumpulkan jawaban dengan tenggat yang jelas" },
  { icon: "🎯", title: "Kuis online", desc: "Uji pemahamanmu lewat soal interaktif" },
  { icon: "✏️", title: "Ulangan harian", desc: "Kerjakan ulangan sesuai jadwal dari guru" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email/username dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const result = await loginRequest(email.trim(), password);

      if (!result.success || !result.token || !result.data) {
        setError(result.message || "Login gagal");
        return;
      }

      saveSession(result.token, result.data, remember);
      router.push(dashboardPath(result.data.role));
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Latar foto */}
      <div className={styles.bgWrap}>
        <Image
          src="/ram.png"
          alt="Ilustrasi siswa SMA belajar bersama menggunakan laptop"
          fill
          priority
          style={{ objectFit: "cover" }}
        />
        <div className={styles.bgOverlay} />
        <span className={`${styles.orb} ${styles.orb1}`} />
        <span className={`${styles.orb} ${styles.orb2}`} />
      </div>

      {/* Tombol kembali */}
      <Link href="/" className={styles.backButton}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Kembali
      </Link>

      <div className={styles.content}>
        {/* Kiri: sambutan */}
        <div className={styles.infoPanel}>
          <span className={styles.infoBadge}>E-CLASS Learning Management System</span>
          <h2 className={styles.infoTitle}>
            Belajar Lebih Mudah,
            <br />
            <span>Di Mana Saja</span>
          </h2>
          <p className={styles.infoText}>
            Satu platform untuk materi, tugas, kuis, dan ulangan. Masuk dengan
            akun yang dibuatkan admin sekolah untuk melanjutkan pembelajaranmu.
          </p>

          <ul className={styles.infoList}>
            {poin.map((p) => (
              <li key={p.title} className={styles.infoItem}>
                <span className={styles.infoIcon}>{p.icon}</span>
                <div>
                  <p className={styles.infoItemTitle}>{p.title}</p>
                  <p className={styles.infoItemDesc}>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Kanan: kotak login */}
        <div className={styles.loginBox}>
          <div className={styles.logoColumn}>
            <Image src="/lo.png" alt="Logo E-CLASS" width={48} height={48} className={styles.logoImg} />
            <p className={styles.logoName}>E-CLASS</p>
            <p className={styles.logoSub}>Learning Management System</p>
          </div>

          <h1 className={styles.title}>Selamat Datang Kembali!</h1>
          <p className={styles.subtitle}>Masuk untuk melanjutkan pembelajaranmu</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email / Username</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="text"
                  placeholder="nama@sekolah.sch.id"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className={`${styles.input} ${styles.inputPassword}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.optionsRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ingat saya
              </label>
              <a href="#" className={styles.forgotLink}>Lupa password?</a>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className={styles.registerText}>
            Belum punya akun? Hubungi admin sekolah.{" "}
            <Link href="/" className={styles.registerLink}>
              Ke beranda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}