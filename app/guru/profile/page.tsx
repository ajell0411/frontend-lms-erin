"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getProfile, type ProfileRecord } from "@/lib/api";
import { listGuruKelas } from "@/lib/guru";
import styles from "../../admin/profile/page.module.css";

type Profil = ProfileRecord & {
  nip?: string | null;
  jenis_kelamin?: string | null;
  status?: string | null;
  nama_pelajaran?: string | null;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "G"
  );
}

function orDash(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function jenisKelamin(value?: string | null) {
  if (value === "L" || value === "Laki-laki") return "Laki-laki";
  if (value === "P" || value === "Perempuan") return "Perempuan";
  return orDash(value);
}

function capital(value?: string | null) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

export default function ProfilGuruPage() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [mapel, setMapel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let aktif = true;
    getProfile()
      .then((p) => {
        if (aktif) setProfil(p as Profil);
      })
      .catch((reason: unknown) => {
        if (aktif) setError(reason instanceof Error ? reason.message : "Profil gagal dimuat.");
      });
    listGuruKelas()
      .then((daftar) => {
        if (aktif) setMapel(Array.from(new Set(daftar.map((k) => k.pelajaran_nama))).join(", "));
      })
      .catch(() => undefined);
    return () => {
      aktif = false;
    };
  }, []);

  const header = (
    <header className={styles.heading}>
      <div>
        <p className={styles.eyebrow}>Akun Saya</p>
        <h1 className={styles.title}>Profil</h1>
        <p className={styles.subtitle}>Informasi akun yang sedang digunakan.</p>
      </div>
    </header>
  );

  if (error) {
    return (
      <main className={styles.page}>
        {header}
        <p className={styles.error} role="alert">{error}</p>
      </main>
    );
  }
  if (!profil) {
    return (
      <main className={styles.page}>
        {header}
        <p className={styles.subtitle}>Memuat profil...</p>
      </main>
    );
  }

  const nama = profil.nama || "Guru";

  return (
    <main className={styles.page}>
      {header}
      <section className={styles.columns} aria-label="Informasi profil">
        <article className={styles.profileCard}>
          <div className={styles.profileCover} />
          <span className={styles.avatar} aria-hidden="true">
            {profil.foto_url ? <Image src={profil.foto_url} alt="" width={92} height={92} unoptimized /> : initials(nama)}
          </span>
          <h2>{nama}</h2>
          <div className={styles.profileBadges}>
            <span className={styles.roleBadge}>Guru</span>
            <span className={styles.roleBadge}>{capital(profil.status)}</span>
          </div>
        </article>
        <div className={styles.details}>
          <article className={styles.dataCard}>
            <h2><span aria-hidden="true">{"\u25A6"}</span>Data Guru</h2>
            <div className={styles.fields}>
              <label><span>Nama Lengkap</span><input readOnly value={orDash(profil.nama)} /></label>
              <label><span>NIP</span><input readOnly value={orDash(profil.nip)} /></label>
              <label><span>Jenis Kelamin</span><input readOnly value={jenisKelamin(profil.jenis_kelamin)} /></label>
              <label><span>Status</span><input readOnly value={capital(profil.status)} /></label>
              <label className={styles.full}><span>Mata Pelajaran</span><input readOnly value={orDash(mapel || profil.nama_pelajaran)} /></label>
            </div>
          </article>
          <article className={styles.dataCard}>
            <h2><span aria-hidden="true">{"\u2709"}</span>Informasi Kontak</h2>
            <div className={styles.fields}>
              <label><span>Email</span><input readOnly value={orDash(profil.email)} /></label>
              <label><span>Nomor Telepon</span><input readOnly value={orDash(profil.telepon)} /></label>
              <label className={styles.full}><span>Alamat</span><input readOnly value={orDash(profil.alamat)} /></label>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}