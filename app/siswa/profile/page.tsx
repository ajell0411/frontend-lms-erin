"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { getProfilSiswa, type ProfilSiswa } from "@/lib/siswa";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components";
import styles from "./page.module.css";

type Row = { label: string; value: string; full?: boolean };

function nameOf(value: string | { nama?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.nama || "-";
}
function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || String(value).trim() === "" ? "-" : String(value);
}
function tanggal(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function gender(value?: string) {
  return value === "L" ? "Laki-laki" : value === "P" ? "Perempuan" : valueOrDash(value);
}
function capital(value?: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

export default function ProfilSiswaPage() {
  const [profile, setProfile] = useState<ProfilSiswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setProfile(await getProfilSiswa()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Profil gagal dimuat."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className={styles.loading}><PageHeader title="Profil Saya" subtitle="Informasi pribadi dan data akademik Anda."/><div className={styles.columns}><Card><Skeleton/><Skeleton/><Skeleton/></Card><Card><Skeleton/><Skeleton/><Skeleton/></Card></div></div>;
  if (error) return <><PageHeader title="Profil Saya" subtitle="Informasi pribadi dan data akademik Anda."/><Card><ErrorState message={error} onRetry={() => void load()}/></Card></>;
  if (!profile) return <Card><EmptyState title="Profil tidak ditemukan"/></Card>;

  const className = nameOf(profile.kelas) !== "-" ? nameOf(profile.kelas) : valueOrDash(profile.nama_kelas);
  const jurusan = nameOf(profile.jurusan) !== "-" ? nameOf(profile.jurusan) : valueOrDash(profile.nama_jurusan);
  const photo = profile.foto_url || "";
  const initials = profile.nama.trim().split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase();
  const sections: { title: string; icon: string; rows: Row[] }[] = [
    { title: "Data Akademik", icon: "\u25A6", rows: [
      { label: "Nama Lengkap", value: valueOrDash(profile.nama) },
      { label: "NISN", value: valueOrDash(profile.nisn) },
      { label: "Kelas", value: className },
      { label: "Jurusan", value: jurusan },
      { label: "Tahun Masuk", value: valueOrDash(profile.tahun_masuk) },
      { label: "Status", value: capital(profile.status) },
    ] },
    { title: "Data Pribadi", icon: "\u263A", rows: [
      { label: "Jenis Kelamin", value: gender(profile.jenis_kelamin) },
      { label: "Tempat Lahir", value: valueOrDash(profile.tempat_lahir) },
      { label: "Tanggal Lahir", value: tanggal(profile.tanggal_lahir) },
      { label: "Alamat", value: valueOrDash(profile.alamat), full: true },
    ] },
    { title: "Informasi Kontak", icon: "\u2709", rows: [
      { label: "Email Institusi", value: valueOrDash(profile.email) },
      { label: "Nomor HP", value: valueOrDash(profile.no_hp || profile.telepon) },
    ] },
    { title: "Data Wali", icon: "\u2661", rows: [
      { label: "Nama Wali", value: valueOrDash(profile.nama_wali) },
      { label: "Telepon Wali", value: valueOrDash(profile.telepon_wali) },
    ] },
  ];

  return <div className={styles.page}>
    <PageHeader title="Profil Saya" subtitle="Informasi pribadi dan data akademik Anda."/>
    <div className={styles.columns}>
      <Card className={styles.profileCard}>
        <div className={styles.profileCover}/>
        <span className={styles.avatar}>{photo ? <Image src={photo} alt={"Foto " + profile.nama} width={92} height={92} unoptimized/> : initials || "S"}</span>
        <h2>{profile.nama}</h2>
        <div className={styles.profileBadges}><Badge variant="info">Siswa</Badge><Badge>Kelas {className}</Badge></div>
      </Card>
      <div className={styles.details}>
        {sections.map((section) => <Card key={section.title} className={styles.dataCard}>
          <h2><span aria-hidden="true">{section.icon}</span>{section.title}</h2>
          <div className={styles.fields}>
            {section.rows.map((row) => <label key={row.label} style={row.full ? { gridColumn: "1 / -1" } : undefined}><span>{row.label}</span><input readOnly value={row.value}/></label>)}
          </div>
        </Card>)}
      </div>
    </div>
  </div>;
}