"use client";

import { useEffect, useState } from "react";
import type { SiswaAccount, KelasRecord, GuruAccount, PelajaranRecord, GuruKelasAssignment } from "@/lib/api";
import { getKelas, hapusAdminGuruKelas, listAdminGuruKelas, listGuru, listPelajaran, listSiswa, tambahAdminGuruKelas, updateSiswa } from "@/lib/api";
import { useRole } from "@/lib/role";
import { printDataList } from "@/lib/print";
import SearchableSelect from "@/components/SearchableSelect";
import Image from "next/image";
import styles from "./page.module.css";

const PAGE_SIZE = 5;
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase(); }

export default function KelasRoster({ kelasId }: { kelasId: number }) {
  const { canWrite } = useRole();
  const [kelas, setKelas] = useState<KelasRecord | null>(null);
  const [students, setStudents] = useState<SiswaAccount[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allStudents, setAllStudents] = useState<SiswaAccount[]>([]);
  const [teachers, setTeachers] = useState<GuruAccount[]>([]);
  const [subjects, setSubjects] = useState<PelajaranRecord[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<GuruKelasAssignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const pageCount = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleStudents = students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = students.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, students.length);

  useEffect(() => {
    let active = true;
    Promise.all([getKelas(kelasId), listSiswa({ kelas_id: kelasId }), listSiswa(), listGuru(), listPelajaran(), listAdminGuruKelas(kelasId)])
      .then(([classData, rows, allRows, teacherRows, subjectRows, assignments]) => {
        if (!active) return;
        setKelas(classData);
        setStudents(rows);
        setAllStudents(allRows);
        setTeachers(teacherRows);
        setSubjects(subjectRows);
        setTeacherAssignments(assignments);
      })
      .catch((reason: unknown) => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kelasId]);

  function printList() { printDataList(); }

  async function assignStudent(studentId: number, targetClass: number | null) {
    setSaving(true); setError("");
    try {
      await updateSiswa(studentId, { kelas_id: targetClass });
      const [rows, allRows] = await Promise.all([listSiswa({ kelas_id: kelasId }), listSiswa()]);
      setStudents(rows); setAllStudents(allRows); setSelectedStudent("");
    } catch (reason) { setError(message(reason)); }
    finally { setSaving(false); }
  }

  async function assignTeacher() {
    if (!selectedTeacher || !selectedSubject) {
      setError("Pilih guru dan mata pelajaran.");
      return;
    }
    setSaving(true); setError("");
    try {
      await tambahAdminGuruKelas({ guru_id: Number(selectedTeacher), kelas_id: kelasId, pelajaran_id: Number(selectedSubject) });
      setTeacherAssignments(await listAdminGuruKelas(kelasId));
      setSelectedTeacher(""); setSelectedSubject("");
    } catch (reason) { setError(message(reason)); }
    finally { setSaving(false); }
  }

  async function removeTeacherAssignment(assignment: GuruKelasAssignment) {
    setSaving(true); setError("");
    try {
      await hapusAdminGuruKelas(assignment.id);
      setTeacherAssignments((current) => current.filter((item) => item.id !== assignment.id));
    } catch (reason) { setError(message(reason)); }
    finally { setSaving(false); }
  }

  function profile(student: SiswaAccount) {
    return <span className={styles.avatar}>{student.foto_url ? <Image src={student.foto_url} alt="" width={32} height={32} unoptimized /> : initials(student.nama) || "S"}</span>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}><div><h1 className={styles.title}>Kelas - {kelas?.nama ?? "..."}</h1><p className={styles.subtitle}>Kelola siswa dan guru yang ditugaskan ke kelas ini.</p></div><div className={styles.headerActions}><button type="button" className={`print-action-button ${styles.printButton}`} disabled={loading || students.length === 0} onClick={printList}><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /><path d="M17 11h.01" /></svg>Cetak</button>{canWrite && <button type="button" className={styles.addStudentButton} disabled={saving || loading} onClick={() => selectedStudent ? void assignStudent(Number(selectedStudent), kelasId) : document.getElementById("add-student-search")?.focus()}><span aria-hidden="true">+</span>{saving ? "Menyimpan..." : "Tambah Siswa"}</button>}</div></header>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {canWrite && <div className={styles.assignmentTools}>
        <label><span className={styles.visuallyHidden}>Pilih siswa untuk ditambahkan</span><SearchableSelect id="add-student-search" value={selectedStudent} onChange={setSelectedStudent} disabled={saving || loading} ariaLabel="Cari siswa untuk ditambahkan" placeholder="Cari nama siswa..." options={allStudents.filter((student) => student.kelas_id !== kelasId).map((student) => ({ value: String(student.id), label: `${student.nama} (${student.nisn || student.email})` }))} /></label>
      </div>}
      {canWrite && <section className={styles.teacherPanel} aria-label="Guru pengajar">
        <div className={styles.teacherHeading}><div><h2>Guru Pengajar</h2><p>Guru dapat ditugaskan ke beberapa kelas dan maksimal dua mata pelajaran.</p></div></div>
        <div className={styles.teacherForm}>
          <label><span className={styles.visuallyHidden}>Pilih guru</span><SearchableSelect value={selectedTeacher} onChange={setSelectedTeacher} disabled={saving || loading} ariaLabel="Cari guru" placeholder="Cari nama guru..." options={teachers.map((teacher) => ({ value: String(teacher.id), label: `${teacher.nama} (${teacher.email})` }))} /></label>
          <label><span className={styles.visuallyHidden}>Pilih mata pelajaran</span><SearchableSelect value={selectedSubject} onChange={setSelectedSubject} disabled={saving || loading} ariaLabel="Cari mata pelajaran" placeholder="Cari mata pelajaran..." options={subjects.map((subject) => ({ value: String(subject.id), label: subject.nama }))} /></label>
          <button type="button" disabled={saving || loading || !selectedTeacher || !selectedSubject} onClick={() => void assignTeacher()}>{saving ? "Menyimpan..." : "Tetapkan Guru"}</button>
        </div>
        {teacherAssignments.length === 0 ? <p className={styles.noTeachers}>Belum ada guru yang ditetapkan.</p> : <div className={styles.teacherList}>{teacherAssignments.map((assignment) => <div key={assignment.id} className={styles.teacherRow}><span><strong>{assignment.guru_nama}</strong><small>{assignment.pelajaran_nama}</small></span><button type="button" disabled={saving} onClick={() => void removeTeacherAssignment(assignment)}>Lepas</button></div>)}</div>}
      </section>}
      <section className={styles.panel} aria-label="Daftar siswa di kelas">
        <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Profil</th><th>NISN</th><th>Role</th><th>Status</th><th>Kelas</th>{canWrite && <th>Aksi</th>}</tr></thead><tbody>
          {loading ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Memuat siswa...</td></tr> : error ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Data siswa belum dapat dimuat.</td></tr> : visibleStudents.length === 0 ? <tr><td colSpan={canWrite ? 6 : 5} className={styles.stateCell}>Belum ada siswa di kelas ini.</td></tr> : visibleStudents.map((student) => <tr key={student.id}><td><span className={styles.profile}>{profile(student)}<strong>{student.nama}</strong></span></td><td>{student.nisn || "-"}</td><td><span className={styles.role}>Siswa</span></td><td><span className={student.status === "nonaktif" ? styles.inactive : styles.active}><i />{student.status === "nonaktif" ? "Nonaktif" : "Aktif"}</span></td><td>{student.nama_kelas || kelas?.nama || "-"}</td>{canWrite && <td><button type="button" disabled={saving} onClick={() => void assignStudent(student.id, null)}>Keluarkan</button></td>}</tr>)}
        </tbody></table></div>
        <footer className={styles.footer}><span>Menampilkan {first} sampai {last} dari {students.length} data</span><div className={styles.pagination}><button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button><span>{currentPage}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></footer>
      </section>
      <section className={`${styles.printSheet} print-sheet`} aria-hidden="true"><h1>Daftar Siswa - {kelas?.nama ?? "Kelas"}</h1><table><thead><tr><th>Profil</th><th>NISN</th><th>Role</th><th>Status</th><th>Kelas</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.nama}</td><td>{student.nisn || "-"}</td><td>Siswa</td><td>{student.status === "nonaktif" ? "Nonaktif" : "Aktif"}</td><td>{kelas?.nama ?? student.nama_kelas ?? "-"}</td></tr>)}</tbody></table></section>
    </div>
  );
}
