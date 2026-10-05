"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { createSiswa, deleteSiswa, listJurusan, listKelas, listSiswa, updateSiswa, uploadAdminPhoto } from "@/lib/api";
import type { JenisKelamin, JurusanRecord, KelasRecord, SiswaAccount, SiswaInput } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

type FormData = Omit<SiswaInput, "password"> & { password: string; jurusan_id: number | null };
type Errors = Partial<Record<keyof FormData | "foto_url" | "server", string>>;
type Menu = { item: SiswaAccount; top: number; left: number };
const EMPTY: FormData = { nama: "", username: "", email: "", password: "", nisn: "", jenis_kelamin: "", tempat_lahir: "", tanggal_lahir: "", alamat: "", telepon: "", nama_wali: "", telepon_wali: "", tahun_masuk: null, status: "aktif", foto_url: "", kelas_id: null, jurusan_id: null };

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }
function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(date); }

export default function SiswaPage() {
  const { canWrite } = useRole();
  const [items, setItems] = useState<SiswaAccount[]>([]);
  const [jurusan, setJurusan] = useState<JurusanRecord[]>([]);
  const [filterKelas, setFilterKelas] = useState<KelasRecord[]>([]);
  const [formKelas, setFormKelas] = useState<KelasRecord[]>([]);
  const [masterError, setMasterError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<SiswaAccount | null>(null);
  const [editing, setEditing] = useState<SiswaAccount | null>(null);
  const [deleting, setDeleting] = useState<SiswaAccount | null>(null);
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
    try { setItems(await listSiswa({ search: search || undefined, status: statusFilter || undefined, jurusan_id: jurusanFilter ? Number(jurusanFilter) : undefined, kelas_id: kelasFilter ? Number(kelasFilter) : undefined })); }
    catch (error) { setLoadError(message(error)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void listJurusan().then((rows) => { setJurusan(rows); if (rows.length === 0) setMasterError("Belum ada data jurusan."); }).catch((error: unknown) => setMasterError(`Data jurusan gagal dimuat: ${message(error)}`));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError("");
      void listSiswa({ search: search || undefined, status: statusFilter || undefined, jurusan_id: jurusanFilter ? Number(jurusanFilter) : undefined, kelas_id: kelasFilter ? Number(kelasFilter) : undefined })
        .then((rows) => { if (active) setItems(rows); })
        .catch((error: unknown) => { if (active) setLoadError(message(error)); })
        .finally(() => { if (active) setLoading(false); });
    }, 160);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, statusFilter, jurusanFilter, kelasFilter]);

  useEffect(() => {

    void listKelas(jurusanFilter ? Number(jurusanFilter) : undefined).then((rows) => setFilterKelas(rows)).catch((error: unknown) => { setFilterKelas([]); setMasterError(`Data kelas gagal dimuat: ${message(error)}`); });
  }, [jurusanFilter]);

  useEffect(() => {
    if (!form.jurusan_id) return;
    void listKelas(form.jurusan_id).then((rows) => { setFormKelas(rows); setMasterError(rows.length ? "" : "Belum ada kelas untuk jurusan yang dipilih."); }).catch((error: unknown) => { setFormKelas([]); setMasterError(`Data kelas gagal dimuat: ${message(error)}`); });
  }, [form.jurusan_id]);

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
    document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key);
  }, [detail]);

  const rows = useMemo(() => items, [items]);

  function openCreate() { if (!canWrite) return; setEditing(null); setForm(EMPTY); setErrors({}); setFile(null); setPreview(""); setShowPassword(false); setFormKelas([]); setFormOpen(true); setSuccess(""); }
  function openEdit(item: SiswaAccount) {
    if (!canWrite) return;
    setDetail(null);
    setEditing(item);
    const selectedMajor = item.jurusan_id ?? null;
    setForm({ nama: item.nama, username: item.username, email: item.email, password: "", nisn: item.nisn ?? "", jenis_kelamin: item.jenis_kelamin ?? "", tempat_lahir: item.tempat_lahir ?? "", tanggal_lahir: item.tanggal_lahir ?? "", alamat: item.alamat ?? "", telepon: item.telepon ?? "", nama_wali: item.nama_wali ?? "", telepon_wali: item.telepon_wali ?? "", tahun_masuk: item.tahun_masuk, status: item.status, foto_url: item.foto_url ?? "", kelas_id: item.kelas_id, jurusan_id: selectedMajor });
    setErrors({}); setFile(null); setPreview(item.foto_url ?? ""); setShowPassword(false); setFormOpen(true); setSuccess("");
  }

  function openDetail(item: SiswaAccount) {
    setEditing(null);
    setForm({ nama: item.nama, username: item.username ?? "", email: item.email, password: "", nisn: item.nisn ?? "", jenis_kelamin: item.jenis_kelamin ?? "", tempat_lahir: item.tempat_lahir ?? "", tanggal_lahir: item.tanggal_lahir ?? "", alamat: item.alamat ?? "", telepon: item.telepon ?? "", nama_wali: item.nama_wali ?? "", telepon_wali: item.telepon_wali ?? "", tahun_masuk: item.tahun_masuk, status: item.status ?? "aktif", foto_url: item.foto_url ?? "", kelas_id: item.kelas_id, jurusan_id: item.jurusan_id });
    setDetail(item); setFormOpen(false); setErrors({}); setFile(null); setPreview(item.foto_url ?? "");
    if (item.jurusan_id) { void listKelas(item.jurusan_id).then(setFormKelas).catch((error: unknown) => setMasterError(`Data kelas gagal dimuat: ${message(error)}`)); }
    else setFormKelas([]);
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
    if (!form.jurusan_id) next.jurusan_id = "Jurusan wajib dipilih.";
    if (!form.kelas_id) next.kelas_id = "Kelas wajib dipilih.";
    if (form.nisn && !/^\d+$/.test(form.nisn)) next.nisn = "NISN hanya boleh berisi angka.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setSaving(true); setErrors({});
    try {
      const foto_url = file ? await uploadAdminPhoto(file) : form.foto_url;
      const payload: SiswaInput = { ...form, nama: form.nama.trim(), username: form.username.trim(), email: form.email.trim(), foto_url, kelas_id: form.kelas_id };
      if (editing) await updateSiswa(editing.id, payload);
      else await createSiswa(payload);
      setFormOpen(false); setSuccess(editing ? "Data siswa berhasil diperbarui." : "Siswa berhasil ditambahkan."); await reload();
    } catch (error) { setErrors({ server: message(error) }); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!canWrite || !deleting) return;
    setSaving(true); setErrors({});
    try { await deleteSiswa(deleting.id); setDeleting(null); setSuccess("Siswa berhasil dihapus."); await reload(); }
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

  function toggleMenu(item: SiswaAccount, button: HTMLButtonElement) {
    if (menu?.item.id === item.id) { setMenu(null); return; }
    const rect = button.getBoundingClientRect(); const height = 126; const width = 148;
    setMenu({ item, top: rect.bottom + height > window.innerHeight ? Math.max(8, rect.top - height) : rect.bottom + 5, left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)) });
  }

  function changeMajor(value: string) { const jurusan_id = value ? Number(value) : null; setForm((current) => ({ ...current, jurusan_id, kelas_id: null })); setFormKelas([]); }
  function photo(url: string, name: string, size: number) { return <span className={styles.avatar} style={{ width: size, height: size, flexBasis: size }}>{url ? <Image src={url} alt="" width={size} height={size} unoptimized /> : initials(name) || "S"}</span>; }
  function printList() { window.print(); }

  const activeFilters = [
    search.trim() ? `Pencarian: ${search.trim()}` : "",
    jurusanFilter ? `Jurusan: ${jurusan.find((item) => String(item.id) === jurusanFilter)?.nama ?? "-"}` : "",
    kelasFilter ? `Kelas: ${filterKelas.find((item) => String(item.id) === kelasFilter)?.nama ?? "-"}` : "",
    statusFilter ? `Status: ${statusFilter === "aktif" ? "Aktif" : "Nonaktif"}` : "",
  ].filter(Boolean);
  const printedAt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}><div className={styles.titleBlock}><p className={styles.eyebrow}>Manajemen Akun</p><h1 className={styles.title}>Siswa</h1><p className={styles.subtitle}>Kelola akun dan informasi siswa.</p></div><div className={styles.headerActions}><button type="button" className={styles.printButton} onClick={printList} disabled={loading || rows.length === 0}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/><path d="M17 11h.01"/></svg>Cetak</button>{canWrite && <button type="button" className={styles.addButton} onClick={openCreate}><span aria-hidden="true">+</span>Tambah Siswa</button>}</div></header>
      {success && <p className={styles.successMessage} role="status">{success}</p>}
      {loadError && <div className={styles.errorMessage} role="alert"><span>{loadError}</span><button className={styles.retryButton} onClick={() => void reload()}>Coba lagi</button></div>}
      <section className={styles.panel} aria-label="Daftar siswa">
        <div className={styles.toolbar}>
          <label className={styles.searchBox}><svg aria-hidden="true" viewBox="0 0 24 24" className={styles.searchIcon}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><span className={styles.visuallyHidden}>Cari siswa</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau NISN..."/></label>
          <label className={styles.roleFilter}><span className={styles.visuallyHidden}>Filter jurusan</span><select value={jurusanFilter} onChange={(event) => { setJurusanFilter(event.target.value); setKelasFilter(""); }}><option value="">Semua Jurusan</option>{jurusan.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select><svg viewBox="0 0 24 24" className={styles.selectChevron}><path d="m7 10 5 5 5-5"/></svg></label>
          <label className={styles.roleFilter}><span className={styles.visuallyHidden}>Filter kelas</span><select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)}><option value="">Semua Kelas</option>{filterKelas.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select><svg viewBox="0 0 24 24" className={styles.selectChevron}><path d="m7 10 5 5 5-5"/></svg></label>
          <label className={styles.roleFilter}><span className={styles.visuallyHidden}>Filter status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Semua Status</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select><svg viewBox="0 0 24 24" className={styles.selectChevron}><path d="m7 10 5 5 5-5"/></svg></label>
          <span className={styles.resultCount}>{loading ? "Memuat data..." : `${rows.length} siswa`}</span>
        </div>
        {masterError && <p className={styles.masterError} role="alert">{masterError}</p>}
        <div className={styles.printTableWrapper}><div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Profil</th><th>Nama</th><th>NISN</th><th>Kelas</th><th>Jurusan</th><th>Status</th><th className={styles.actionsHeading}>Aksi</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={7} className={styles.stateCell}><span className={styles.spinner}/>Memuat daftar siswa...</td></tr> : loadError ? <tr><td colSpan={7} className={styles.stateCell}>Daftar siswa belum dapat dimuat.</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className={styles.emptyCell}><span className={styles.emptyMark}>S</span><strong>Belum ada data siswa</strong><span>Tambahkan akun siswa untuk mulai mengelola data.</span></td></tr> : rows.map((item) => <tr key={item.id}><td>{photo(item.foto_url, item.nama, 32)}</td><td><span className={styles.adminName}>{item.nama}</span></td><td>{item.nisn || "-"}</td><td>{item.nama_kelas || "-"}</td><td title={item.nama_jurusan || "-"}>{item.nama_jurusan || "-"}</td><td><span className={item.status === "nonaktif" ? styles.inactiveBadge : styles.activeBadge}>{item.status || "-"}</span></td><td><div className={styles.rowActions}><button type="button" className={styles.actionTrigger} aria-label={`Aksi ${item.nama}`} onClick={(event) => toggleMenu(item, event.currentTarget)}><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button></div></td></tr>)}
        </tbody></table></div><footer className={styles.tableFooter}>Menampilkan {loading ? "-" : rows.length} siswa</footer></div>
      </section>

      <section className={styles.printSheet} aria-hidden="true">
        <h1>Data Siswa</h1>
        <p>{activeFilters.length ? activeFilters.join(" | ") : "Filter: Semua Data"}</p>
        <p>Dicetak: {printedAt} Â· Jumlah data: {rows.length}</p>
        <table><thead><tr><th>No</th><th>Nama</th><th>NISN</th><th>Kelas</th><th>Jurusan</th><th>Jenis Kelamin</th><th>Telepon</th><th>Status</th></tr></thead><tbody>
          {rows.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.nama || "-"}</td><td>{item.nisn || "-"}</td><td>{item.nama_kelas || "-"}</td><td title={item.nama_jurusan || "-"}>{item.nama_jurusan || "-"}</td><td>{item.jenis_kelamin === "L" ? "Laki-laki" : item.jenis_kelamin === "P" ? "Perempuan" : "-"}</td><td>{item.telepon || "-"}</td><td>{item.status || "-"}</td></tr>)}
        </tbody></table>
      </section>

      {menu && createPortal(<div ref={menuRef} className={styles.actionMenu} role="menu" style={{ top: menu.top, left: menu.left }}><button type="button" role="menuitem" onClick={() => { openDetail(menu.item); setMenu(null); }}><svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>Lihat Detail</button>{canWrite && <><button type="button" role="menuitem" onClick={() => { openEdit(menu.item); setMenu(null); }}><svg viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/></svg>Edit</button><button type="button" role="menuitem" className={styles.menuDelete} onClick={() => { setDeleting(menu.item); setMenu(null); setErrors({}); }}><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg>Hapus</button></>}</div>, document.body)}

      {(formOpen && canWrite || detail) && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setFormOpen(false); setDetail(null); } }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="siswa-form-title">
        <header className={styles.dialogHeader}><div className={styles.dialogHeading}><span className={styles.headerIcon}><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg></span><div><h2 id="siswa-form-title">{detail ? "Detail Siswa" : editing ? "Edit Akun Siswa" : "Tambah Siswa Baru"}</h2><p>{detail ? "Informasi lengkap akun ini." : editing ? "Perbarui informasi akun siswa." : "Buat akun siswa baru."}</p></div></div><button className={styles.closeButton} type="button" onClick={() => { setFormOpen(false); setDetail(null); }}>Ã—</button></header>
        <form className={styles.form} noValidate onSubmit={submit}>
          <section className={styles.formSection}><h3 className={styles.sectionTitle}>Informasi Akun</h3><div className={styles.accountGrid}>
            <Field label="Nama Lengkap" required error={!detail ? errors.nama : undefined}><input value={form.nama || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, nama: event.target.value })}/></Field>
            <Field label="Username" required error={!detail ? errors.username : undefined}><input value={form.username || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, username: event.target.value })}/></Field>
            {!detail && <Field label="Password" required={!editing} error={errors.password}><span className={styles.passwordWrap}><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? "Kosongkan jika tidak diubah" : "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan/sembunyikan password">â—‰</button></span><small>{editing ? "Kosongkan jika tidak diubah." : "Minimal 8 karakter."}</small></Field>}
            {detail && <Field label="Password"><input value="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" readOnly/></Field>}
            <Field label="Status" required><Select value={detail ? detail.status || "-" : form.status} disabled={!!detail} onChange={(value) => setForm({ ...form, status: value as FormData["status"] })} options={detail && !detail.status ? [["-","-"]] : [["aktif","Aktif"],["nonaktif","Nonaktif"]]}/></Field>
          </div></section>
          <section className={styles.formSection}><h3 className={styles.sectionTitle}>Foto Profil</h3><div className={styles.photoPicker}>{photo(detail?.foto_url || preview, detail?.nama || form.nama, 66)}{!detail && <div className={styles.photoInfo}><span>Unggah foto (JPG, PNG)</span><small>Maks. 2 MB</small><label className={styles.fileLink}>Pilih File<input type="file" accept="image/jpeg,image/png" onChange={(event) => choosePhoto(event.target.files?.[0])}/></label></div>}</div>{errors.foto_url && <small className={styles.fieldError}>{errors.foto_url}</small>}</section>
          <section className={styles.formSection}><h3 className={styles.sectionTitle}>Data Pribadi</h3><div className={styles.personalGrid}>
            <Field label="NISN" full error={!detail ? errors.nisn : undefined}><input inputMode="numeric" pattern="[0-9]*" value={form.nisn || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, nisn: event.target.value.replace(/\D/g, "") })}/></Field>
            <Field label="Jenis Kelamin"><Select value={detail ? detail.jenis_kelamin || "-" : form.jenis_kelamin} disabled={!!detail} onChange={(value) => setForm({ ...form, jenis_kelamin: value as JenisKelamin | "" })} options={detail && !detail.jenis_kelamin ? [["-","-"]] : [["","Pilih..."],["L","Laki-laki"],["P","Perempuan"]]}/></Field>
            <Field label="Tempat Lahir"><input value={form.tempat_lahir || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, tempat_lahir: event.target.value })}/></Field>
            <Field label="Tanggal Lahir"><input type={detail ? "text" : "date"} value={detail ? (form.tanggal_lahir || "-") : form.tanggal_lahir} readOnly={!!detail} onChange={(event) => setForm({ ...form, tanggal_lahir: event.target.value })}/></Field>
            <Field label="Telepon"><span className={styles.phoneWrap}><span>+62</span><input value={form.telepon || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, telepon: event.target.value })}/></span></Field>
            <Field label="Nama Wali"><input value={form.nama_wali || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, nama_wali: event.target.value })}/></Field>
            <Field label="Telepon Wali"><span className={styles.phoneWrap}><span>+62</span><input value={form.telepon_wali || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, telepon_wali: event.target.value })}/></span></Field>
            <Field label="Tahun Masuk"><input type="number" value={form.tahun_masuk ?? ""} readOnly={!!detail} onChange={(event) => setForm({ ...form, tahun_masuk: event.target.value ? Number(event.target.value) : null })} placeholder={detail ? "-" : "2025"}/></Field>
            <Field label="Jurusan" required error={masterError} full><Select value={detail ? (detail.jurusan_id ? String(detail.jurusan_id) : "") : String(form.jurusan_id ?? "")} disabled={!!detail || jurusan.length === 0} onChange={changeMajor} options={detail && !detail.jurusan_id ? [["","-"]] : [["","Pilih jurusan..."],...jurusan.map((item) => [String(item.id),item.nama] as [string,string])]}/>{!detail && jurusan.length === 0 && <small className={styles.fieldError}>{masterError || "Belum ada data jurusan."}</small>}</Field>
            <Field label="Kelas" required error={masterError}><Select value={detail ? (detail.kelas_id ? String(detail.kelas_id) : "") : String(form.kelas_id ?? "")} disabled={!!detail || !form.jurusan_id || formKelas.length === 0} onChange={(value) => setForm({ ...form, kelas_id: value ? Number(value) : null })} options={detail && !detail.kelas_id ? [["","-"]] : [["","Pilih kelas..."],...formKelas.map((item) => [String(item.id),`${item.nama} (${item.tingkat})`] as [string,string])]}/>{!detail && form.jurusan_id && formKelas.length === 0 && <small className={styles.fieldError}>{masterError || "Belum ada kelas untuk jurusan ini."}</small>}</Field>
            <Field label="Alamat" full><input value={form.alamat || (detail ? "-" : "")} readOnly={!!detail} onChange={(event) => setForm({ ...form, alamat: event.target.value })}/></Field>
            {detail && <Field label="Dibuat pada" full><input value={dateLabel(detail.created_at)} readOnly/></Field>}
          </div></section>
          {!detail && errors.server && <p className={styles.formError}>{errors.server}</p>}
          <footer className={styles.dialogActions}>{detail ? <><button type="button" className={styles.cancelButton} onClick={() => setDetail(null)}>Tutup</button>{canWrite && <><button type="button" className={styles.dangerButton} onClick={() => { setDeleting(detail); setDetail(null); }}>Hapus</button><button type="button" className={styles.submitButton} onClick={() => openEdit(detail)}>Edit Pengguna</button></>}</> : <><button type="button" className={styles.cancelButton} onClick={() => setFormOpen(false)}>Batal</button><button className={styles.submitButton} disabled={saving}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Siswa"}</button></>}</footer>
        </form>
      </section></div>}
      {canWrite && deleting && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleting(null); }}><section className={`${styles.dialog} ${styles.confirmDialog}`} role="alertdialog"><div className={styles.confirmIcon}>!</div><h2>Hapus Akun?</h2><p>Akun siswa <strong>{deleting.nama}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>{errors.server && <p className={styles.formError}>{errors.server}</p>}<footer className={styles.dialogActions}><button className={styles.cancelButton} type="button" onClick={() => setDeleting(null)}>Batal</button><button className={styles.dangerButton} type="button" disabled={saving} onClick={() => void remove()}>{saving ? "Menghapus..." : "Ya, Hapus"}</button></footer></section></div>}
    </div>
  );

}

function Field({ label, required = false, error, full = false, children }: { label: string; required?: boolean; error?: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`${styles.field} ${full ? styles.fullWidth : ""}`}><span>{label}{required && <b> *</b>}</span>{children}{error && <small className={styles.fieldError}>{error}</small>}</label>;
}

function Select({ value, onChange, options, disabled = false }: { value: string; onChange: (value: string) => void; options: [string,string][]; disabled?: boolean }) {
  return <span className={styles.selectWrap}><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue,label]) => <option key={`${optionValue}-${label}`} value={optionValue}>{label}</option>)}</select><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span>;
}
