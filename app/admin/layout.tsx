"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, dashboardPath, getProfile, getToken, getUser, listAktivitas, type AktivitasRecord, type UserRole } from "@/lib/api";
import { roleLabel, useRole } from "@/lib/role";
import styles from "./layout.module.css";
import BackButton from "./BackButton";

type IconName = "grid" | "users" | "database" | "megaphone" | "user" | "logout" | "bell";
type MenuChild = { label: string; href: string };
type MenuItem = {
  label: string;
  icon: IconName;
  href?: string;
  children?: MenuChild[];
};

// Ubah href di sini kalau nama route halamanmu berbeda
const MENU: MenuItem[] = [
  { label: "Dashboard", icon: "grid", href: "/admin/dashboard" },
  {
    label: "Manajemen Akun",
    icon: "users",
    children: [
      { label: "Admin", href: "/admin/akun/admin" },
      { label: "Guru", href: "/admin/akun/guru" },
      { label: "Siswa", href: "/admin/akun/siswa" },
    ],
  },
  {
    label: "Manajemen Data",
    icon: "database",
    children: [
      { label: "Pelajaran", href: "/admin/data/pelajaran" },
      { label: "Jurusan & Kelas", href: "/admin/data/jurusan" },
    ],
  },
  { label: "Pengumuman", icon: "megaphone", href: "/admin/pengumuman" },
  { label: "Profil", icon: "user", href: "/admin/profile" },
];

