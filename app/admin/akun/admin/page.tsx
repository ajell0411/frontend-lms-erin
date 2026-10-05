"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  createAdmin,
  deleteAdmin,
  getUser,
  listAdmin,
  updateAdmin,
  uploadAdminPhoto,
} from "@/lib/api";
import type { AdminAccount, AdminRole, UserData } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

type FormValues = {
  username: string;
  role: AdminRole | "";
  password: string;
  status: "aktif" | "nonaktif";
  nama: string;
  nip: string;
  telepon: string;
  email: string;
  foto_url: string;
};
type FormErrors = Partial<Record<keyof FormValues | "foto" | "server", string>>;
type RoleFilter = "semua" | AdminRole;
type ActionMenuState = {
  admin: AdminAccount;
  top: number;
  left: number;
};

const FORM_KOSONG: FormValues = {
  username: "",
  role: "",
  password: "",
  status: "aktif",
  nama: "",
  nip: "",
  telepon: "",
  email: "",
  foto_url: "",
};

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "admin_kurikulum", label: "Admin Kurikulum" },
  { value: "kepala_sekolah", label: "Kepala Sekolah" },
];

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Admin",
  admin_kurikulum: "Admin Kurikulum",
  kepala_sekolah: "Kepala Sekolah",
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}

function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((bagian) => bagian[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function AdminAccountsPage() {
  const { canWrite } = useRole();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("semua");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [detailAdmin, setDetailAdmin] = useState<AdminAccount | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmAdmin, setConfirmAdmin] = useState<AdminAccount | null>(null);
  const [form, setForm] = useState<FormValues>(FORM_KOSONG);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profilePreview, setProfilePreview] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  async function loadAdmins() {
    setLoading(true);
    setLoadError("");
    try {
      setAdmins(await listAdmin());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void listAdmin()
      .then(setAdmins)
      .catch((error: unknown) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => setCurrentUser(getUser()));
  }, []);

  useEffect(() => {
    if (!actionMenu) return;
    function onPointerDown(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenu(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActionMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [actionMenu]);

  useEffect(() => {
    if (!detailAdmin) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDetailAdmin(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detailAdmin]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return admins.filter((admin) => {
      const matchesQuery = !query || `${admin.nama} ${admin.email}`
        .toLocaleLowerCase("id-ID")
        .includes(query);
      return matchesQuery && (roleFilter === "semua" || admin.role === roleFilter) && (!statusFilter || admin.status === statusFilter);
    });
  }, [admins, roleFilter, search, statusFilter]);

  function openCreateForm() {
    if (!canWrite) return;
    setEditingAdmin(null);
    setForm(FORM_KOSONG);
    setFormErrors({});
    setProfilePreview("");
    setProfileFile(null);
    setShowPassword(false);
    setSuccess("");
    setFormOpen(true);
  }

  function openEditForm(admin: AdminAccount) {
    if (!canWrite) return;
    setDetailAdmin(null);
    setEditingAdmin(admin);
    setForm({
      ...FORM_KOSONG,
      role: admin.role,
      username: admin.username ?? "",
      nama: admin.nama,
      email: admin.email,
      nip: admin.nip ?? "",
      telepon: admin.telepon ?? "",
      status: admin.status === "nonaktif" ? "nonaktif" : "aktif",
      foto_url: admin.foto_url ?? "",
    });
    setFormErrors({});
    setProfilePreview(admin.foto_url ?? "");
    setProfileFile(null);
    setShowPassword(false);
    setSuccess("");
    setFormOpen(true);
  }

  function openDetailForm(admin: AdminAccount) {
    setEditingAdmin(null);
    setForm({
      ...FORM_KOSONG,
      role: admin.role,
      username: admin.username ?? "",
      nama: admin.nama,
      email: admin.email,
      nip: admin.nip ?? "",
      telepon: admin.telepon ?? "",
      status: admin.status === "nonaktif" ? "nonaktif" : "aktif",
      foto_url: admin.foto_url ?? "",
    });
    setFormErrors({});
    setProfilePreview(admin.foto_url ?? "");
    setProfileFile(null);
    setShowPassword(false);
    setDetailAdmin(admin);
    setFormOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    const errors: FormErrors = {};
    if (!form.role) errors.role = "Pilih role akun.";
    if (!editingAdmin && form.password.length < 8) errors.password = "Kata sandi minimal 8 karakter.";
    if (editingAdmin && form.password && form.password.length < 8) {
      errors.password = "Kata sandi minimal 8 karakter.";
    }
    if (!form.nama.trim()) errors.nama = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) errors.email = "Alamat email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Format alamat email tidak valid.";
    }
    if (form.nip && !/^\d+$/.test(form.nip)) errors.nip = "NIP hanya boleh berisi angka.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});
    try {
      const nama = form.nama.trim();
      const email = form.email.trim();
      const password = form.password;
      const foto_url = profileFile ? await uploadAdminPhoto(profileFile) : form.foto_url;
      if (editingAdmin) {
        await updateAdmin(editingAdmin.role, editingAdmin.id, {
          nama,
          username: form.username.trim(),
          email,
          ...(password ? { password } : {}),
          role: form.role as AdminRole,
          nip: form.nip.trim(),
          telepon: form.telepon.trim(),
          status: form.status,
          foto_url,
        });
        setSuccess("Data admin berhasil diperbarui.");
      } else {
        await createAdmin(form.role as AdminRole, {
          nama,
          username: form.username.trim(),
          email,
          password,
          nip: form.nip.trim(),
          telepon: form.telepon.trim(),
          status: form.status,
          foto_url,
        });
        setSuccess(`${ROLE_LABEL[form.role as AdminRole]} berhasil ditambahkan.`);
      }
      setFormOpen(false);
      await loadAdmins();
    } catch (error) {
      setFormErrors({ server: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canWrite || !confirmAdmin) return;
    setSaving(true);
    setFormErrors({});
    try {
      await deleteAdmin(confirmAdmin.role, confirmAdmin.id);
      setSuccess(`${ROLE_LABEL[confirmAdmin.role]} berhasil dihapus.`);
      setConfirmAdmin(null);
      await loadAdmins();
    } catch (error) {
      setFormErrors({ server: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  function pilihFoto(file: File | undefined) {
    setFormErrors((previous) => ({ ...previous, foto: undefined }));
    setProfilePreview("");
    setProfileFile(null);
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      setFormErrors((previous) => ({ ...previous, foto: "Pilih file gambar JPG atau PNG." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors((previous) => ({ ...previous, foto: "Ukuran foto maksimal 2 MB." }));
      return;
    }
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function toggleActionMenu(admin: AdminAccount, button: HTMLButtonElement) {
    if (actionMenu?.admin.id === admin.id && actionMenu.admin.role === admin.role) {
      setActionMenu(null);
      return;
    }
    const bounds = button.getBoundingClientRect();
    const menuHeight = 126;
    const menuWidth = 148;
    const opensAbove = bounds.bottom + menuHeight > window.innerHeight - 8;
    setActionMenu({
      admin,
      top: opensAbove ? Math.max(8, bounds.top - menuHeight - 5) : bounds.bottom + 5,
      left: Math.max(8, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
  }

  function cetakDaftar() {
    window.print();
  }

  function tanggalDibuat(value: string | undefined): string {
    if (!value) return "Tidak tersedia";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Tidak tersedia";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(date);
  }

  const detailMode = detailAdmin !== null;
  const editingOwnAdmin = Boolean(
    editingAdmin && currentUser?.role === "admin" &&
    String(currentUser.id) === String(editingAdmin.id),
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Manajemen Akun</p>
          <h1 className={styles.title}>Admin</h1>
          <p className={styles.subtitle}>Kelola akun admin sekolah.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.printButton} onClick={cetakDaftar}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /><path d="M17 11h.01" /></svg>
            Cetak
          </button>
          {canWrite && <button type="button" className={styles.addButton} onClick={openCreateForm}>
            <span aria-hidden="true">+</span>
            Tambah Admin
          </button>}
        </div>
      </header>

      {success && (
        <p className={styles.successMessage} role="status">
          {success}
        </p>
      )}
      {loadError && (
        <div className={styles.errorMessage} role="alert">
          <span>{loadError}</span>
          <button type="button" className={styles.retryButton} onClick={() => void loadAdmins()}>
            Coba lagi
          </button>
        </div>
      )}

      <section className={styles.panel} aria-label="Daftar admin">
        <div className={styles.toolbar}>
          <label className={styles.roleFilter}>
            <span className={styles.visuallyHidden}>Filter role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}>
              <option value="semua">Semua Role</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.selectChevron}>
              <path d="m7 10 5 5 5-5" />
            </svg>
          </label>
          <label className={styles.roleFilter}>
            <span className={styles.visuallyHidden}>Filter status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Semua Status</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option>
            </select>
          </label>
          <label className={styles.searchBox}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.searchIcon}>
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <span className={styles.visuallyHidden}>Cari admin</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau email..."
            />
          </label>
          <span className={styles.resultCount}>
            {loading ? "Memuat data..." : `${filteredAdmins.length} admin`}
          </span>
        </div>

        <div className={styles.printTableWrapper}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Profil</th>
                <th scope="col">Nama</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">NIP</th>
                <th scope="col">Status</th>
                <th scope="col" className={styles.actionsHeading}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.stateCell}>
                    <span className={styles.spinner} aria-hidden="true" />
                    Memuat daftar admin...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className={styles.stateCell}>Daftar admin belum dapat dimuat.</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    <span className={styles.emptyMark} aria-hidden="true">A</span>
                    <strong>{admins.length === 0 ? "Belum ada data admin" : "Admin tidak ditemukan"}</strong>
                    <span>
                      {admins.length === 0
                        ? "Tambahkan akun admin untuk mulai mengelola akses."
                        : "Coba kata kunci pencarian yang lain."}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <span className={styles.avatar} aria-hidden="true">
                        {admin.foto_url
                          ? <Image src={admin.foto_url} alt="" width={32} height={32} unoptimized />
                          : inisial(admin.nama)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <span className={styles.adminName}>{admin.nama}</span>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{admin.email}</td>
                    <td><span className={styles.roleBadge}>{ROLE_LABEL[admin.role]}</span></td>
                    <td>{admin.nip || "-"}</td>
                    <td><span className={admin.status === "nonaktif" ? styles.inactiveBadge : styles.activeBadge}>{admin.status || "-"}</span></td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionTrigger}
                          aria-label={`Buka menu aksi untuk ${admin.nama}`}
                          aria-haspopup="menu"
                          aria-expanded={actionMenu?.admin.id === admin.id && actionMenu.admin.role === admin.role}
                          onClick={(event) => toggleActionMenu(admin, event.currentTarget)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className={styles.tableFooter}>
          <span>Menampilkan {loading ? "-" : filteredAdmins.length} dari {loading ? "-" : admins.length} admin</span>
        </footer>
        </div>
      </section>

      {actionMenu && createPortal(
        <div
          ref={actionMenuRef}
          className={styles.actionMenu}
          role="menu"
          style={{ top: actionMenu.top, left: actionMenu.left }}
        >
          <button type="button" role="menuitem" onClick={() => { openDetailForm(actionMenu.admin); setActionMenu(null); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
            Lihat Detail
          </button>
          {canWrite && <>
            <button type="button" role="menuitem" onClick={() => { openEditForm(actionMenu.admin); setActionMenu(null); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></svg>
              Edit
            </button>
            <button type="button" role="menuitem" className={styles.menuDelete} onClick={() => { setFormErrors({}); setConfirmAdmin(actionMenu.admin); setActionMenu(null); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></svg>
              Hapus
            </button>
          </>}
        </div>,
        document.body,
      )}

      {(formOpen && canWrite || detailMode) && (
        <div className={styles.overlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) {
            if (detailMode) setDetailAdmin(null);
            else setFormOpen(false);
          }
        }}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
            <header className={styles.dialogHeader}>
              <div className={styles.dialogHeading}>
                <span className={styles.headerIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0M19 8v6m-3-3h6" /></svg>
                </span>
                <div>
                  <h2 id="admin-form-title">{detailMode ? "Detail Akun" : editingAdmin ? "Edit Akun" : "Tambah Admin Baru"}</h2>
                  <p>{detailMode ? "Informasi lengkap akun ini." : editingAdmin ? "Perbarui informasi akun admin." : "Buat akun admin baru."}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => detailMode ? setDetailAdmin(null) : setFormOpen(false)}
                aria-label="Tutup formulir"
                disabled={saving}
              >
                ×
              </button>
            </header>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12v10H2zM5 6h6M5 9h3" /></svg>
                  Informasi Akun
                </h3>
                <div className={styles.accountGrid}>
                  <label className={styles.field}>
                    <span>Nama Pengguna {!detailMode && <b>*</b>}</span>
                    <input
                      autoFocus
                      value={detailMode ? (form.username || "-") : form.username}
                      onChange={(event) => setForm({ ...form, username: event.target.value })}
                      placeholder="mis. jdoe_admin"
                      autoComplete="username"
                      readOnly={detailMode}
                      aria-invalid={!detailMode && Boolean(formErrors.username)}
                    />
                    {!detailMode && formErrors.username && <small className={styles.fieldError}>{formErrors.username}</small>}
                  </label>
                  <label className={styles.field}>
                    <span>Role {!detailMode && <b>*</b>}</span>
                    <span className={styles.selectWrap}>
                      <select
                        value={form.role}
                        onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })}
                        disabled={editingOwnAdmin || detailMode}
                        aria-invalid={!detailMode && Boolean(formErrors.role)}
                      >
                        <option value="">Pilih role...</option>
                        {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                    </span>
                    {!detailMode && formErrors.role && <small className={styles.fieldError}>{formErrors.role}</small>}
                    {editingOwnAdmin && !detailMode && <small>Role akun sendiri tidak dapat diubah.</small>}
                  </label>
                  {detailMode && <label className={styles.field}>
                    <span>Kata Sandi</span>
                    <input type="text" value="••••••••" readOnly />
                  </label>}
                  {!detailMode && <label className={styles.field}>
                    <span>Kata Sandi {!editingAdmin && <b>*</b>}{editingAdmin && " (opsional)"}</span>
                    <span className={styles.passwordWrap}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        placeholder={editingAdmin ? "Kosongkan jika tidak diubah" : "••••••••"}
                        autoComplete="new-password"
                        aria-invalid={Boolean(formErrors.password)}
                      />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3 21 21M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.2 2.3-2.3 3.4M6.2 6.2C4.3 7.5 3 9.4 2.5 12c1 2.8 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.8" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                        )}
                      </button>
                    </span>
                    {formErrors.password
                      ? <small className={styles.fieldError}>{formErrors.password}</small>
                      : <small>Minimal 8 karakter.{editingAdmin ? " Kosongkan jika tidak diubah." : ""}</small>}
                  </label>}
                  <label className={styles.field}>
                    <span>Status Akun {!detailMode && <b>*</b>}</span>
                    <span className={styles.selectWrap}>
                      <select value={detailMode ? (detailAdmin?.status ?? "") : form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FormValues["status"] })} disabled={detailMode}>
                        {detailMode && !detailAdmin?.status && <option value="">-</option>}
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                    </span>
                  </label>
                </div>
                {!detailMode && <p className={styles.localOnlyNote}>Nama pengguna belum didukung penyimpanan backend.</p>}
              </section>

              <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M5.5 10.5 10.5 5.5M5.5 5.5h.1M10.4 10.4h.1" /></svg>
                  Foto Profil
                </h3>
                <div className={styles.photoPicker}>
                  <div className={styles.photoCircle}>
                    {detailMode ? (
                      detailAdmin?.foto_url
                        ? <Image src={detailAdmin.foto_url} alt="Foto profil" width={66} height={66} unoptimized />
                        : <span className={styles.photoInitials}>{inisial(detailAdmin?.nama ?? "") || "-"}</span>
                    ) : profilePreview ? <Image src={profilePreview} alt="Pratinjau foto profil" width={66} height={66} unoptimized /> : (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z" /><circle cx="12" cy="13" r="3.5" /><path d="M18 9h.01" /></svg>
                    )}
                  </div>
                  {!detailMode && <div className={styles.photoInfo}>
                    <span>Unggah foto (JPG, PNG)</span>
                    <small>Maks. 2 MB</small>
                    <label className={styles.fileLink}>
                      Pilih File
                      <input type="file" accept="image/jpeg,image/png" onChange={(event) => pilihFoto(event.target.files?.[0])} />
                    </label>
                  </div>}
                </div>
                {!detailMode && formErrors.foto && <small className={styles.fieldError}>{formErrors.foto}</small>}
                {!detailMode && <p className={styles.localOnlyNote}>Foto akan diunggah saat akun disimpan.</p>}
              </section>

              <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h7l3 3v9H3zM10 2v3h3M5.5 8h5M5.5 11h5" /></svg>
                  Data Pribadi
                </h3>
                <div className={styles.personalGrid}>
                  <label className={`${styles.field} ${styles.fullWidth}`}>
                    <span>Nama Lengkap {!detailMode && <b>*</b>}</span>
                    <input
                      value={detailMode && !form.nama ? "-" : form.nama}
                      onChange={(event) => setForm({ ...form, nama: event.target.value })}
                      placeholder="John Doe"
                      autoComplete="name"
                      readOnly={detailMode}
                      aria-invalid={!detailMode && Boolean(formErrors.nama)}
                    />
                    {!detailMode && formErrors.nama && <small className={styles.fieldError}>{formErrors.nama}</small>}
                  </label>
                  <label className={styles.field}>
                    <span>NIP (Nomor Induk Pegawai)</span>
                    <input inputMode="numeric" pattern="[0-9]*" value={detailMode ? (form.nip || "-") : form.nip} onChange={(event) => setForm({ ...form, nip: event.target.value.replace(/\D/g, "") })} placeholder="198012345678" readOnly={detailMode} />
                    {!detailMode && formErrors.nip && <small className={styles.fieldError}>{formErrors.nip}</small>}
                  </label>
                  <label className={styles.field}>
                    <span>Nomor Telepon</span>
                    <span className={styles.phoneWrap}>
                      <span>+62</span>
                      <input type="tel" value={detailMode ? (form.telepon || "-") : form.telepon} onChange={(event) => setForm({ ...form, telepon: event.target.value })} placeholder="812-3456-7890" autoComplete="tel-national" readOnly={detailMode} />
                    </span>
                  </label>
                  <label className={`${styles.field} ${styles.fullWidth}`}>
                    <span>Alamat Email {!detailMode && <b>*</b>}</span>
                    <span className={styles.emailWrap}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                      <input
                        type="email"
                        value={detailMode && !form.email ? "-" : form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="john.doe@school.edu"
                        autoComplete="email"
                        readOnly={detailMode}
                        aria-invalid={!detailMode && Boolean(formErrors.email)}
                      />
                    </span>
                    {!detailMode && formErrors.email && <small className={styles.fieldError}>{formErrors.email}</small>}
                  </label>
                  {detailMode && detailAdmin?.created_at && (
                    <label className={`${styles.field} ${styles.fullWidth}`}>
                      <span>Dibuat pada</span>
                      <input value={tanggalDibuat(detailAdmin.created_at)} readOnly />
                    </label>
                  )}
                </div>
              </section>

              {!detailMode && formErrors.server && <p className={styles.formError} role="alert">{formErrors.server}</p>}
              <footer className={styles.dialogActions}>
                {detailMode ? (
                  <>
                    <button type="button" className={styles.cancelButton} onClick={() => setDetailAdmin(null)}>Tutup</button>
                    {canWrite && <><button type="button" className={styles.dangerButton} onClick={() => { setConfirmAdmin(detailAdmin); setDetailAdmin(null); }}>Hapus</button><button type="button" className={styles.submitButton} onClick={() => detailAdmin && openEditForm(detailAdmin)}>Edit Pengguna</button></>}
                  </>
                ) : (
                  <>
                    <button type="button" className={styles.cancelButton} onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
                    <button type="submit" className={styles.submitButton} disabled={saving}>
                      {saving ? "Menyimpan..." : editingAdmin ? "Simpan Perubahan" : "Simpan Admin"}
                    </button>
                  </>
                )}
              </footer>
            </form>
          </section>
        </div>
      )}

      {canWrite && confirmAdmin && (
        <div className={styles.overlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setConfirmAdmin(null);
        }}>
          <section className={`${styles.dialog} ${styles.confirmDialog}`} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <div className={styles.confirmIcon} aria-hidden="true">!</div>
            <h2 id="delete-title">Hapus Akun?</h2>
            <p>Akun <strong>{confirmAdmin.nama}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
            {formErrors.server && <p className={styles.formError} role="alert">{formErrors.server}</p>}
            <footer className={styles.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmAdmin(null)} disabled={saving}>
                Batal
              </button>
              <button type="button" className={styles.dangerButton} onClick={() => void handleDelete()} disabled={saving}>
                {saving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
