"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./components/Reveal";
import styles from "./page.module.css";

const fitur = [
  { title: "Materi Lengkap", desc: "Akses materi pembelajaran interaktif, slide presentasi, dokumen PDF, dan video pembelajaran kapan pun dibutuhkan." },
  { title: "Tugas & Kuis", desc: "Pengumpulan tugas secara online dengan tenggat waktu jelas dan sistem pengerjaan kuis real-time." },
  { title: "Rekap Nilai", desc: "Perhitungan rata-rata nilai, tugas, dan evaluasi semester secara otomatis dengan visualisasi data yang transparan." },
  { title: "Manajemen Akun", desc: "Otoritas terpusat untuk profil siswa, wali kelas, guru, hingga kepala sekolah secara terstruktur." },
];

const alur = [
  { step: 1, title: "Login Akun", desc: "Masuk memakai akun yang dibuatkan admin sekolah (email/username dan password)." },
  { step: 2, title: "Pilih Kelas", desc: "Masuk ke kelas mata pelajaran sesuai jadwal dan bimbingan guru." },
  { step: 3, title: "Pelajari Materi", desc: "Akses modul, ringkasan, rekaman video, serta forum tanya jawab." },
  { step: 4, title: "Kerjakan Tugas", desc: "Kirimkan jawaban lewat sistem evaluasi kuis maupun tugas tertulis." },
  { step: 5, title: "Cek Nilai", desc: "Lihat grafik nilai dan dapatkan feedback akademik langsung dari pengajar." },
];