const ADMIN_ROLES: UserRole[] = ["admin", "admin_kurikulum", "kepala_sekolah"];

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
    case "megaphone":
      return (
        <svg {...p}>
          <path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z" />
          <path d="M18 9a4 4 0 0 1 0 6" />
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
    case "bell":
      return (
        <svg {...p}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aktivitas, setAktivitas] = useState<AktivitasRecord[]>([]);
  const { user, role } = useRole();
  const [ready, setReady] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [aktivitasSeenAt, setAktivitasSeenAt] = useState(0);
  const [sideOpen, setSideOpen] = useState(true);
  const [confirmOut, setConfirmOut] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    let active = true;
    void getProfile().then((profile) => { if (active) setProfilePhoto(profile.foto_url ?? ""); }).catch(() => undefined);
    const updatePhoto = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "string") setProfilePhoto(event.detail);
    };
    window.addEventListener("eclass-profile-updated", updatePhoto);
    return () => { active = false; window.removeEventListener("eclass-profile-updated", updatePhoto); };
  }, []);

  // Guard token: harus di useEffect karena localStorage hanya ada di browser
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
      if (!ADMIN_ROLES.includes(sessionUser.role)) {
        router.replace(dashboardPath(sessionUser.role));
        return;
      }
      setReady(true);
    });
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        setAktivitasSeenAt(Number(localStorage.getItem("eclass_aktivitas_seen_at")) || 0);
      } catch {
        setAktivitasSeenAt(0);
      }
    });
    let mounted = true;
    const loadActivities = () => {
      void listAktivitas(100).then((rows) => {
        if (mounted) setAktivitas(rows);
      }).catch(() => undefined);
    };
    loadActivities();
    const timer = window.setInterval(loadActivities, 30000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !bellRef.current?.contains(event.target)) setBellOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setBellOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [bellOpen]);

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

  useEffect(() => {
    function onActivitiesRead(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail === "number") {
        setAktivitasSeenAt(event.detail);
      }
    }
    window.addEventListener("eclass-aktivitas-seen", onActivitiesRead);
    return () => window.removeEventListener("eclass-aktivitas-seen", onActivitiesRead);
  }, []);

  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  function markActivitiesRead() {
    const now = Date.now();
    setAktivitasSeenAt(now);
    try {
      localStorage.setItem("eclass_aktivitas_seen_at", String(now));
    } catch {
      // Penyimpanan browser bisa tidak tersedia.
    }
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const isChildActive = (href: string) =>
    isActive(href) ||
    (href === "/admin/data/jurusan" && pathname.startsWith("/admin/data/kelas/"));

  if (!ready) return null;

  const initials = (user?.nama ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  const latestActivityAt = aktivitas.reduce((latest, item) => {
    const timestamp = new Date(item.created_at).getTime();
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
  const hasUnreadActivity = latestActivityAt > aktivitasSeenAt;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
<div className={styles.headerRight}>
          <div className={styles.bellWrap} ref={bellRef}>
            <button
              type="button"
              className={styles.bellBtn}
              aria-label="Buka pengumuman aktivitas"
              aria-expanded={bellOpen}
              aria-haspopup="dialog"
              onClick={() => {
                const latest = latestActivityAt || Date.now();
                setBellOpen((open) => !open);
                markActivitiesRead();
                setAktivitasSeenAt(latest);
                try { localStorage.setItem("eclass_aktivitas_seen_at", String(latest)); } catch { /* Penyimpanan browser bisa tidak tersedia. */ }
              }}
            >
              <Icon name="bell" />
              {hasUnreadActivity && <span className={styles.bellDot} />}
            </button>
            {bellOpen && <section className={styles.notificationPopover} aria-label="Pengumuman terbaru">
              <span className={styles.notificationArrow} aria-hidden="true" />
              <h2>Pengumuman terbaru</h2>
              {aktivitas.slice(0, 6).length === 0 ? <p className={styles.notificationEmpty}>Belum ada pengumuman</p> : <div className={styles.notificationList}>
                {aktivitas.slice(0, 6).map((item) => <Link key={item.id} href="/admin/pengumuman" className={styles.notificationItem} onClick={() => setBellOpen(false)}>
                  <strong>{item.objek_nama ? `${item.objek_jenis}: ${item.objek_nama}` : item.objek_jenis}</strong>
                  <span>{item.aktor_nama} telah {item.aksi} {item.objek_jenis.toLowerCase()}.</span>
                  <small>{relativeTime(item.created_at)}</small>
                </Link>)}
              </div>}
              <Link href="/admin/pengumuman" className={styles.notificationAll} onClick={() => setBellOpen(false)}>Lihat semua pengumuman</Link>
            </section>}
          </div>

          <div className={styles.accountMenuWrap} ref={accountMenuRef}>
            <button type="button" className={styles.topProfile} title="Menu akun" aria-label="Menu akun" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>
              <span className={styles.topProfileText}><strong>{user?.nama ?? "Pengguna"}</strong><small>{roleLabel(role)}</small></span>
              <span className={styles.topAvatar}>{profilePhoto ? <Image src={profilePhoto} alt="" width={36} height={36} unoptimized /> : initials}</span>
            </button>
            {accountMenuOpen && <div className={styles.accountMenu} role="menu">
              <Link role="menuitem" href="/admin/profile" onClick={() => setAccountMenuOpen(false)}>Profil</Link>
              <Link role="menuitem" href="/admin/profile#credentials" onClick={() => setAccountMenuOpen(false)}>Ganti Username/Password</Link>
              <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); setConfirmOut(true); }}>Keluar</button>
            </div>}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={`${styles.sidebar} ${sideOpen ? "" : styles.sidebarMini}`}>
          <div className={styles.brand}>
            <Image
              src="/lo.png"
              alt="E-CLASS"
              width={48}
              height={48}
              className={styles.brandLogo}
              priority
            />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>E-CLASS</span>
              <span className={styles.brandSub}>Learning Management System</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.sideToggle}
            aria-label="Perkecil atau perbesar menu"
            aria-expanded={sideOpen}
            onClick={() => setSideOpen((v) => !v)}
          >
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
              <p className={styles.profileRole}>
                {roleLabel(role)}
              </p>
            </div>
          </div>

          <nav className={styles.nav}>
            {MENU.map((item) => {
              if (!item.children) {
                const active = isActive(item.href!);
                return (
                  <Link
                    key={item.label}
                    href={item.href!}
                    className={`${styles.navItem} ${active ? styles.navActive : ""}`}
                  >
                    <span className={styles.navIcon}>
                      <Icon name={item.icon} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                );
              }

              const hasActiveChild = item.children.some((c) => isChildActive(c.href));
              const open = openGroups[item.label] ?? hasActiveChild;

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenGroups((prev) => ({ ...prev, [item.label]: !open }))
                    }
                    className={`${styles.navItem} ${hasActiveChild ? styles.navParentActive : ""}`}
                  >
                    <span className={styles.navIcon}>
                      <Icon name={item.icon} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <svg
                      className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {open && (
                    <div className={styles.sub}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`${styles.subItem} ${isChildActive(child.href) ? styles.subActive : ""}`}
                        >
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

        <main className={styles.content}><BackButton />{children}</main>

        {confirmOut && (
          <div className={styles.overlay} onClick={() => setConfirmOut(false)}>
            <div
              className={styles.logoutModal}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.logoutIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 className={styles.logoutTitle}>Konfirmasi Logout</h3>
              <p className={styles.logoutText}>Yakin ingin keluar dari E-CLASS?</p>
              <div className={styles.logoutActions}>
                <button
                  type="button"
                  className={styles.btnBatal}
                  onClick={() => setConfirmOut(false)}
                >
                  Batal
                </button>
                <button type="button" className={styles.btnKeluar} onClick={handleLogout}>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}</div>
    </div>
  );
}

function relativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] = Math.abs(seconds) < 60 ? [seconds, "second"] : Math.abs(seconds) < 3600 ? [Math.round(seconds / 60), "minute"] : Math.abs(seconds) < 86400 ? [Math.round(seconds / 3600), "hour"] : [Math.round(seconds / 86400), "day"];
  return new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" }).format(amount, unit);
}
