"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import Reveal from "./components/Reveal";
import styles from "./page.module.css";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fitur = [
  { icon: "\u{1F4DA}", title: "Materi Lengkap", desc: "Akses materi pembelajaran interaktif, slide presentasi, dokumen PDF, dan video pembelajaran kapan pun dibutuhkan." },
  { icon: "\u{1F4DD}", title: "Tugas & Kuis", desc: "Pengumpulan tugas secara online dengan tenggat waktu jelas dan sistem pengerjaan kuis real-time." },
  { icon: "\u{1F4CA}", title: "Rekap Nilai", desc: "Perhitungan rata-rata nilai, tugas, dan evaluasi semester secara otomatis dengan visualisasi data yang transparan." },
  { icon: "\u{1F464}", title: "Manajemen Akun", desc: "Otoritas terpusat untuk profil siswa, wali kelas, guru, hingga kepala sekolah secara terstruktur." },
];

const alur = [
  { step: 1, title: "Login Akun", desc: "Masuk memakai akun yang dibuatkan admin sekolah (email/username dan password)." },
  { step: 2, title: "Pilih Kelas", desc: "Masuk ke kelas mata pelajaran sesuai jadwal dan bimbingan guru." },
  { step: 3, title: "Pelajari Materi", desc: "Akses modul, ringkasan, rekaman video, serta forum tanya jawab." },
  { step: 4, title: "Kerjakan Tugas", desc: "Kirimkan jawaban lewat sistem evaluasi kuis maupun tugas tertulis." },
  { step: 5, title: "Cek Nilai", desc: "Lihat grafik nilai dan dapatkan feedback akademik langsung dari pengajar." },
];

const fiturDir = ["up", "zoom", "zoom", "up"] as const;
const alurDir = ["left", "up", "zoom", "up", "right"] as const;

