"use client";

import { useCallback, useEffect, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import {
  hapusAdminJadwal,
  listAdminGuruKelas,
  listAdminJadwal,
  tambahAdminJadwal,
  ubahAdminJadwal,
  type AdminJadwal,
  type AdminJadwalInput,
  type GuruKelasAssignment,
} from "@/lib/api";
import styles from "./page.module.css";

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"] as const;
type Day = typeof DAYS[number];
type Form = Omit<AdminJadwalInput, "guru_kelas_id" | "hari"> & { guru_kelas_id: string; hari: Day };
const EMPTY: Form = { guru_kelas_id: "", hari: "senin", jam_mulai: "", jam_selesai: "", ruangan: "" };

function message(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}

function dayName(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export default function AdminJadwalPage() {
  const [schedule, setSchedule] = useState<AdminJadwal[]>([]);
  const [assignments, setAssignments] = useState<GuruKelasAssignment[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<AdminJadwal | null>(null);
  const [deleting, setDeleting] = useState<AdminJadwal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [rows, teacherAssignments] = await Promise.all([listAdminJadwal(), listAdminGuruKelas()]);
      setSchedule(rows);
      setAssignments(teacherAssignments);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  function edit(item: AdminJadwal) {
    setEditing(item);
    setForm({
      guru_kelas_id: String(item.guru_kelas_id),
      hari: item.hari as Day,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      ruangan: item.ruangan,
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.guru_kelas_id || !form.jam_mulai || !form.jam_selesai) {
      setError("Pilih penugasan guru dan lengkapi jam mulai serta jam selesai.");
      return;
    }
    if (form.jam_selesai <= form.jam_mulai) {
      setError("Jam selesai harus setelah jam mulai.");
      return;
    }
    setSaving(true);
    try {
      const input: AdminJadwalInput = { ...form, guru_kelas_id: Number(form.guru_kelas_id) };
      if (editing) {
        await ubahAdminJadwal(editing.id, input);
        setSuccess("Jadwal berhasil diperbarui.");
      } else {
        await tambahAdminJadwal(input);
        setSuccess("Jadwal berhasil ditambahkan.");
      }
      cancelEdit();
      await load();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await hapusAdminJadwal(deleting.id);
      setSuccess("Jadwal berhasil dihapus.");
      setDeleting(null);
      await load();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setSaving(false);
    }
  }

  const options = assignments.map((item) => ({
    value: String(item.id),
    label: `${item.guru_nama} - ${item.kelas_nama} - ${item.pelajaran_nama}`,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}><div><h1>Jadwal Mengajar</h1><p>Atur jadwal guru berdasarkan kelas dan mata pelajaran yang sudah ditetapkan.</p></div></header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}
      <form className={styles.form} onSubmit={submit}>
        <h2>{editing ? "Edit Jadwal" : "Tambah Jadwal"}</h2>
        <label className={styles.field}>
          <span>Guru, kelas, dan mata pelajaran</span>
          <SearchableSelect value={form.guru_kelas_id} onChange={(value) => setForm({ ...form, guru_kelas_id: value })} options={options} placeholder="Cari guru, kelas, atau pelajaran..." ariaLabel="Cari penugasan guru untuk jadwal" disabled={saving || options.length === 0} />
          {options.length === 0 && <small>Tetapkan guru di halaman detail kelas terlebih dahulu.</small>}
        </label>
        <label className={styles.field}>
          <span>Hari</span>
          <select value={form.hari} onChange={(event) => setForm({ ...form, hari: event.target.value as Day })} disabled={saving}>
            {DAYS.map((day) => <option key={day} value={day}>{dayName(day)}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Jam mulai</span>
          <input type="time" value={form.jam_mulai} onChange={(event) => setForm({ ...form, jam_mulai: event.target.value })} disabled={saving} />
        </label>
        <label className={styles.field}>
          <span>Jam selesai</span>
          <input type="time" value={form.jam_selesai} onChange={(event) => setForm({ ...form, jam_selesai: event.target.value })} disabled={saving} />
        </label>
        <label className={styles.field}>
          <span>Ruangan (opsional)</span>
          <input value={form.ruangan} onChange={(event) => setForm({ ...form, ruangan: event.target.value })} placeholder="Contoh: Lab Komputer" disabled={saving} />
        </label>
        <div className={styles.actions}>
          {editing && <button type="button" className={styles.cancel} onClick={cancelEdit} disabled={saving}>Batal</button>}
          <button type="submit" className={styles.submit} disabled={saving || loading || options.length === 0}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Jadwal"}</button>
        </div>
      </form>

      {loading ? <p className={styles.state}>Memuat jadwal...</p> : schedule.length === 0 ? <p className={styles.state}>Belum ada jadwal mengajar.</p> : <div className={styles.days}>
        {DAYS.map((day) => {
          const rows = schedule.filter((item) => item.hari === day).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
          if (!rows.length) return null;
          return <section className={styles.day} key={day}>
            <h2>{dayName(day)}</h2>
            {rows.map((item) => <article className={styles.schedule} key={item.id}>
              <div><strong>{item.jam_mulai} - {item.jam_selesai}</strong><b>{item.guru_nama}</b><span>{item.kelas_nama} - {item.pelajaran_nama}{item.ruangan ? ` | ${item.ruangan}` : ""}</span></div>
              <div className={styles.actions}><button type="button" className={styles.cancel} onClick={() => edit(item)}>Edit</button><button type="button" className={styles.delete} onClick={() => setDeleting(item)}>Hapus</button></div>
            </article>)}
          </section>;
        })}
      </div>}

      {deleting && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDeleting(null); }}>
        <section className={styles.confirm} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
          <h2 id="delete-title">Hapus jadwal?</h2>
          <p>Jadwal {deleting.kelas_nama} - {deleting.pelajaran_nama} pada {dayName(deleting.hari)} akan dihapus.</p>
          <div className={styles.actions}><button type="button" className={styles.cancel} onClick={() => setDeleting(null)} disabled={saving}>Batal</button><button type="button" className={styles.delete} onClick={() => void remove()} disabled={saving}>{saving ? "Menghapus..." : "Ya, Hapus"}</button></div>
        </section>
      </div>}
    </div>
  );
}
