"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { createGuru, deleteGuru, listGuru, listPelajaran, updateGuru, uploadAdminPhoto } from "@/lib/api";
import type { GuruAccount, GuruInput, JenisKelamin, PelajaranRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

type FormData = Omit<GuruInput, "password"> & { password: string; pelajaran_id: number | null };
type Errors = Partial<Record<keyof FormData | "foto_url" | "server", string>>;
type Menu = { item: GuruAccount; top: number; left: number };
const EMPTY: FormData = { nama: "", username: "", email: "", password: "", nip: "", jenis_kelamin: "", telepon: "", alamat: "", status: "aktif", foto_url: "", pelajaran_id: null };

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }
function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(date); }

export default function GuruPage() {
  const { canWrite } = useRole();
  const [items, setItems] = useState<GuruAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pelajaranFilter, setPelajaranFilter] = useState("");
  const [pelajaran, setPelajaran] = useState<PelajaranRecord[]>([]);
  const [pelajaranError, setPelajaranError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<GuruAccount | null>(null);
  const [editing, setEditing] = useState<GuruAccount | null>(null);
  const [deleting, setDeleting] = useState<GuruAccount | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  async function reload() {
    setLoading(true); setLoadError("");
    try { setItems(await listGuru({ search: search || undefined, status: statusFilter || undefined, pelajaran_id: pelajaranFilter ? Number(pelajaranFilter) : undefined })); }
    catch (error) { setLoadError(message(error)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void listGuru().then(setItems).catch((error: unknown) => setLoadError(message(error))).finally(() => setLoading(false));
    void listPelajaran().then((rows) => { setPelajaran(rows); setPelajaranError(rows.length ? "" : "Belum ada data mata pelajaran."); }).catch((error: unknown) => setPelajaranError(`Data mata pelajaran gagal dimuat: ${message(error)}`));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void listGuru({ search: search || undefined, status: statusFilter || undefined, pelajaran_id: pelajaranFilter ? Number(pelajaranFilter) : undefined }).then(setItems).catch((error: unknown) => setLoadError(message(error))); }, 160);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter, pelajaranFilter]);

  useEffect(() => {
    if (!menu) return;
    const outside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu(null); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("mousedown", outside); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", key); };
  }, [menu]);

  useEffect(() => {
    if (!detail && !formOpen) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) { setDetail(null); setFormOpen(false); } };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [detail, formOpen, saving]);

  useEffect(() => {
    if (!detail) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setDetail(null); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [detail]);

  const rows = useMemo(() => items, [items]);

  function openCreate() { if (!canWrite) return; setEditing(null); setForm(EMPTY); setErrors({}); setFile(null); setPreview(""); setShowPassword(false); setFormOpen(true); setSuccess(""); }
  function openEdit(item: GuruAccount) {
    if (!canWrite) return;
    setDetail(null);
    setEditing(item);
    setForm({ nama: item.nama, username: item.username, email: item.email, password: "", nip: item.nip ?? "", jenis_kelamin: item.jenis_kelamin ?? "", telepon: item.telepon ?? "", alamat: item.alamat ?? "", status: item.status, foto_url: item.foto_url ?? "", pelajaran_id: item.pelajaran_id ?? null });
    setErrors({}); setFile(null); setPreview(item.foto_url ?? ""); setShowPassword(false); setFormOpen(true); setSuccess("");
  }

  function openDetail(item: GuruAccount) {
    setForm({ nama: item.nama, username: item.username ?? "", email: item.email, password: "", nip: item.nip ?? "", jenis_kelamin: item.jenis_kelamin ?? "", telepon: item.telepon ?? "", alamat: item.alamat ?? "", status: item.status ?? "aktif", foto_url: item.foto_url ?? "", pelajaran_id: item.pelajaran_id ?? null });
    setDetail(item); setFormOpen(false); setErrors({}); setPreview(item.foto_url ?? "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    const next: Errors = {};
    if (!form.nama.trim()) next.nama = "Nama wajib diisi.";
    if (!form.username.trim()) next.username = "Username wajib diisi.";
    if (!form.email.trim()) next.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Format email tidak valid.";
    if (!editing && form.password.length < 8) next.password = "Password minimal 8 karakter.";
    if (editing && form.password && form.password.length < 8) next.password = "Password minimal 8 karakter.";
    if (!form.status) next.status = "Status wajib dipilih.";
    if (form.nip && !/^\d+$/.test(form.nip)) next.nip = "NIP hanya boleh berisi angka.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setSaving(true); setErrors({});
    try {
      const foto_url = file ? await uploadAdminPhoto(file) : form.foto_url;
      const payload: GuruInput = { ...form, nama: form.nama.trim(), username: form.username.trim(), email: form.email.trim(), nip: form.nip.trim(), telepon: form.telepon.trim(), foto_url };
      if (editing) await updateGuru(editing.id, payload);
      else await createGuru(payload);
      setFormOpen(false); setSuccess(editing ? "Data guru berhasil diperbarui." : "Guru berhasil ditambahkan."); await reload();
    } catch (error) { setErrors({ server: message(error) }); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!canWrite || !deleting) return;
    setSaving(true); setErrors({});
    try { await deleteGuru(deleting.id); setDeleting(null); setSuccess("Guru berhasil dihapus."); await reload(); }
    catch (error) { setErrors({ server: message(error) }); }
    finally { setSaving(false); }
  }

  function choosePhoto(selected?: File) {
    setErrors((current) => ({ ...current, foto_url: undefined })); setPreview(""); setFile(null);
    if (!selected) return;
    if (!/^(image\/jpeg|image\/png)$/.test(selected.type)) { setErrors((current) => ({ ...current, foto_url: "Pilih foto JPG atau PNG." })); return; }
    if (selected.size > 2 * 1024 * 1024) { setErrors((current) => ({ ...current, foto_url: "Ukuran foto maksimal 2 MB." })); return; }
    setFile(selected); const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === "string") setPreview(reader.result); }; reader.readAsDataURL(selected);
  }

  function toggleMenu(item: GuruAccount, button: HTMLButtonElement) {
    if (menu?.item.id === item.id) { setMenu(null); return; }
    const rect = button.getBoundingClientRect(); const height = 126; const width = 148;
    setMenu({ item, top: rect.bottom + height > window.innerHeight ? Math.max(8, rect.top - height) : rect.bottom + 5, left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)) });
  }

  function photo(value: string, name: string, size: number) {
    return <span className={styles.avatar} style={{ width: size, height: size, flexBasis: size }}>{value ? <Image src={value} alt="" width={size} height={size} unoptimized /> : initials(name) || "G"}</span>;
  }

  function printList() { window.print(); }

  const activeFilters = [
    search.trim() ? `Pencarian: ${search.trim()}` : "",
    pelajaranFilter ? `Mata Pelajaran: ${pelajaran.find((item) => String(item.id) === pelajaranFilter)?.nama ?? "-"}` : "",
    statusFilter ? `Status: ${statusFilter === "aktif" ? "Aktif" : "Nonaktif"}` : "",
  ].filter(Boolean);
  const printedAt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}><p className={styles.eyebrow}>Manajemen Akun</p><h1 className={styles.title}>Guru</h1><p className={styles.subtitle}>Kelola akun dan informasi guru.</p></div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.printButton} onClick={printList} disabled={loading || rows.length === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/><path d="M17 11h.01"/></svg>
            Cetak
          </button>
          {canWrite && <button type="button" className={styles.addButton} onClick={openCreate}><span aria-hidden="true">+</span>Tambah Guru</button>}
        </div>
      </header>
      {success && <p className={styles.successMessage} role="status">{success}</p>}
      {loadError && <div className={styles.errorMessage} role="alert"><span>{loadError}</span><button type="button" className={styles.retryButton} onClick={() => void reload()}>Coba lagi</button></div>}
      <section className={styles.panel} aria-label="Daftar guru">
        <div className={styles.toolbar}>
          <label className={styles.searchBox}><svg aria-hidden="true" viewBox="0 0 24 24" className={styles.searchIcon}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><span className={styles.visuallyHidden}>Cari guru</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email..."/></label>
          <label className={styles.roleFilter}><span className={styles.visuallyHidden}>Filter mata pelajaran</span><select value={pelajaranFilter} onChange={(event) => setPelajaranFilter(event.target.value)}><option value="">Semua Mata Pelajaran</option>{pelajaran.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select><svg aria-hidden="true" viewBox="0 0 24 24" className={styles.selectChevron}><path d="m7 10 5 5 5-5"/></svg></label>
          <label className={styles.roleFilter}><span className={styles.visuallyHidden}>Filter status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Semua Status</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select><svg aria-hidden="true" viewBox="0 0 24 24" className={styles.selectChevron}><path d="m7 10 5 5 5-5"/></svg></label>
          <span className={styles.resultCount}>{loading ? "Memuat data..." : `${rows.length} guru`}</span>
        </div>
        <div className={styles.printTableWrapper}><div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Profil</th><th>Nama</th><th>Username</th><th>Email</th><th>NIP</th><th>Mata Pelajaran</th><th>Status</th><th className={styles.actionsHeading}>Aksi</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={8} className={styles.stateCell}><span className={styles.spinner}/>Memuat daftar guru...</td></tr> : loadError ? <tr><td colSpan={8} className={styles.stateCell}>Daftar guru belum dapat dimuat.</td></tr> : rows.length === 0 ? <tr><td colSpan={8} className={styles.emptyCell}><span className={styles.emptyMark}>G</span><strong>Belum ada data guru</strong><span>Tambahkan akun guru untuk mulai mengelola data.</span></td></tr> : rows.map((item) => <tr key={item.id}><td>{photo(item.foto_url, item.nama, 32)}</td><td><span className={styles.adminName}>{item.nama}</span></td><td>{item.username || "-"}</td><td className={styles.emailCell}>{item.email}</td><td>{item.nip || "-"}</td><td>{item.nama_pelajaran || "-"}</td><td><span className={item.status === "nonaktif" ? styles.inactiveBadge : styles.activeBadge}>{item.status || "-"}</span></td><td><div className={styles.rowActions}><button type="button" className={styles.actionTrigger} aria-label={`Aksi ${item.nama}`} onClick={(event) => toggleMenu(item, event.currentTarget)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button></div></td></tr>)}</tbody>
        </table></div><footer className={styles.tableFooter}>Menampilkan {loading ? "-" : rows.length} guru</footer>
        </div>
      </section>

      <section className={styles.printSheet} aria-hidden="true">
        <h1>Data Guru</h1>
        <p>{activeFilters.length ? activeFilters.join(" | ") : "Filter: Semua Data"}</p>
        <p>Dicetak: {printedAt} Â· Jumlah data: {rows.length}</p>
        <table><thead><tr><th>No</th><th>Nama</th><th>Username</th><th>Email</th><th>NIP</th><th>Mata Pelajaran</th><th>Telepon</th><th>Status</th></tr></thead>
          <tbody>{rows.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.nama || "-"}</td><td>{item.username || "-"}</td><td>{item.email || "-"}</td><td>{item.nip || "-"}</td><td>{item.nama_pelajaran || "-"}</td><td>{item.telepon || "-"}</td><td>{item.status || "-"}</td></tr>)}</tbody>
        </table>
      </section>

      {menu && createPortal(<div ref={menuRef} className={styles.actionMenu} role="menu" style={{ top: menu.top, left: menu.left }}>
        <button type="button" role="menuitem" onClick={() => { openDetail(menu.item); setMenu(null); }}><svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>Lihat Detail</button>
        {canWrite && <>
          <button type="button" role="menuitem" onClick={() => { openEdit(menu.item); setMenu(null); }}><svg viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/></svg>Edit</button>
          <button type="button" role="menuitem" className={styles.menuDelete} onClick={() => { setDeleting(menu.item); setMenu(null); setErrors({}); }}><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg>Hapus</button>
        </>}
      </div>, document.body)}

      {(formOpen && canWrite || detail) && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setFormOpen(false); setDetail(null); } }}>
        <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="guru-form-title">
          <header className={styles.dialogHeader}><div className={styles.dialogHeading}><span className={styles.headerIcon}><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg></span><div><h2 id="guru-form-title">{detail ? "Detail Guru" : editing ? "Edit Akun Guru" : "Tambah Guru Baru"}</h2><p>{detail ? "Informasi lengkap akun ini." : editing ? "Perbarui informasi akun guru." : "Buat akun guru baru."}</p></div></div><button type="button" className={styles.closeButton} onClick={() => { setFormOpen(false); setDetail(null); }}>Ã—</button></header>
          <form className={styles.form} noValidate onSubmit={submit}>
            <section className={styles.formSection}><h3 className={styles.sectionTitle}>Informasi Akun</h3><div className={styles.accountGrid}>
              <Field label="Nama Lengkap" required error={!detail ? errors.nama : undefined}><input value={form.nama} readOnly={!!detail} onChange={(event) => setForm({ ...form, nama: event.target.value })} placeholder="Nama lengkap"/></Field>
              <Field label="Username" required error={!detail ? errors.username : undefined}><input value={form.username || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="mis. guru_sekolah"/></Field>
              {!detail && <Field label="Password" required={!editing} error={errors.password}><span className={styles.passwordWrap}><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? "Kosongkan jika tidak diubah" : "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan/sembunyikan password">â—‰</button></span><small>{editing ? "Kosongkan jika tidak diubah." : "Minimal 8 karakter."}</small></Field>}
              {detail && <Field label="Password"><input value="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" readOnly/></Field>}
              <Field label="Status" required><Select value={detail ? (detail.status || "-") : form.status} disabled={!!detail} onChange={(value) => setForm({ ...form, status: value as FormData["status"] })} options={detail && !detail.status ? [["-","-"]] : [["aktif","Aktif"],["nonaktif","Nonaktif"]]}/></Field>
              <Field label="Mata Pelajaran" error={!detail ? pelajaranError : undefined}><Select value={detail ? (detail.pelajaran_id ? String(detail.pelajaran_id) : "") : String(form.pelajaran_id ?? "")} disabled={!!detail || pelajaran.length === 0} onChange={(value) => setForm({ ...form, pelajaran_id: value ? Number(value) : null })} options={detail ? (detail.pelajaran_id ? [[String(detail.pelajaran_id), detail.nama_pelajaran || "-"]] : [["","-"]]) : [["","Pilih mata pelajaran"], ...pelajaran.map((item) => [String(item.id), item.nama] as [string,string])]}/>{!detail && pelajaran.length === 0 && <small className={styles.fieldError}>{pelajaranError || "Belum ada mata pelajaran."}</small>}</Field>
            </div></section>
            <section className={styles.formSection}><h3 className={styles.sectionTitle}>Foto Profil</h3><div className={styles.photoPicker}>{photo(detail?.foto_url || preview, detail?.nama || form.nama, 66)}{!detail && <div className={styles.photoInfo}><span>Unggah foto (JPG, PNG)</span><small>Maks. 2 MB</small><label className={styles.fileLink}>Pilih File<input type="file" accept="image/jpeg,image/png" onChange={(event) => choosePhoto(event.target.files?.[0])}/></label></div>}</div>{errors.foto_url && <small className={styles.fieldError}>{errors.foto_url}</small>}</section>
            <section className={styles.formSection}><h3 className={styles.sectionTitle}>Data Pribadi</h3><div className={styles.personalGrid}>
              <Field label="Email" required error={!detail ? errors.email : undefined} full><input type="email" value={form.email || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="nama@sekolah.id"/></Field>
              <Field label="NIP" error={!detail ? errors.nip : undefined}><input inputMode="numeric" pattern="[0-9]*" value={form.nip || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, nip: event.target.value.replace(/\D/g, "") })}/></Field>
              <Field label="Jenis Kelamin"><Select value={detail ? (detail.jenis_kelamin || "-") : form.jenis_kelamin} disabled={!!detail} onChange={(value) => setForm({ ...form, jenis_kelamin: value as JenisKelamin | "" })} options={detail && !detail.jenis_kelamin ? [["-","-"]] : [["","Pilih..."],["L","Laki-laki"],["P","Perempuan"]]}/></Field>
              <Field label="Telepon"><span className={styles.phoneWrap}><span>+62</span><input value={form.telepon || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, telepon: event.target.value })}/></span></Field>
              <Field label="Alamat" full><input value={form.alamat || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, alamat: event.target.value })}/></Field>
              {detail && <Field label="Dibuat pada"><input value={dateLabel(detail.created_at)} readOnly/></Field>}
            </div></section>
            {!detail && errors.server && <p className={styles.formError}>{errors.server}</p>}
            <footer className={styles.dialogActions}>{detail ? <><button type="button" className={styles.cancelButton} onClick={() => setDetail(null)}>Tutup</button>{canWrite && <><button type="button" className={styles.dangerButton} onClick={() => { setDeleting(detail); setDetail(null); }}>Hapus</button><button type="button" className={styles.submitButton} onClick={() => openEdit(detail)}>Edit Pengguna</button></>}</> : <><button type="button" className={styles.cancelButton} onClick={() => setFormOpen(false)}>Batal</button><button className={styles.submitButton} disabled={saving}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Guru"}</button></>}</footer>
          </form>
        </section>
      </div>}

      {canWrite && deleting && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleting(null); }}><section className={`${styles.dialog} ${styles.confirmDialog}`} role="alertdialog"><div className={styles.confirmIcon}>!</div><h2>Hapus Akun?</h2><p>Akun guru <strong>{deleting.nama}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>{errors.server && <p className={styles.formError}>{errors.server}</p>}<footer className={styles.dialogActions}><button className={styles.cancelButton} type="button" onClick={() => setDeleting(null)}>Batal</button><button className={styles.dangerButton} type="button" disabled={saving} onClick={() => void remove()}>{saving ? "Menghapus..." : "Ya, Hapus"}</button></footer></section></div>}
    </div>
  );

}

function Field({ label, required = false, error, full = false, children }: { label: string; required?: boolean; error?: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`${styles.field} ${full ? styles.fullWidth : ""}`}><span>{label}{required && <b> *</b>}</span>{children}{error && <small className={styles.fieldError}>{error}</small>}</label>;
}

function Select({ value, onChange, options, disabled = false }: { value: string; onChange: (value: string) => void; options: [string,string][]; disabled?: boolean }) {
  return <span className={styles.selectWrap}><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue,label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span>;
}
