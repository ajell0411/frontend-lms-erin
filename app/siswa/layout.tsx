"use client";

import "./siswa.tokens.css";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, dashboardPath, getToken, getUser, type UserData } from "@/lib/api";
import { getProfilSiswa, type ProfilSiswa } from "@/lib/siswa";
import { NotifPopup } from "./components/NotifPopup";
import { Skeleton, ToastProvider } from "./components";
import styles from "./layout.module.css";
import menuStyles from "./account-menu.module.css";

type MenuIcon = "dashboard" | "materi" | "asesmen" | "tugas" | "pengumuman" | "profile" | "logout" | "menu" | "dots";

const menus: { label: string; href: string; icon: MenuIcon }[] = [
  { label: "Dashboard", href: "/siswa/dashboard", icon: "dashboard" },
  { label: "Materi", href: "/siswa/materi", icon: "materi" },
  { label: "Asesmen", href: "/siswa/asesmen", icon: "asesmen" },
  { label: "Tugas", href: "/siswa/tugas", icon: "tugas" },
  { label: "Pengumuman", href: "/siswa/pengumuman", icon: "pengumuman" },
  { label: "Profile", href: "/siswa/profile", icon: "profile" },
];

function Icon({ name }: { name: MenuIcon }) {
  const props = {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "materi":
      return (
        <svg {...props}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z" />
          <path d="M4 5v17M8 6h8M8 10h7" />
        </svg>
      );
    case "asesmen":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 3.5h6M8 10l2 2 5-5M8 17h8" />
        </svg>
      );
    case "tugas":
      return (
        <svg {...props}>
          <path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
          <rect x="8" y="2" width="8" height="5" rx="1" />
          <path d="M8 12h8M8 16h5" />
        </svg>
      );
    case "pengumuman":
      return (
        <svg {...props}>
          <path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z" />
          <path d="M18 9a4 4 0 0 1 0 6" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "dots":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      );
  }
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "S"
  );
}

function StudentSkeleton() {
  return (
    <div className={styles.skeletonShell}>
      <aside>
        <Skeleton className={styles.skeletonLogo} />
        <Skeleton className={styles.skeletonProfile} />
        <Skeleton className={styles.skeletonMenu} />
        <Skeleton className={styles.skeletonMenu} />
        <Skeleton className={styles.skeletonMenu} />
      </aside>
      <div className={styles.skeletonMain}>
        <header />
        <Skeleton className={styles.skeletonTitle} />
        <Skeleton className={styles.skeletonPanel} />
      </div>
    </div>
  );
}

export default function SiswaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfilSiswa | null>(null);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mini, setMini] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    const sessionUser = getUser();
    if (!token || !sessionUser) {
      clearSession();
      router.replace("/login");
      return;
    }
    if (sessionUser.role !== "siswa") {
      router.replace(dashboardPath(sessionUser.role));
      return;
    }
    setUser(sessionUser);
    setReady(true);
    void getProfilSiswa().then(setProfile).catch(() => undefined);
  }, [router]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen && !confirmOut) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        setConfirmOut(false);
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [drawerOpen, confirmOut]);

  useEffect(() => {
    setDrawerOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountMenuOpen]);

  const name = profile?.nama || user?.nama || "Siswa";
  const kelas =
    typeof profile?.kelas === "string"
      ? profile.kelas
      : profile?.kelas?.nama || profile?.nama_kelas || "";
  const photo = profile?.foto_url;
  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname]
  );

  function toggleSide() {
    if (window.matchMedia("(max-width: 1023px)").matches) setDrawerOpen(false);
    else setMini((value) => !value);
  }

  function logout() {
    clearSession();
    router.replace("/");
  }

  if (!ready || !user) return <StudentSkeleton />;

  return (
    <ToastProvider>
      <div className={[styles.shell, mini ? styles.shellMini : ""].join(" ")}>
        <aside className={[styles.sidebar, drawerOpen ? styles.sidebarOpen : ""].join(" ")}>
          <Link className={styles.brand} href="/siswa/dashboard" aria-label="E-CLASS dashboard siswa">
            <Image src="/lo.png" alt="" width={48} height={48} className={styles.brandLogo} priority />
            <span className={styles.brandText}>
              <strong>E-CLASS</strong>
              <small>Learning Management System</small>
            </span>
          </Link>

          <div className={styles.profileRow}>
            <button
              type="button"
              className={styles.dotsBtn}
              aria-label="Perkecil atau perbesar menu"
              aria-expanded={!mini}
              onClick={toggleSide}
            >
              <Icon name="dots" />
            </button>
            <div className={styles.profileCard}>
              <span className={styles.avatar}>
                {photo ? <Image src={photo} alt="" width={40} height={40} unoptimized /> : initials(name)}
              </span>
              <span className={styles.profileInfo}>
                <strong title={name}>{name}</strong>
                <small>Siswa{kelas ? " Kelas " + kelas : ""}</small>
              </span>
            </div>
          </div>

          <nav className={styles.nav} aria-label="Navigasi siswa">
            {menus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                title={menu.label}
                className={[styles.navItem, isActive(menu.href) ? styles.navActive : ""].join(" ")}
                aria-current={isActive(menu.href) ? "page" : undefined}
              >
                <Icon name={menu.icon} />
                <span>{menu.label}</span>
              </Link>
            ))}
          </nav>

          <button type="button" className={styles.logout} onClick={() => setConfirmOut(true)}>
            <Icon name="logout" />
            <span>Keluar</span>
          </button>
        </aside>

        {drawerOpen && (
          <button type="button" className={styles.overlay} aria-label="Tutup menu" onClick={closeDrawer} />
        )}

        <div className={styles.main}>
          <header className={styles.topbar}>
            <button
              type="button"
              className={styles.hamburger}
              aria-label="Buka menu navigasi"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((value) => !value)}
            >
              <Icon name="menu" />
            </button>
            <div className={styles.topbarRight}>
              <NotifPopup />
              <div className={menuStyles.wrap} ref={accountMenuRef}>
                <button type="button" className={styles.userChip + " " + menuStyles.chipBtn} aria-label="Menu akun" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>
                <span className={styles.userText}>
                  <strong>{name}</strong>
                  <small>{profile ? kelas || "Belum ada kelas" : "\u00A0"}</small>
                </span>
                <span className={styles.topAvatar}>
                  {photo ? <Image src={photo} alt="" width={36} height={36} unoptimized /> : initials(name)}
                </span>
              </button>
                <div className={menuStyles.menu} role="menu" aria-hidden={!accountMenuOpen} data-open={accountMenuOpen}>
                  <span className={menuStyles.arrow} aria-hidden="true" />
                  <Link role="menuitem" href="/siswa/profile" onClick={() => setAccountMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
                    Profil
                  </Link>
                  <button type="button" role="menuitem" className={menuStyles.danger} onClick={() => { setAccountMenuOpen(false); setConfirmOut(true); }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
                    Keluar
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className={styles.content}>{children}</main>
        </div>

        {confirmOut && (
          <div className={styles.confirmOverlay} onClick={() => setConfirmOut(false)}>
            <div
              className={menuStyles.logoutModal}
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={menuStyles.logoutIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 className={menuStyles.logoutTitle}>Konfirmasi Logout</h3>
              <p className={menuStyles.logoutText}>Yakin ingin keluar dari E-CLASS?</p>
              <div className={menuStyles.logoutActions}>
                <button type="button" className={menuStyles.btnBatal} onClick={() => setConfirmOut(false)}>Batal</button>
                <button type="button" className={menuStyles.btnKeluar} onClick={logout}>Keluar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}