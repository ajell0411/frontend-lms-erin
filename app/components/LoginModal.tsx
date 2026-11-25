"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardPath, loginRequest, saveSession } from "@/lib/api";
import landing from "@/app/page.module.css";
import login from "@/app/login/page.module.css";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    usernameRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const result = await loginRequest(username.trim(), password);
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
    <div className={landing.loginBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={landing.loginModal} role="dialog" aria-modal="true" aria-labelledby="popup-login-title">
        <button type="button" className={landing.loginClose} onClick={onClose} aria-label="Tutup login">×</button>
        <div className={landing.loginModalCard}>
          <div className={login.logoColumn}>
            <Image src="/lo.png" alt="Logo E-CLASS" width={48} height={48} className={login.logoImg} />
            <p className={login.logoName}>E-CLASS</p>
            <p className={login.logoSub}>Learning Management System</p>
          </div>
          <h1 id="popup-login-title" className={login.title}>Selamat Datang Kembali!</h1>
          <p className={login.subtitle}>Masuk untuk melanjutkan pembelajaranmu</p>
          <form className={login.form} onSubmit={handleSubmit}>
            <div className={login.field}>
              <label htmlFor="popup-username" className={login.label}>Username</label>
              <div className={login.inputWrap}>
                <span className={login.inputIcon} aria-hidden="true">♙</span>
                <input ref={usernameRef} id="popup-username" name="username" type="text" placeholder="Masukkan username" className={login.input} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
              </div>
            </div>
            <div className={login.field}>
              <label htmlFor="popup-password" className={login.label}>Password</label>
              <div className={login.inputWrap}>
                <span className={login.inputIcon} aria-hidden="true">♙</span>
                <input id="popup-password" name="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" className={`${login.input} ${login.inputPassword}`} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
                <button type="button" className={login.togglePassword} onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                </button>
              </div>
            </div>
            {error && <p className={login.errorText} role="alert">{error}</p>}
            <div className={login.optionsRow}>
              <label className={login.checkboxLabel}>
                <input type="checkbox" className={login.checkbox} checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                Ingat saya
              </label>
              <Link href="/login" className={login.forgotLink}>Lupa password?</Link>
            </div>
            <button type="submit" className={login.submitBtn} disabled={loading}>
              {loading ? <><span className={login.spinner} />Memproses...</> : "Masuk"}
            </button>
          </form>
          <p className={login.registerText}>
            Belum punya akun? Hubungi admin sekolah.{" "}
            <Link href="/login" className={`${login.registerLink} ${landing.fullLoginLink}`}>Masuk ke full login</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
