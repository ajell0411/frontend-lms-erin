"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { getToken, getUser, saveSession } from "@/lib/api";
import { getProfilSiswa, perbaruiProfilSiswa, unggahFotoProfilSiswa, type ProfilSiswa } from "@/lib/siswa";
import { Badge, Card, EmptyState, ErrorState, Modal, PageHeader, Skeleton, useToast } from "../components";
import styles from "./page.module.css";

function nameOf(value: string | { nama?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.nama || "-";
}
function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || String(value).trim() === "" ? "-" : String(value);
}

export default function ProfilSiswaPage() {
  const [profile, setProfile] = useState<ProfilSiswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setProfile(await getProfilSiswa()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Profil gagal dimuat."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!photoFile) { setPreview(profile?.foto_url || ""); return; }
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile, profile?.foto_url]);

  const closeModal = useCallback(() => {
    if (saving) return;
    setOpen(false);
    setFormError("");
  }, [saving]);

  function openModal() {
    setPhone(profile?.no_hp || profile?.telepon || "");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPhotoFile(null);
    setFormError("");
    setOpen(true);
  }

  function selectPhoto(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { setFormError("Pilih foto berformat JPG atau PNG."); return; }
    if (file.size > 2 * 1024 * 1024) { setFormError("Ukuran foto maksimal 2 MB."); return; }
    setPhotoFile(file);
    setFormError("");
  }

  async function save() {
    if (saving) return;
    const changingPassword = Boolean(oldPassword || newPassword || confirmPassword);
    if (changingPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) { setFormError("Lengkapi password lama, password baru, dan konfirmasi."); return; }
      if (newPassword.length < 6) { setFormError("Password baru minimal 6 karakter."); return; }
      if (newPassword !== confirmPassword) { setFormError("Konfirmasi password baru tidak sama."); return; }
    }
    setSaving(true);
    setFormError("");
    try {
      const photoUrl = photoFile ? await unggahFotoProfilSiswa(photoFile) : undefined;
      const updated = await perbaruiProfilSiswa({
        no_hp: phone.trim(),
        ...(changingPassword ? { password_lama: oldPassword, password_baru: newPassword } : {}),
      });
      const next: ProfilSiswa = { ...profile, ...updated, ...(photoUrl ? { foto_url: photoUrl } : {}) };
      setProfile(next);
      const currentUser = getUser();
      const token = getToken();
      if (currentUser && token) {
        const remember = localStorage.getItem("user") !== null;
        saveSession(token, { ...currentUser, nama: next.nama, email: next.email || currentUser.email }, remember);
      }
      showToast("Profil berhasil diperbarui.");
      setOpen(false);
      setPhotoFile(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Profil gagal diperbarui.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className={styles.loading}><PageHeader title="Profil Saya" subtitle="Kelola informasi pribadi dan data akademik Anda."/><div className={styles.columns}><Card><Skeleton/><Skeleton/><Skeleton/></Card><Card><Skeleton/><Skeleton/><Skeleton/></Card></div></div>;
  if (error) return <><PageHeader title="Profil Saya" subtitle="Kelola informasi pribadi dan data akademik Anda."/><Card><ErrorState message={error} onRetry={() => void load()}/></Card></>;
  if (!profile) return <Card><EmptyState title="Profil tidak ditemukan"/></Card>;

  const className = nameOf(profile.kelas) !== "-" ? nameOf(profile.kelas) : valueOrDash(profile.nama_kelas);
  const photo = profile.foto_url || "";
  const initials = profile.nama.trim().split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase();
  const fields = [
    ["Nama Lengkap", profile.nama], ["NISN", profile.nisn], ["Kelas", className],
    ["Jurusan", nameOf(profile.jurusan) !== "-" ? nameOf(profile.jurusan) : profile.nama_jurusan],
  ];

  return <div className={styles.page}>
    <PageHeader title="Profil Saya" subtitle="Kelola informasi pribadi dan data akademik Anda."/>
    <div className={styles.columns}>
      <Card className={styles.profileCard}>
        <div className={styles.profileCover}/>
        <span className={styles.avatar}>{photo ? <Image src={photo} alt={"Foto " + profile.nama} width={92} height={92} unoptimized/> : initials || "S"}</span>
        <h2>{profile.nama}</h2><p className={styles.username}>@{profile.username || "-"}</p>
        <div className={styles.profileBadges}><Badge variant="info">Siswa</Badge><Badge>Kelas {className}</Badge></div>
        <button type="button" className={styles.editButton} onClick={openModal}><span aria-hidden="true">✎</span>Edit Profil</button>
      </Card>
      <div className={styles.details}>
        <Card className={styles.dataCard}><h2><span aria-hidden="true">▦</span>Data Akademik</h2><div className={styles.fields}>{fields.map(([label, value]) => <label key={label}><span>{label}</span><input readOnly value={valueOrDash(value)}/></label>)}</div></Card>
        <Card className={styles.dataCard}><h2><span aria-hidden="true">✉</span>Informasi Kontak</h2><div className={styles.fields}><label><span>Email Institusi</span><input readOnly value={valueOrDash(profile.email)}/></label><label><span>Nomor HP</span><input readOnly value={valueOrDash(profile.no_hp || profile.telepon)}/></label></div></Card>
      </div>
    </div>
    <Modal open={open} onClose={closeModal} title="Edit Profil" footer={<><button type="button" className={styles.cancel} disabled={saving} onClick={closeModal}>Batal</button><button type="button" className={styles.save} disabled={saving} onClick={() => void save()}>{saving ? "Menyimpan…" : "Simpan Perubahan"}</button></>}>
      <div className={styles.form}>
        <div className={styles.photoEdit}><span className={styles.preview}>{preview ? <Image src={preview} alt="Pratinjau foto profil" width={68} height={68} unoptimized/> : initials || "S"}</span><label className={styles.choosePhoto}>Ganti Foto<input type="file" accept="image/jpeg,image/png" onChange={(event) => selectPhoto(event.target.files?.[0])}/></label><small>JPG atau PNG, maksimal 2 MB</small></div>
        <label className={styles.formField}>Nomor HP<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="Masukkan nomor HP"/></label>
        <div className={styles.passwordTitle}>Ubah Password <small>(opsional)</small></div>
        <label className={styles.formField}>Password Lama<input type="password" autoComplete="current-password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)}/></label>
        <label className={styles.formField}>Password Baru<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6}/></label>
        <label className={styles.formField}>Konfirmasi Password Baru<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label>
        {formError && <p className={styles.formError} role="alert">{formError}</p>}
      </div>
    </Modal>
  </div>;
}
