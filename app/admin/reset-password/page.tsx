"use client";

import { useEffect, useMemo, useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import SearchableSelect from "@/components/SearchableSelect";
import { listAccountsForPasswordReset, resetAccountPassword, type AccountForPasswordReset, type UserRole } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  admin_kurikulum: "Admin Kurikulum",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
  siswa: "Siswa",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}

export default function ResetPasswordPage() {
  const { canWrite } = useRole();
  const [accounts, setAccounts] = useState<AccountForPasswordReset[]>([]);
  const [role, setRole] = useState<UserRole | "">("");
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    listAccountsForPasswordReset()
      .then((rows) => { if (active) setAccounts(rows); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(accounts.map((account) => account.role)));
    return roles.map((value) => ({ value, label: ROLE_LABEL[value] }));
  }, [accounts]);
  const accountOptions = useMemo(() => accounts
    .filter((account) => account.role === role)
    .map((account) => ({ value: String(account.id), label: `${account.nama} (${account.email})` })), [accounts, role]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!canWrite) return;
    if (!role || !accountId) { setError("Pilih role dan akun yang akan direset."); return; }
    if (!/^[A-Za-z0-9]{8,}$/.test(password)) { setError("Kata sandi minimal 8 karakter dan hanya boleh berisi huruf dan angka."); return; }
    if (password !== confirmation) { setError("Konfirmasi kata sandi tidak sama."); return; }
    setSaving(true);
    try {
      await resetAccountPassword(role, Number(accountId), password);
      setSuccess(`Kata sandi ${accounts.find((account) => String(account.id) === accountId)?.nama ?? "akun"} berhasil direset.`);
      setPassword("");
      setConfirmation("");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>Reset Kata Sandi</h1><p>Atur kata sandi baru untuk akun di sekolah.</p></div>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          <span>Role akun</span>
          <SearchableSelect value={role} onChange={(value) => { setRole(value as UserRole); setAccountId(""); }} options={roleOptions} placeholder={loading ? "Memuat role..." : "Pilih role"} ariaLabel="Cari role akun" disabled={loading || !canWrite} />
        </label>
        <label className={styles.field}>
          <span>Akun</span>
          <SearchableSelect value={accountId} onChange={setAccountId} options={accountOptions} placeholder={role ? "Cari nama atau email..." : "Pilih role terlebih dahulu"} ariaLabel="Cari akun" disabled={!role || loading || !canWrite} />
        </label>
        <label className={styles.field}>
          <span>Kata sandi baru</span>
          <PasswordInput autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} disabled={!canWrite} />
          <small>Minimal 8 karakter, hanya huruf dan angka.</small>
        </label>
        <label className={styles.field}>
          <span>Konfirmasi kata sandi</span>
          <PasswordInput autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} disabled={!canWrite} />
        </label>
        <button type="submit" className={styles.submit} disabled={loading || saving || !canWrite}>
          {saving ? "Menyimpan..." : "Reset Kata Sandi"}
        </button>
      </form>
    </div>
  );
}
