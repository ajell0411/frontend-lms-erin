"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createPelajaran, deletePelajaran, listGuru, listPelajaran, updatePelajaran } from "@/lib/api";
import type { GuruAccount, PelajaranInput, PelajaranRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

const EMPTY: PelajaranInput = { nama: "", kode: "", guru_ids: [] };
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }

export default function PelajaranPage() {
  const { canWrite } = useRole();
  const [items, setItems] = useState<PelajaranRecord[]>([]);
  const [teachers, setTeachers] = useState<GuruAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [teacherError, setTeacherError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PelajaranRecord | null>(null);
  const [deleting, setDeleting] = useState<PelajaranRecord | null>(null);
  const [form, setForm] = useState<PelajaranInput>(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    setLoadError("");
    try { setItems(await listPelajaran()); }
    catch (error) { setLoadError(message(error)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    void listPelajaran().then((rows) => {
      if (active) setItems(rows);
    }).catch((error: unknown) => {
      if (active) setLoadError(message(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    void listGuru().then((rows) => {
      if (active) setTeachers(rows);
    }).catch((error: unknown) => {
      if (active) setTeacherError(message(error));
    });
    return () => { active = false; };
  }, []);

  function openCreate() {
    if (!canWrite) return;
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(item: PelajaranRecord) {
    if (!canWrite) return;
    setEditing(item);
    setForm({ nama: item.nama, kode: item.kode, guru_ids: item.guru_ids ?? item.guru.map((teacher) => teacher.id) });
    setFormError("");
    setSuccess("");
    setModalOpen(true);
  }

  function toggleTeacher(id: number) {
    setForm((current) => ({ ...current, guru_ids: current.guru_ids.includes(id) ? current.guru_ids.filter((teacherId) => teacherId !== id) : [...current.guru_ids, id] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    if (!form.nama.trim() || !form.kode.trim()) {
      setFormError("Nama dan kode pelajaran wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { nama: form.nama.trim(), kode: form.kode.trim().toUpperCase(), guru_ids: form.guru_ids };
      if (editing) {
        await updatePelajaran(editing.id, payload);
        setSuccess("Data pelajaran berhasil diperbarui.");
      } else {
        await createPelajaran(payload);
        setSuccess("Pelajaran berhasil ditambahkan.");
      }
      setModalOpen(false);
      await reload();
    } catch (error) { setFormError(message(error)); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!canWrite || !deleting) return;
    setSaving(true);
    setFormError("");
    try {
      await deletePelajaran(deleting.id);
      setSuccess(`Pelajaran ${deleting.nama} berhasil dihapus.`);
      setDeleting(null);
      await reload();
    } catch (error) { setFormError(message(error)); }
    finally { setSaving(false); }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}><div><p className={styles.eyebrow}>Manajemen Data</p><h1 className={styles.title}>Daftar Pelajaran</h1><p className={styles.subtitle}>Kelola mata pelajaran dan guru pengampu.</p></div>{canWrite && <button type="button" className={styles.primaryButton} onClick={openCreate}><span aria-hidden="true">+</span> Tambah Pelajaran</button>}</header>
      {success && <p className={styles.success} role="status">{success}</p>}
      {loadError && <div className={styles.error} role="alert"><span>{loadError}</span><button type="button" onClick={() => void reload()}>Coba lagi</button></div>}
      {formError && !modalOpen && <p className={styles.error} role="alert">{formError}</p>}
      <div className={styles.count}>{loading ? "Memuat data..." : `Menampilkan ${items.length} pelajaran`}</div>
      {loading ? <div className={styles.state}>Memuat daftar pelajaran...</div> : loadError ? null : items.length === 0 ? (
        <div className={styles.state}><strong>Belum ada pelajaran</strong><span>Tambahkan mata pelajaran untuk mengelola guru pengampu.</span></div>
      ) : (
        <section className={styles.grid} aria-label="Daftar pelajaran">
          {items.map((item) => <article className={styles.card} key={item.id}>
            <div className={styles.cardTop}><span className={styles.code}>{item.kode}</span>{canWrite && <div className={styles.tools}>
              <button type="button" title="Edit pelajaran" aria-label={`Edit ${item.nama}`} onClick={() => openEdit(item)}><svg viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></svg></button>
              <button type="button" title="Hapus pelajaran" aria-label={`Hapus ${item.nama}`} className={styles.deleteIcon} onClick={() => { setDeleting(item); setFormError(""); }}><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></svg></button>
            </div>}</div>
            <h2 className={styles.cardTitle}>{item.nama}</h2>
            <p className={styles.teacherCount}>{item.guru?.length ?? item.guru_ids?.length ?? 0} guru pengampu</p>
            <Link href={`/admin/data/pelajaran/${item.id}`} className={styles.cardLink}>Lihat Daftar Guru <span aria-hidden="true">→</span></Link>
          </article>)}
        </section>
      )}
      {canWrite && modalOpen && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pelajaran-modal-title">
        <header className={styles.modalHeader}><div><h2 id="pelajaran-modal-title">{editing ? "Edit Pelajaran" : "Tambah Pelajaran"}</h2><p>{editing ? "Atur mata pelajaran dan guru pengampu." : "Lengkapi nama dan kode mata pelajaran."}</p></div><button type="button" className={styles.close} aria-label="Tutup" onClick={() => setModalOpen(false)}>×</button></header>
        <form onSubmit={submit}>
          <label className={styles.field}>Nama Pelajaran<input autoFocus value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} required placeholder="Matematika" /></label>
          <label className={styles.field}>Kode<input value={form.kode} onChange={(event) => setForm({ ...form, kode: event.target.value })} required maxLength={12} placeholder="MTK" /></label>
          {editing && <fieldset className={styles.teacherPicker}><legend>Guru Pengampu</legend>{teacherError ? <p className={styles.formError}>{teacherError}</p> : teachers.length === 0 ? <p className={styles.hint}>Belum ada data guru.</p> : <div className={styles.teacherOptions}>{teachers.map((teacher) => <label key={teacher.id}><input type="checkbox" checked={form.guru_ids.includes(teacher.id)} onChange={() => toggleTeacher(teacher.id)} /><span><strong>{teacher.nama}</strong><small>{teacher.email}</small></span></label>)}</div>}</fieldset>}
          {formError && <p className={styles.formError} role="alert">{formError}</p>}
          <footer className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setModalOpen(false)}>Batal</button><button className={styles.primaryButton} disabled={saving}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Pelajaran"}</button></footer>
        </form>
      </section></div>}
      {canWrite && deleting && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setDeleting(null); setFormError(""); } }}><section className={`${styles.modal} ${styles.confirmModal}`} role="alertdialog" aria-modal="true" aria-labelledby="delete-pelajaran-title"><div className={styles.confirmIcon}>!</div><h2 id="delete-pelajaran-title">Hapus Pelajaran?</h2><p>Pelajaran <strong>{deleting.nama}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>{formError && <p className={styles.formError} role="alert">{formError}</p>}<footer className={styles.actions}><button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => { setDeleting(null); setFormError(""); }}>Batal</button><button type="button" className={styles.confirmDelete} disabled={saving} onClick={() => void remove()}>{saving ? "Menghapus..." : "Ya, Hapus"}</button></footer></section></div>}
    </div>
  );
}
