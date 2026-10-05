"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getPelajaran, listGuru, listGuruPelajaran, updatePelajaran } from "@/lib/api";
import type { PelajaranGuru, PelajaranRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import styles from "./page.module.css";

const PAGE_SIZE = 5;
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }

export default function PelajaranTeachers({ pelajaranId }: { pelajaranId: number }) {
  const { canWrite } = useRole();
  const [subject, setSubject] = useState<PelajaranRecord | null>(null);
  const [teachers, setTeachers] = useState<PelajaranGuru[]>([]);
  const [allTeachers, setAllTeachers] = useState<PelajaranGuru[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const filteredTeachers = useMemo(() => teachers.filter((teacher) => teacher.nama.toLowerCase().includes(teacherSearch.trim().toLowerCase()) && (!statusFilter || teacher.status === statusFilter)), [teachers, teacherSearch, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleTeachers = filteredTeachers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = filteredTeachers.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, filteredTeachers.length);

  useEffect(() => {
    let active = true;
    Promise.all([getPelajaran(pelajaranId), listGuruPelajaran(pelajaranId), listGuru()])
      .then(([current, rows, teacherOptions]) => {
        if (!active) return;
        setSubject(current);
        setTeachers(rows);
        setAllTeachers(teacherOptions);
        setPage(1);
      })
      .catch((reason: unknown) => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pelajaranId]);

  useEffect(() => { setPage(1); }, [teacherSearch, statusFilter]);

  useEffect(() => {
    if (!assignOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setAssignOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [assignOpen, saving]);

  function profile(teacher: PelajaranGuru) {
    return <span className={styles.avatar}>{teacher.foto_url ? <Image src={teacher.foto_url} alt="" width={32} height={32} unoptimized /> : initials(teacher.nama) || "G"}</span>;
  }

  function printList() {
    const cleanup = () => document.body.classList.remove("print-teacher-list");
    document.body.classList.add("print-teacher-list");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  }

  async function saveTeachers(nextIds: number[], successMessage: string) {
    if (!canWrite || !subject) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updatePelajaran(subject.id, { guru_ids: nextIds });
      setSubject(updated);
      setTeachers(updated.guru ?? []);
      setSelectedTeacher("");
      setAssignOpen(false);
      setSuccess(successMessage);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setSaving(false);
    }
  }

  function addTeacher() {
    const id = Number(selectedTeacher);
    if (!id || teachers.some((teacher) => teacher.id === id)) return;
    void saveTeachers([...teachers.map((teacher) => teacher.id), id], "Guru pengampu berhasil ditambahkan.");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}><div><h1 className={styles.title}>{subject?.nama ?? "Pelajaran"}-Guru</h1><p className={styles.subtitle}>Guru yang mengampu mata pelajaran ini.</p></div></div>
        <div className={styles.headerActions}><button type="button" className={styles.printButton} disabled={loading || teachers.length === 0} onClick={printList}><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /><path d="M17 11h.01" /></svg>Cetak</button></div>
      </header>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {success && <p className={styles.success} role="status">{success}</p>}
      <div className={styles.assignmentTools}><label className={styles.searchField}><span className={styles.visuallyHidden}>Cari guru berdasarkan nama</span><input type="search" value={teacherSearch} onChange={(event) => setTeacherSearch(event.target.value)} placeholder="Cari nama guru..." /></label><label className={styles.statusField}><span className={styles.visuallyHidden}>Filter status guru</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Semua Status</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></label>{canWrite && <button type="button" disabled={saving} onClick={() => { setSelectedTeacher(""); setAssignOpen(true); }}>Tambah Guru</button>}</div>
      <section className={styles.panel} aria-label="Guru pengampu">
        <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Profil</th><th>NIP</th><th>Peran</th><th>Status</th><th>Pelajaran</th>{canWrite && <th>Aksi</th>}</tr></thead><tbody>
          {loading ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Memuat guru pengampu...</td></tr> : error ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Data guru belum dapat dimuat.</td></tr> : visibleTeachers.length === 0 ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Belum ada guru pengampu untuk pelajaran ini.</td></tr> : visibleTeachers.map((teacher) => <tr key={teacher.id}><td><span className={styles.profile}>{profile(teacher)}<span className={styles.person}><strong>{teacher.nama}</strong><small>{teacher.email}</small></span></span></td><td>{teacher.nip || "-"}</td><td><span className={styles.role}>Guru</span></td><td><span className={teacher.status === "nonaktif" ? styles.inactive : styles.active}><i />{teacher.status === "nonaktif" ? "Nonaktif" : "Aktif"}</span></td><td>{subject?.nama ?? "-"}</td>{canWrite && <td><button type="button" className={styles.removeTeacher} disabled={saving} onClick={() => void saveTeachers(teachers.filter((item) => item.id !== teacher.id).map((item) => item.id), "Guru pengampu berhasil dihapus.")}>Hapus</button></td>}</tr>)}
        </tbody></table></div>
        <footer className={styles.footer}><span>Menampilkan {first} sampai {last} dari {filteredTeachers.length} data</span><div className={styles.pagination}><button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === currentPage ? styles.currentPage : ""} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}<button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Berikutnya</button></div></footer>
      </section>
      <section className={styles.printSheet} aria-hidden="true"><h1>Guru Pengampu - {subject?.nama ?? "Pelajaran"}</h1><table><thead><tr><th>Nama</th><th>Email</th><th>NIP</th><th>Peran</th><th>Status</th></tr></thead><tbody>{filteredTeachers.map((teacher) => <tr key={teacher.id}><td>{teacher.nama}</td><td>{teacher.email}</td><td>{teacher.nip || "-"}</td><td>Guru</td><td>{teacher.status === "nonaktif" ? "Nonaktif" : "Aktif"}</td></tr>)}</tbody></table></section>
      {assignOpen && canWrite && <div className={styles.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setAssignOpen(false); }}><section className={styles.assignModal} role="dialog" aria-modal="true" aria-labelledby="assign-teacher-title"><header><div><h2 id="assign-teacher-title">Tambah Guru Pengampu</h2><p>Pilih guru yang akan mengampu pelajaran ini.</p></div><button type="button" aria-label="Tutup" onClick={() => setAssignOpen(false)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header><label className={styles.modalSelectLabel}>Guru<select value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)} disabled={saving}><option value="">Pilih guru</option>{allTeachers.filter((teacher) => !teachers.some((current) => current.id === teacher.id)).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.nama} ({teacher.email})</option>)}</select></label>{allTeachers.filter((teacher) => !teachers.some((current) => current.id === teacher.id)).length === 0 && <p className={styles.modalEmpty}>Semua guru sudah terdaftar sebagai pengampu.</p>}<footer><button type="button" onClick={() => setAssignOpen(false)} disabled={saving}>Batal</button><button type="button" disabled={!selectedTeacher || saving} onClick={addTeacher}>{saving ? "Menyimpan..." : "Tambah Guru"}</button></footer></section></div>}
    </div>
  );
}
