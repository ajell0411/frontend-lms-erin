"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, dashboardPath, getProfile, getToken, getUser } from "@/lib/api";
import { isPemantauRole, roleLabel, useRole } from "@/lib/role";
import { ViewModeProvider } from "@/lib/view-mode";
import styles from "@/app/admin/layout.module.css";
import BackButton from "@/app/admin/BackButton";
import { PemantauNotif } from "@/components/notif/PemantauNotif";

type IconName = "grid" | "users" | "database" | "activity" | "user" | "logout";
type MenuChild = { label: string; href: string };
type MenuItem = { label: string; icon: IconName; href?: string; children?: MenuChild[] };

const MENU: MenuItem[] = [
  { label: "Dashboard", icon: "grid", href: "/pemantau/dashboard" },
  {
    label: "Manajemen Akun",
    icon: "users",
    children: [
      { label: "Guru", href: "/pemantau/akun/guru" },
      { label: "Siswa", href: "/pemantau/akun/siswa" },
    ],
  },
  {
    label: "Manajemen Data",
    icon: "database",
    children: [
      { label: "Jurusan", href: "/pemantau/data/jurusan" },
      { label: "Kelas", href: "/pemantau/data/kelas" },
      { label: "Pelajaran", href: "/pemantau/data/pelajaran" },
    ],
  },
  { label: "Aktivitas Guru", icon: "activity", href: "/pemantau/aktivitas-guru" },
  { label: "Profile", icon: "user", href: "/pemantau/profile" },
];

const VIEW = { readOnly: true, basePath: "/pemantau" };

function Icon({ name }: { name: IconName }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
          <path d="M18 14.4c2 .7 3.5 2.6 3.5 5.6" />
        </svg>
      );
    case "database":
      return (
        <svg {...p}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </svg>
      );
    case "activity":
      return (
        <svg {...p}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "user":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="3" />
          <path d="M6.2 18.5c1.4-2.2 3.4-3 5.8-3s4.4.8 5.8 3" />
        </svg>
      );
    case "logout":
      return (
        <svg {...p}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
  }
}

export default function PemantauLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useRole();
  const [ready, setReady] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sideOpen, setSideOpen] = useState(true);
  const [confirmOut, setConfirmOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    let active = true;
    void getProfile().then((profile) => { if (active) setProfilePhoto(profile.foto_url ?? ""); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Guard: hanya admin_kurikulum dan kepala_sekolah
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      const sessionUser = getUser();
      if (!sessionUser) {
        clearSession();
        router.replace("/login");
        return;
      }
      if (!isPemantauRole(sessionUser.role)) {
        router.replace(dashboardPath(sessionUser.role));
        return;
      }
      setReady(true);
    });
  }, [router]);

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

  // Saat cetak: sembunyikan sidebar dan header (aturan CSS admin memakai class ini)
  useEffect(() => {
    const on = () => document.body.classList.add("print-teacher-list");
    const off = () => document.body.classList.remove("print-teacher-list");
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
      off();
    };
  }, []);
  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (!ready) return null;

  const initials = (user?.nama ?? "P")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const showBackButton = /^\/pemantau\/data\/jurusan\/[^/]+$/.test(pathname);

  return (
    <ViewModeProvider value={VIEW}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={styles.headerRight}>
            <PemantauNotif />
            <div className={styles.accountMenuWrap} ref={accountMenuRef}>
              <button type="button" className={styles.topProfile} title="Menu akun" aria-label="Menu akun" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>
                <span className={styles.topProfileText}><strong>{user?.nama ?? "Pengguna"}</strong><small>{roleLabel(role)}</small></span>
                <span className={styles.topAvatar}>{profilePhoto ? <Image src={profilePhoto} alt="" width={36} height={36} unoptimized /> : initials}</span>
              </button>
              <div className={styles.accountMenu} role="menu" aria-hidden={!accountMenuOpen} data-open={accountMenuOpen}>
                <span className={styles.accountMenuArrow} aria-hidden="true" />
                <Link role="menuitem" href="/pemantau/profile" onClick={() => setAccountMenuOpen(false)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>Profil
                </Link>
                <button type="button" role="menuitem" style={{ color: "#dc2626" }} onClick={() => { setAccountMenuOpen(false); setConfirmOut(true); }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>Keluar
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.body}>
          <aside className={`${styles.sidebar} ${sideOpen ? "" : styles.sidebarMini}`}>
            <div className={styles.brand}>
              <Image src="/lo.png" alt="E-CLASS" width={48} height={48} className={styles.brandLogo} priority />
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>E-CLASS</span>
                <span className={styles.brandSub}>Learning Management System</span>
              </div>
            </div>

            <button type="button" className={styles.sideToggle} aria-label="Perkecil atau perbesar menu" aria-expanded={sideOpen} onClick={() => setSideOpen((v) => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            <div className={styles.profileCard}>
              <div className={styles.avatar}>{profilePhoto ? <Image src={profilePhoto} alt="" width={42} height={42} unoptimized /> : initials}</div>
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{user?.nama ?? "Pengguna"}</p>
                <p className={styles.profileRole}>{roleLabel(role)}</p>
              </div>
            </div>

            <nav className={styles.nav}>
              {MENU.map((item) => {
                if (!item.children) {
                  const active = isActive(item.href!);
                  return (
                    <Link key={item.label} href={item.href!} className={`${styles.navItem} ${active ? styles.navActive : ""}`}>
                      <span className={styles.navIcon}><Icon name={item.icon} /></span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                  );
                }
                const hasActiveChild = item.children.some((c) => isActive(c.href));
                const open = openGroups[item.label] ?? hasActiveChild;
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenGroups((prev) => ({ ...prev, [item.label]: !open }))}
                      className={`${styles.navItem} ${hasActiveChild ? styles.navParentActive : ""}`}
                    >
                      <span className={styles.navIcon}><Icon name={item.icon} /></span>
                      <span className={styles.navLabel}>{item.label}</span>
                      <svg className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {open && (
                      <div className={styles.sub}>
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href} className={`${styles.subItem} ${isActive(child.href) ? styles.subActive : ""}`}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <button type="button" className={styles.logout} onClick={() => setConfirmOut(true)}>
              <Icon name="logout" />
              <span>Keluar</span>
            </button>
          </aside>

          <main className={styles.content}>{showBackButton && <BackButton />}{children}</main>

          {confirmOut && (
            <div className={styles.overlay} onClick={() => setConfirmOut(false)}>
              <div className={styles.logoutModal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className={styles.logoutIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <h3 className={styles.logoutTitle}>Konfirmasi Logout</h3>
                <p className={styles.logoutText}>Yakin ingin keluar dari E-CLASS?</p>
                <div className={styles.logoutActions}>
                  <button type="button" className={styles.btnBatal} onClick={() => setConfirmOut(false)}>Batal</button>
                  <button type="button" className={styles.btnKeluar} onClick={handleLogout}>Keluar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ViewModeProvider>
  );
}