export default function LandingPage() {
  // id elemen yang sedang menjalankan animasi klik
  const [pressed, setPressed] = useState<string | null>(null);

  // props bersama untuk semua foto/box yang bisa diklik
  const clickable = (id: string, base: string, active: string) => ({
    className: `${base} ${styles.clickable} ${pressed === id ? active : ""}`,
    role: "button" as const,
    tabIndex: 0,
    onClick: () => setPressed(id),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setPressed(id);
      }
    },
    onAnimationEnd: (e: React.AnimationEvent) => {
      // hanya reset kalau animasi klik yang selesai, bukan animasi bawaan (napas, kilau)
      if (e.target === e.currentTarget) setPressed(null);
    },
  });

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Reveal direction="left" className={styles.logoReveal}><div className={styles.logoGroup}>
            <Image src="/lo.png" alt="Logo E-CLASS" width={48} height={48} className={styles.logoBox} />
            <div>
              <p className={styles.logoName}>E-CLASS</p>
              <p className={styles.logoSub}>Learning Management System</p>
            </div>
          </div></Reveal>

          <Reveal direction="left" delay={150} className={styles.navReveal}><div className={styles.rightGroup}>
            <nav className={styles.nav}>
              <a href="#tentang">Tentang</a>
              <a href="#fitur">Fitur</a>
              <a href="#alur">Alur</a>
              <a href="#kontak">Kontak &amp; Bantuan</a>
            </nav>

            <Link href="/login" className={styles.btnPrimary}>
              Login
            </Link>
          </div></Reveal>
        </div>
      </header>

      {/* Hero */}
      <section id="tentang" className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Reveal direction="left" className={styles.heroBadgeReveal}><span className={`${styles.badge} ${styles.heroBadge}`}>Sistem Pembelajaran Digital Terkini</span></Reveal>

            <Reveal direction="none" className={styles.heroTitleReveal}><h1 className={styles.heroTitle}>
              <span className={`${styles.heroLine} ${styles.heroLineOne}`}>E-CLASS</span>
              <br />
              <span className={`${styles.heroLine} ${styles.heroLineTwo}`}><span>Platform Pembelajaran</span></span>
              <br />
              <span className={`${styles.heroLine} ${styles.heroLineThree}`}>Digital Terpadu</span>
            </h1></Reveal>

            <Reveal direction="left" delay={600} className={styles.heroDescReveal}><p className={styles.heroDesc}>
              Solusi cerdas untuk mengelola materi kursus, tugas harian, ujian
              online terintegrasi, dan evaluasi hasil belajar secara
              transparan serta real-time dalam satu ekosistem terpadu.
            </p></Reveal>

            <Reveal direction="none" delay={750} className={styles.heroActionsReveal}><div className={styles.heroActions}>
              <a href="#alur" className={styles.btnPrimary}>Mulai Sekarang</a>
              <a href="#fitur" className={styles.btnOutline}>Pelajari Lebih Lanjut</a>
            </div></Reveal>
          </div>

          <Reveal direction="right" className={styles.heroImageReveal}><div
            {...clickable("hero", styles.heroImageWrap, styles.popHero)}
            aria-label="Foto ilustrasi E-CLASS, klik untuk animasi"
          >
            <Image
              src="/cewekk.png"
              alt="Ilustrasi siswa belajar menggunakan E-CLASS"
              fill
              priority
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
            <span className={`${styles.chip} ${styles.chip1}`}>📚 Materi</span>
            <span className={`${styles.chip} ${styles.chip2}`}>📝 Tugas</span>
            <span className={`${styles.chip} ${styles.chip3}`}>📊 Nilai</span>
            <span className={`${styles.chip} ${styles.chip4}`}>✏️ Ulangan Harian</span>
          </div></Reveal>
        </div>
      </section>

      {/* Fitur Utama */}
      <section id="fitur" className={styles.section}>
        <Reveal direction="left" className={styles.sectionReveal}><p className={styles.eyebrow}>Solusi Belajar Digital</p></Reveal>
        <Reveal direction="left" delay={100} className={styles.sectionReveal}><h2 className={styles.sectionTitle}>Fitur Utama E-CLASS</h2></Reveal>
        <Reveal direction="left" delay={200} className={styles.sectionReveal}>
          <p className={styles.sectionDesc}>
            Dirancang khusus untuk mempermudah kegiatan belajar, mengajar, serta
            pengawasan hasil akademik secara menyeluruh.
          </p>
        </Reveal>

        <div className={styles.cardGrid}>
          {fitur.map((f, index) => (
            <Reveal key={f.title} direction="up" delay={index * 120} duration={700} className={styles.cardReveal}>
              <div {...clickable(`fitur-${f.title}`, styles.card, styles.cardActive)}>
                <div className={styles.cardIcon}>●</div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardDesc}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Alur Penggunaan */}
      <section id="alur" className={`${styles.section} ${styles.sectionGray}`}>
        <Reveal direction="left" delay={50} className={styles.sectionReveal}><p className={styles.eyebrow}>Panduan Pengguna</p></Reveal>
        <Reveal direction="left" delay={160} className={styles.sectionReveal}><h2 className={styles.sectionTitle}>Alur Penggunaan E-CLASS</h2></Reveal>
        <Reveal direction="left" delay={200} className={styles.sectionReveal}>
          <p className={styles.sectionDesc}>
            5 tahapan mudah untuk memulai dan memaksimalkan proses kegiatan
            belajar mengajar.
          </p>
        </Reveal>

        <Reveal direction="none" className={styles.flowReveal}>
          <div className={`${styles.cardGrid} ${styles.cardGridAlur}`}>
            {alur.map((s, index) => (
              <Reveal key={s.step} direction="up" delay={index * 120} duration={700} className={styles.cardReveal}>
                <div {...clickable(`alur-${s.step}`, styles.card, styles.cardActive)}>
                  <div className={styles.stepNumber}>{s.step}</div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardDesc}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaCard}>
          <Reveal direction="left" className={styles.ctaTextReveal}>
          <div>
            <span className={styles.badge}>Terobosan Edukasi Digital</span>
            <h3 className={styles.ctaTitle}>
              Nikmati Kemudahan Belajar Bersama E-CLASS
            </h3>
            <p className={styles.ctaText}>
              Tingkatkan efektivitas pembelajaran jarak jauh maupun tatap muka
              langsung dengan teknologi pendidikan yang ramah pengguna, cepat,
              dan aman.
            </p>
            <Link href="/login" className={styles.btnPrimary} style={{ marginTop: 24, display: "inline-block" }}>
              Masuk ke Kelas
            </Link>
          </div>
          </Reveal>

          <Reveal direction="right" className={styles.ctaImageReveal}>
          <div
            {...clickable("cta", styles.ctaImageWrap, styles.tiltCta)}
            aria-label="Foto siswa dan guru, klik untuk animasi"
          >
            <Image
              src="/bareng.png"
              alt="Siswa dan guru berdiskusi menggunakan laptop"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className={styles.footer}>
        <div className={styles.footerInner}>
          <Reveal direction="left" className={styles.footerReveal}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerBrand}>
                <span className={styles.footerLogoBox}>
                  <Image src="/lo.png" alt="Logo E-CLASS" width={48} height={48} className={styles.logoBox} />
                </span>
                <span>E-CLASS</span>
              </div>
              <p className={styles.footerDesc}>
                E-CLASS adalah ekosistem sistem manajemen pembelajaran digital
                terpadu yang dirancang untuk mendukung interaksi belajar yang
                aktif, transparan, dan menyenangkan.
              </p>
            </div>

            <div>
              <h4 className={styles.footerHeading}>Profil</h4>
              <ul className={styles.footerList}>
                <li>Tentang Kami</li>
                <li>Visi &amp; Misi</li>
                <li>Dewan Guru &amp; Tim</li>
                <li>Karir Pengajar</li>
              </ul>
            </div>

            <div>
              <h4 className={styles.footerHeading}>Fitur</h4>
              <ul className={styles.footerList}>
                <li>Manajemen Modul</li>
                <li>Bank Soal &amp; Kuis</li>
                <li>Rekapitulasi Nilai</li>
                <li>Panduan Sistem</li>
              </ul>
            </div>

            <div>
              <h4 className={styles.footerHeading}>Kontak</h4>
              <ul className={styles.footerList}>
                <li>support@eclass.sch.id</li>
                <li>0812 900 0788</li>
                <li>Gedung Edu.Center Lt. 4, Jakarta Selatan, Indonesia</li>
              </ul>
            </div>
          </div>
          </Reveal>
        </div>

        {/* Strip copyright selebar layar */}
        <Reveal direction="left" className={styles.footerBottom}>
          © 2026 E-CLASS LMS. Hak Cipta Dilindungi Undang-Undang.
        </Reveal>
      </footer>
    </div>
  );
}
