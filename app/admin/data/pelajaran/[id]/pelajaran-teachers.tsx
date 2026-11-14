"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getPelajaran, listGuruPelajaran, updatePelajaran } from "@/lib/api";
import type { PelajaranGuru, PelajaranRecord } from "@/lib/api";
import { useRole } from "@/lib/role";
import { printDataList } from "@/lib/print";
import styles from "./page.module.css";

const PAGE_SIZE = 5;
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }

export default function PelajaranTeachers({ pelajaranId }: { pelajaranId: number }) {
  const { canWrite } = useRole();
  const [subject, setSubject] = useState<PelajaranRecord | null>(null);
  const [teachers, setTeachers] = useState<PelajaranGuru[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
    Promise.all([getPelajaran(pelajaranId), listGuruPelajaran(pelajaranId)])
      .then(([current, rows]) => {
        if (!active) return;
        setSubject(current);
        setTeachers(rows);
        setPage(1);
      })
      .catch((reason: unknown) => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pelajaranId]);

  function profile(teacher: PelajaranGuru) {
    return <span className={styles.avatar}>{teacher.foto_url ? <Image src={teacher.foto_url} alt="" width={32} height={32} unoptimized /> : initials(teacher.nama) || "G"}</span>;
  }

  function printList() { printDataList(); }

  async function saveTeachers(nextIds: number[], successMessage: string) {
    if (!canWrite || !subject) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updatePelajaran(subject.id, { guru_ids: nextIds });
      setSubject(updated);
      setTeachers(updated.guru ?? []);
      setSuccess(successMessage);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}><div><h1 className={styles.title}>{subject?.nama ?? "Pelajaran"}-Guru</h1><p className={styles.subtitle}>Guru yang mengampu mata pelajaran ini.</p></div></div>
        <div className={styles.headerActions}><button type="button" className={`print-action-button ${styles.printButton}`} disabled={loading || teachers.length === 0} onClick={printList}><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /><path d="M17 11h.01" /></svg>Cetak</button></div>
      </header>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {success && <p className={styles.success} role="status">{success}</p>}
      <div className={styles.assignmentTools}><label className={styles.searchField}><span className={styles.visuallyHidden}>Cari guru berdasarkan nama</span><input type="search" value={teacherSearch} onChange={(event) => { setTeacherSearch(event.target.value); setPage(1); }} placeholder="Cari nama guru..." /></label><label className={styles.statusField}><span className={styles.visuallyHidden}>Filter status guru</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">Semua Status</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></label></div>
      <section className={styles.panel} aria-label="Guru pengampu">
        <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Profil</th><th>NIP</th><th>Peran</th><th>Status</th><th>Pelajaran</th>{canWrite && <th>Aksi</th>}</tr></thead><tbody>
          {loading ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Memuat guru pengampu...</td></tr> : error ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Data guru belum dapat dimuat.</td></tr> : visibleTeachers.length === 0 ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Belum ada guru pengampu untuk pelajaran ini.</td></tr> : visibleTeachers.map((teacher) => <tr key={teacher.id}><td><span className={styles.profile}>{profile(teacher)}<span className={styles.person}><strong>{teacher.nama}</strong><small>{teacher.email}</small></span></span></td><td>{teacher.nip || "-"}</td><td><span className={styles.role}>Guru</span></td><td><span className={teacher.status === "nonaktif" ? styles.inactive : styles.active}><i />{teacher.status === "nonaktif" ? "Nonaktif" : "Aktif"}</span></td><td>{subject?.nama ?? "-"}</td>{canWrite && <td><button type="button" className={styles.removeTeacher} disabled={saving} onClick={() => void saveTeachers(teachers.filter((item) => item.id !== teacher.id).map((item) => item.id), "Guru pengampu berhasil dihapus.")}>Hapus</button></td>}</tr>)}
        </tbody></table></div>
        <footer className={styles.footer}><span>Menampilkan {first} sampai {last} dari {filteredTeachers.length} data</span><div className={styles.pagination}><button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === currentPage ? styles.currentPage : ""} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}<button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Berikutnya</button></div></footer>
      </section>
      <section className={`${styles.printSheet} print-sheet`} aria-hidden="true"><h1>Guru Pengampu - {subject?.nama ?? "Pelajaran"}</h1><table><thead><tr><th>Nama</th><th>Email</th><th>NIP</th><th>Peran</th><th>Status</th></tr></thead><tbody>{filteredTeachers.map((teacher) => <tr key={teacher.id}><td>{teacher.nama}</td><td>{teacher.email}</td><td>{teacher.nip || "-"}</td><td>Guru</td><td>{teacher.status === "nonaktif" ? "Nonaktif" : "Aktif"}</td></tr>)}</tbody></table></section>
    </div>
  );
}
