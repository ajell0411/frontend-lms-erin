"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getToken, type UserData } from "@/lib/api";
import { timeAgo, useAktivitas } from "@/lib/aktivitas";
import styles from "./layout.module.css";

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
      { label: "Jurusan & Kelas", href: "/admin/data/jurusan-kelas" },
    ],
  },
  { label: "Pengumuman", icon: "megaphone", href: "/admin/pengumuman" },
  { label: "Profile", icon: "user", href: "/admin/profile" },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  admin_kurikulum: "Admin Kurikulum",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
  siswa: "Siswa",
};

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

function readUser(): UserData | null {
  const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const aktivitas = useAktivitas();
  const bellRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [ready, setReady] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [bellOpen, setBellOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [confirmOut, setConfirmOut] = useState(false);

  // Guard token: harus di useEffect karena localStorage hanya ada di browser
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setUser(readUser());
    setReady(true);
  }, [router]);

  // Tutup pop up saat pindah halaman
  useEffect(() => {
    setBellOpen(false);
  }, [pathname]);

  // Tutup pop up saat klik di luar
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  function toggleBell() {
    setBellOpen((v) => !v);
    setSeen(true);
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  if (!ready) return null;

  const initials = (user?.nama ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
<div className={styles.headerRight}>
          <div className={styles.bellWrap} ref={bellRef}>
            <button
              type="button"
              className={styles.bellBtn}
              aria-label="Aktivitas terbaru"
              aria-expanded={bellOpen}
              onClick={toggleBell}
            >
              <Icon name="bell" />
              {!seen && aktivitas.length > 0 && <span className={styles.bellDot} />}
            </button>

            {bellOpen && (
              <div className={styles.popup}>
                <div className={styles.popupHead}>Aktivitas Terbaru</div>
                <div className={styles.popupList}>
                  {aktivitas.length === 0 && (
                    <p className={styles.popupEmpty}>Belum ada aktivitas.</p>
                  )}
                  {aktivitas.slice(0, 5).map((a) => (
                    <Link
                      key={a.id}
                      href="/admin/pengumuman"
                      className={styles.popupItem}
                    >
                      <span className={styles.popupDot} />
                      <span className={styles.popupText}>
                        <span className={styles.popupTitle}>{a.judul}</span>
                        <span className={styles.popupDesc}>{a.deskripsi}</span>
                        <span className={styles.popupTime}>{timeAgo(a.waktu)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <Link href="/admin/pengumuman" className={styles.popupFooter}>
                  Lihat semua
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/admin/profile"
            className={styles.topAvatar}
            title="Buka profile"
            aria-label="Buka profile"
          >
            {initials}
          </Link>
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
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{user?.nama ?? "Pengguna"}</p>
              <p className={styles.profileRole}>
                {ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? ""}
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

              const hasActiveChild = item.children.some((c) => isActive(c.href));
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
                          className={`${styles.subItem} ${isActive(child.href) ? styles.subActive : ""}`}
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
            <span>Logout</span>
          </button>
        </aside>

        <main className={styles.content}>{children}</main>

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