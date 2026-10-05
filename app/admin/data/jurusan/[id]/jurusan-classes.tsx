"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createKelas, deleteKelas, getJurusan, listGuru, listKelas, updateKelas } from "@/lib/api";
import type { GuruAccount, JurusanRecord, KelasInput, KelasRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

type KelasForm = Omit<KelasInput, "wali_kelas_id"> & { wali_kelas_id: string };
const EMPTY: KelasForm = { nama: "", tingkat: "X", jurusan_id: 0, wali_kelas_id: "" };
const LEVELS = ["X", "XI", "XII"] as const;

function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }

export default function JurusanClasses({ jurusanId }: { jurusanId: number }) {
  const { canWrite } = useRole();
  const [major, setMajor] = useState<JurusanRecord | null>(null);
  const [items, setItems] = useState<KelasRecord[]>([]);
  const [teachers, setTeachers] = useState<GuruAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KelasRecord | null>(null);
  const [deleting, setDeleting] = useState<KelasRecord | null>(null);
  const [form, setForm] = useState<KelasForm>({ ...EMPTY, jurusan_id: jurusanId });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    setLoadError("");
    try {
      const [majorData, classData] = await Promise.all([getJurusan(jurusanId), listKelas(jurusanId)]);
      setMajor(majorData);
      setItems(classData);
    } catch (error) {
      setLoadError(message(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void Promise.all([getJurusan(jurusanId), listKelas(jurusanId)]).then(([majorData, classData]) => {
      if (!active) return;
      setMajor(majorData);
      setItems(classData);
    }).catch((error: unknown) => {
      if (active) setLoadError(message(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    void listGuru().then((rows) => {
      if (active) setTeachers(rows);
    }).catch((error: unknown) => {
      if (active) setFormError(`Data guru gagal dimuat: ${message(error)}`);
    });
    return () => { active = false; };
  }, [jurusanId]);

  function openCreate() {
    if (!canWrite) return;
    setEditing(null);
    setForm({ ...EMPTY, jurusan_id: jurusanId });
    setFormError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(item: KelasRecord) {
    if (!canWrite) return;
    setEditing(item);
    setForm({ nama: item.nama, tingkat: item.tingkat, jurusan_id: jurusanId, wali_kelas_id: item.wali_kelas_id ? String(item.wali_kelas_id) : "" });
    setFormError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    if (!form.nama.trim()) {
      setFormError("Nama kelas wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload: KelasInput = {
      nama: form.nama.trim(),
      tingkat: form.tingkat,
      jurusan_id: jurusanId,
      wali_kelas_id: form.wali_kelas_id ? Number(form.wali_kelas_id) : null,
    };
    try {
      if (editing) {
        await updateKelas(editing.id, payload);
        setSuccess("Data kelas berhasil diperbarui.");
      } else {
        await createKelas(payload);
        setSuccess("Kelas berhasil ditambahkan.");
      }
      setModalOpen(false);
      await reload();
    } catch (error) {
      setFormError(message(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!canWrite || !deleting) return;
    setSaving(true);
    setFormError("");
    try {
      await deleteKelas(deleting.id);
      setSuccess(`Kelas ${deleting.nama} berhasil dihapus.`);
      setDeleting(null);
      await reload();
    } catch (error) {
      setFormError(message(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1 className={styles.title}>{"Daftar Kelas \u2013 "}{major?.kode ?? "..."}</h1><p className={styles.subtitle}>{major?.nama ?? "Kelola kelas pada jurusan ini."}</p></div>
        {canWrite && <button type="button" className={styles.primaryButton} onClick={openCreate}><span aria-hidden="true">+</span> Tambah Kelas</button>}
      </header>
      {success && <p className={styles.success} role="status">{success}</p>}
      {loadError && <div className={styles.error} role="alert"><span>{loadError}</span><button type="button" onClick={() => void reload()}>Coba lagi</button></div>}
      {formError && !modalOpen && <p className={styles.error} role="alert">{formError}</p>}
      <div className={styles.count}>{loading ? "Memuat data..." : `Menampilkan ${items.length} kelas`}</div>
      {loading ? <div className={styles.state}>Memuat daftar kelas...</div> : loadError ? null : items.length === 0 ? (
        <div className={styles.state}><strong>Belum ada kelas</strong><span>Tambahkan kelas untuk jurusan {major?.kode ?? "ini"}.</span></div>
      ) : (
        <section className={styles.grid} aria-label="Daftar kelas">
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardTop}>{canWrite && <div className={styles.cardTools}>
                <button type="button" aria-label={`Edit ${item.nama}`} title="Edit kelas" onClick={() => openEdit(item)}><svg viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></svg></button>
                <button type="button" aria-label={`Hapus ${item.nama}`} title="Hapus kelas" className={styles.deleteIcon} onClick={() => { setDeleting(item); setFormError(""); }}><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></svg></button>
              </div>}<span className={styles.level}>Tingkat {item.tingkat}</span></div>
              <h2 className={styles.cardTitle}>{item.nama}</h2>
              <div className={styles.info}><span>Wali Kelas</span><strong>{item.wali_kelas_nama || "Belum ditentukan"}</strong></div>
              <div className={styles.info}><span>Jumlah Siswa</span><strong>{item.jumlah_siswa} Siswa</strong></div>
              <Link href={`/admin/data/kelas/${item.id}`} className={styles.manageLink}>Kelola Kelas</Link>
            </article>
          ))}
        </section>
      )}
      {canWrite && deleting && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setDeleting(null); setFormError(""); } }}><section className={`${styles.modal} ${styles.confirmModal}`} role="alertdialog" aria-modal="true" aria-labelledby="delete-kelas-title"><div className={styles.confirmIcon}>!</div><h2 id="delete-kelas-title">Hapus Kelas?</h2><p>Kelas <strong>{deleting.nama}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>{formError && <p className={styles.formError} role="alert">{formError}</p>}<footer className={styles.actions}><button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => { setDeleting(null); setFormError(""); }}>Batal</button><button type="button" className={styles.confirmDelete} disabled={saving} onClick={() => void remove()}>{saving ? "Menghapus..." : "Ya, Hapus"}</button></footer></section></div>}
      {canWrite && modalOpen && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="kelas-modal-title">
        <header className={styles.modalHeader}><div><h2 id="kelas-modal-title">{editing ? "Edit Kelas" : "Tambah Kelas"}</h2><p>Atur informasi kelas dan wali kelas.</p></div><button type="button" className={styles.close} aria-label="Tutup" onClick={() => setModalOpen(false)}>Ã—</button></header>
        <form onSubmit={submit}>
          <label className={styles.field}>Nama Kelas<input autoFocus value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} required placeholder="XI PPLG 1" /></label>
          <label className={styles.field}>Tingkat<select value={form.tingkat} onChange={(event) => setForm({ ...form, tingkat: event.target.value as KelasForm["tingkat"] })}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label>
          <label className={styles.field}>Wali Kelas <span>(opsional)</span><select value={form.wali_kelas_id} onChange={(event) => setForm({ ...form, wali_kelas_id: event.target.value })}><option value="">Belum ditentukan</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.nama}</option>)}</select></label>
          {formError && <p className={styles.formError} role="alert">{formError}</p>}
          <footer className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setModalOpen(false)}>Batal</button><button className={styles.primaryButton} disabled={saving}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Kelas"}</button></footer>
        </form>
      </section></div>}
    </div>
  );
}
