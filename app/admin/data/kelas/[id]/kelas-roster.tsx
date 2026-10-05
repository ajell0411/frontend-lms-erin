"use client";

import { useEffect, useState } from "react";
import type { SiswaAccount, KelasRecord } from "@/lib/api";
import { getKelas, listSiswa } from "@/lib/api";
import { useRole } from "@/lib/role";
import Image from "next/image";
import styles from "./page.module.css";

const PAGE_SIZE = 5;
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }

export default function KelasRoster({ kelasId }: { kelasId: number }) {
  useRole();
  const [kelas, setKelas] = useState<KelasRecord | null>(null);
  const [students, setStudents] = useState<SiswaAccount[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageCount = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleStudents = students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = students.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, students.length);

  useEffect(() => {
    let active = true;
    Promise.all([getKelas(kelasId), listSiswa({ kelas_id: kelasId })])
      .then(([classData, rows]) => {
        if (!active) return;
        setKelas(classData);
        setStudents(rows);
      })
      .catch((reason: unknown) => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kelasId]);

  function printList() { window.print(); }

  function profile(student: SiswaAccount) {
    return <span className={styles.avatar}>{student.foto_url ? <Image src={student.foto_url} alt="" width={32} height={32} unoptimized /> : initials(student.nama) || "S"}</span>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}><div><h1 className={styles.title}>Kelas - {kelas?.nama ?? "..."}</h1><p className={styles.subtitle}>Daftar siswa yang terdaftar di kelas ini.</p></div><button type="button" className={styles.printButton} disabled={loading || students.length === 0} onClick={printList}><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /><path d="M17 11h.01" /></svg>Cetak</button></header>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <section className={styles.panel} aria-label="Daftar siswa di kelas">
        <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Profil</th><th>NISN</th><th>Role</th><th>Status</th><th>Kelas</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={5} className={styles.stateCell}>Memuat siswa...</td></tr> : error ? <tr><td colSpan={5} className={styles.stateCell}>Data siswa belum dapat dimuat.</td></tr> : visibleStudents.length === 0 ? <tr><td colSpan={5} className={styles.stateCell}>Belum ada siswa di kelas ini.</td></tr> : visibleStudents.map((student) => <tr key={student.id}><td><span className={styles.profile}>{profile(student)}<strong>{student.nama}</strong></span></td><td>{student.nisn || "-"}</td><td><span className={styles.role}>Siswa</span></td><td><span className={student.status === "nonaktif" ? styles.inactive : styles.active}><i />{student.status === "nonaktif" ? "Inactive" : "Active"}</span></td><td>{student.nama_kelas || kelas?.nama || "-"}</td></tr>)}
        </tbody></table></div>
        <footer className={styles.footer}><span>Menampilkan {first} sampai {last} dari {students.length} data</span><div className={styles.pagination}><button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button><span>{currentPage}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></footer>
      </section>
      <section className={styles.printSheet} aria-hidden="true"><table><thead><tr><th>Profil</th><th>NISN</th><th>Role</th><th>Status</th><th>Kelas</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.nama}</td><td>{student.nisn || "-"}</td><td>Siswa</td><td>{student.status === "nonaktif" ? "Inactive" : "Active"}</td><td>{kelas?.nama ?? student.nama_kelas ?? "-"}</td></tr>)}</tbody></table></section>
    </div>
  );
}