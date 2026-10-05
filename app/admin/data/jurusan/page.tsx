"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createJurusan, deleteJurusan, listJurusan, updateJurusan } from "@/lib/api";
import type { JurusanInput, JurusanRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

const FORM_EMPTY: JurusanInput = { nama: "", kode: "", kepala_jurusan: "" };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}

export default function JurusanPage() {
  const { canWrite } = useRole();
  const [items, setItems] = useState<JurusanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JurusanRecord | null>(null);
  const [deleting, setDeleting] = useState<JurusanRecord | null>(null);
  const [form, setForm] = useState<JurusanInput>(FORM_EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await listJurusan());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void listJurusan().then((rows) => {
      if (active) setItems(rows);
    }).catch((error: unknown) => {
      if (active) setLoadError(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function openCreate() {
    if (!canWrite) return;
    setEditing(null);
    setForm(FORM_EMPTY);
    setFormError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(item: JurusanRecord) {
    if (!canWrite) return;
    setEditing(item);
    setForm({ nama: item.nama, kode: item.kode, kepala_jurusan: item.kepala_jurusan ?? "" });
    setFormError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    const nama = form.nama.trim();
    const kode = form.kode.trim().toUpperCase();
    if (!nama || !kode) {
      setFormError("Nama dan kode jurusan wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { nama, kode, kepala_jurusan: form.kepala_jurusan.trim() };
      if (editing) {
        await updateJurusan(editing.id, payload);
        setSuccess("Data jurusan berhasil diperbarui.");
      } else {
        await createJurusan(payload);
        setSuccess("Jurusan berhasil ditambahkan.");
      }
      setModalOpen(false);
      await reload();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!canWrite || !deleting) return;
    setSaving(true);
    setFormError("");
    try {
      await deleteJurusan(deleting.id);
      setSuccess(`Jurusan ${deleting.nama} berhasil dihapus.`);
      setDeleting(null);
      await reload();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Manajemen Data</p>
          <h1 className={styles.title}>Daftar Jurusan</h1>
          <p className={styles.subtitle}>Kelola program keahlian dan kelas di sekolah.</p>
        </div>
        {canWrite && <button type="button" className={styles.primaryButton} onClick={openCreate}>
          <span aria-hidden="true">+</span> Tambah Jurusan
        </button>}
      </header>

      {success && <p className={styles.success} role="status">{success}</p>}
      {loadError && <div className={styles.error} role="alert"><span>{loadError}</span><button type="button" onClick={() => void reload()}>Coba lagi</button></div>}
      {formError && !modalOpen && <p className={styles.error} role="alert">{formError}</p>}

      <div className={styles.count}>{loading ? "Memuat data..." : `Menampilkan ${items.length} jurusan`}</div>
      {loading ? (
        <div className={styles.state}>Memuat daftar jurusan...</div>
      ) : loadError ? null : items.length === 0 ? (
        <div className={styles.state}><strong>Belum ada jurusan</strong><span>Tambahkan jurusan untuk mulai mengelola kelas.</span></div>
      ) : (
        <section className={styles.grid} aria-label="Daftar jurusan">
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.code}>{item.kode}</span>
                {canWrite && <div className={styles.cardTools}>
                  <button type="button" aria-label={`Edit ${item.nama}`} title="Edit jurusan" onClick={() => openEdit(item)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></svg>
                  </button>
                  <button type="button" aria-label={`Hapus ${item.nama}`} title="Hapus jurusan" className={styles.deleteIcon} onClick={() => { setDeleting(item); setFormError(""); }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></svg>
                  </button>
                </div>}
              </div>
              <h2 className={styles.cardTitle}>{item.nama}</h2>
              <div className={styles.metaRow}><span>Kepala Jurusan</span><strong>{item.kepala_jurusan || "Belum ditentukan"}</strong></div>
              <div className={styles.stats}>
                <span><strong>{item.jumlah_kelas}</strong> kelas</span>
                <span><strong>{item.jumlah_siswa}</strong> siswa</span>
              </div>
              <Link href={`/admin/data/jurusan/${item.id}`} className={styles.cardLink}>Lihat Daftar Kelas <span aria-hidden="true">→</span></Link>
              {canWrite && deleting?.id === item.id && (
                <div className={styles.popover} role="alertdialog" aria-label={`Konfirmasi hapus jurusan ${item.nama}`}>
                  <strong>Hapus Jurusan</strong>
                  {formError && <span className={styles.popoverError}>{formError}</span>}
                  <div><button type="button" onClick={() => { setDeleting(null); setFormError(""); }}>Batal</button><button type="button" className={styles.popoverDanger} disabled={saving} onClick={() => void remove()}>{saving ? "Menghapus..." : "Hapus"}</button></div>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {canWrite && modalOpen && (
        <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="jurusan-modal-title">
            <header className={styles.modalHeader}><div><h2 id="jurusan-modal-title">{editing ? "Edit Jurusan" : "Tambah Jurusan"}</h2><p>Lengkapi informasi program keahlian.</p></div><button type="button" className={styles.close} aria-label="Tutup" onClick={() => setModalOpen(false)}>×</button></header>
            <form onSubmit={submit}>
              <label className={styles.field}>Nama Jurusan<input autoFocus value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} required placeholder="Pengembangan Perangkat Lunak dan Gim" /></label>
              <label className={styles.field}>Kode<input value={form.kode} onChange={(event) => setForm({ ...form, kode: event.target.value })} required maxLength={12} placeholder="PPLG" /></label>
              <label className={styles.field}>Kepala Jurusan <span>(opsional)</span><input value={form.kepala_jurusan} onChange={(event) => setForm({ ...form, kepala_jurusan: event.target.value })} placeholder="Nama kepala jurusan" /></label>
              {formError && <p className={styles.formError} role="alert">{formError}</p>}
              <footer className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setModalOpen(false)}>Batal</button><button className={styles.primaryButton} disabled={saving}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Jurusan"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}