export default function LandingPage() {
  const [pressed, setPressed] = useState<string | null>(null);
  const [groupPhotoZoomed, setGroupPhotoZoomed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const groupPhotoRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Scroll halus untuk klik menu (#tentang, #fitur, dst.)
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progressRef.current) {
          const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
          progressRef.current.style.transform = `scaleX(${p})`;
        }
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function closeGroupPhotoZoom(event: PointerEvent) {
      if (!groupPhotoRef.current?.contains(event.target as Node)) {
        setGroupPhotoZoomed(false);
      }
    }
    document.addEventListener("pointerdown", closeGroupPhotoZoom);
    return () => document.removeEventListener("pointerdown", closeGroupPhotoZoom);
  }, []);

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
      if (e.target === e.currentTarget) setPressed(null);
    },
  });

  return (
    <div className={`${styles.page} ${font.className}`}>
      {/* Garis progress scroll di paling atas */}
      <div ref={progressRef} className={styles.progress} aria-hidden="true" />

      {/* Gambar background paling belakang (tetap diam saat scroll) */}
      <div className={styles.bgLayer} aria-hidden="true">
        <div className={styles.bgImage} />
        <div className={styles.bgOverlay} />
      </div>

      <div className={styles.content}>
        {/* Navbar */}
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
          <div className={styles.headerInner}>
            <Reveal direction="down" once>
              <div className={styles.logoGroup}>
                <Image src="/lo.png" alt="Logo E-CLASS" width={48} height={48} className={styles.logoBox} />
                <div>
                  <p className={styles.logoName}>E-CLASS</p>
                  <p className={styles.logoSub}>Learning Management System</p>
                </div>
              </div>
            </Reveal>

            <Reveal direction="down" delay={150} once>
              <div className={styles.rightGroup}>
                <nav className={styles.nav}>
                  <a href="#tentang">Tentang</a>
                  <a href="#fitur">Fitur</a>
                  <a href="#alur">Alur</a>
                  <a href="#kontak">Kontak &amp; Bantuan</a>
                </nav>
                <Link href="/login" className={styles.btnPrimary}>Login</Link>
              </div>
            </Reveal>
          </div>
        </header>

        {/* Hero */}
        <section id="tentang" className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <Reveal direction="down">
                <span className={`${styles.badge} ${styles.heroBadge}`}>Sistem Pembelajaran Digital Terkini</span>
              </Reveal>

              <Reveal direction="zoom" delay={120}>
                <h1 className={styles.heroTitle}>
                  <span>E-CLASS</span>
                  <br />
                  <span className={styles.heroAccent}>Platform Pembelajaran</span>
                  <br />
                  <span>Digital Terpadu</span>
                </h1>
              </Reveal>

              <Reveal direction="up" delay={280}>
                <p className={styles.heroDesc}>
                  Solusi cerdas untuk mengelola materi kursus, tugas harian, ujian
                  online terintegrasi, dan evaluasi hasil belajar secara
                  transparan serta real-time dalam satu ekosistem terpadu.
                </p>
              </Reveal>

              <Reveal direction="zoom" delay={440}>
                <div className={styles.heroActions}>
                  <Link href="/login" className={styles.btnPrimary}>Mulai Sekarang</Link>
                  <a href="#fitur" className={styles.btnOutline}>Pelajari Lebih Lanjut</a>
                </div>
              </Reveal>
            </div>

            <Reveal direction="right" delay={200} duration={1100}>
              <div
                {...clickable("hero", styles.heroImageWrap, styles.popHero)}
                aria-label="Foto ilustrasi E-CLASS, klik untuk animasi"
              >
                <Image
                  src="/cewekk.png"
                  alt="Ilustrasi siswa belajar menggunakan E-CLASS"
                  fill
                  priority
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
                <span className={`${styles.chip} ${styles.chip1}`}>{"\u{1F4DA} Materi"}</span>
                <span className={`${styles.chip} ${styles.chip2}`}>{"\u{1F4DD} Tugas"}</span>
                <span className={`${styles.chip} ${styles.chip3}`}>{"\u{1F4CA} Nilai"}</span>
                <span className={`${styles.chip} ${styles.chip4}`}>{"\u270F\uFE0F Ulangan Harian"}</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Fitur Utama */}
        <section id="fitur" className={`${styles.sectionWrap} ${styles.fiturBg}`}>
          <div className={styles.container}>
            <Reveal direction="down"><p className={styles.eyebrow}>Solusi Belajar Digital</p></Reveal>
            <Reveal direction="up" delay={100}><h2 className={styles.sectionTitle}>Fitur Utama E-CLASS</h2></Reveal>
            <Reveal direction="up" delay={200}>
              <p className={styles.sectionDesc}>
                Dirancang khusus untuk mempermudah kegiatan belajar, mengajar, serta
                pengawasan hasil akademik secara menyeluruh.
              </p>
            </Reveal>

            <div className={styles.cardGrid}>
              {fitur.map((f, index) => (
                <Reveal key={f.title} direction={fiturDir[index % fiturDir.length]} delay={index * 130} className={styles.cardReveal}>
                  <div {...clickable(`fitur-${f.title}`, styles.card, styles.cardActive)}>
                    <div className={styles.cardIcon}>{f.icon}</div>
                    <h3 className={styles.cardTitle}>{f.title}</h3>
                    <p className={styles.cardDesc}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Alur Penggunaan */}
        <section id="alur" className={`${styles.sectionWrap} ${styles.alurBg}`}>
          <div className={styles.container}>
            <Reveal direction="down"><p className={styles.eyebrow}>Panduan Pengguna</p></Reveal>
            <Reveal direction="up" delay={100}><h2 className={styles.sectionTitle}>Alur Penggunaan E-CLASS</h2></Reveal>
            <Reveal direction="up" delay={200}>
              <p className={styles.sectionDesc}>
                5 tahapan mudah untuk memulai dan memaksimalkan proses kegiatan
                belajar mengajar.
              </p>
            </Reveal>

            <div className={`${styles.cardGrid} ${styles.cardGridAlur}`}>
              {alur.map((s, index) => (
                <Reveal key={s.step} direction={alurDir[index % alurDir.length]} delay={index * 120} className={styles.cardReveal}>
                  <div {...clickable(`alur-${s.step}`, styles.card, styles.cardActive)}>
                    <div className={styles.stepNumber}>{s.step}</div>
                    <h3 className={styles.cardTitle}>{s.title}</h3>
                    <p className={styles.cardDesc}>{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className={styles.ctaBanner}>
          <div className={styles.ctaCard}>
            <Reveal direction="left">
              <div>
                <span className={styles.badge}>Terobosan Edukasi Digital</span>
                <h3 className={styles.ctaTitle}>Nikmati Kemudahan Belajar Bersama E-CLASS</h3>
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

            <Reveal direction="zoom" delay={150}>
              <div
                ref={groupPhotoRef}
                className={`${styles.ctaImageWrap} ${styles.clickable}`}
                role="button"
                tabIndex={0}
                aria-pressed={groupPhotoZoomed}
                data-zoomed={groupPhotoZoomed}
                onClick={() => setGroupPhotoZoomed((zoomed) => !zoomed)}
                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setGroupPhotoZoomed((zoomed) => !zoomed);
                  }
                }}
                aria-label="Foto siswa dan guru, klik untuk animasi"
              >
                <span className={styles.ctaPhotoClip}>
                  <Image
                    src="/bareng.png"
                    alt="Siswa dan guru berdiskusi menggunakan laptop"
                    fill
                    style={{ objectFit: "contain", borderRadius: "30px" }}
                  />
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer id="kontak" className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerGrid}>
              <Reveal direction="up">
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
              </Reveal>

              <Reveal direction="up" delay={120}>
                <div>
                  <h4 className={styles.footerHeading}>Profil</h4>
                  <ul className={styles.footerList}>
                    <li>Tentang Kami</li>
                    <li>Visi &amp; Misi</li>
                    <li>Dewan Guru &amp; Tim</li>
                    <li>Karir Pengajar</li>
                  </ul>
                </div>
              </Reveal>

              <Reveal direction="up" delay={240}>
                <div>
                  <h4 className={styles.footerHeading}>Fitur</h4>
                  <ul className={styles.footerList}>
                    <li>Manajemen Modul</li>
                    <li>Bank Soal &amp; Kuis</li>
                    <li>Rekapitulasi Nilai</li>
                    <li>Panduan Sistem</li>
                  </ul>
                </div>
              </Reveal>

              <Reveal direction="up" delay={360}>
                <div>
                  <h4 className={styles.footerHeading}>Kontak</h4>
                  <ul className={styles.footerList}>
                    <li>support@eclass.sch.id</li>
                    <li>0812 900 0788</li>
                    <li>Gedung Edu.Center Lt. 4, Jakarta Selatan, Indonesia</li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Tanpa Reveal supaya tidak ada ruang kosong/warna di bawah copyright */}
          <div className={styles.footerBottom}>
            <span>&copy; 2026 E-CLASS LMS. Hak Cipta Dilindungi Undang-Undang.</span>
            <span className={styles.footerDot} aria-hidden="true" />
            <span>
              Dibuat oleh <strong className={styles.footerMaker}>RBN</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}