"use client";

import "./siswa.tokens.css";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, dashboardPath, getToken, getUser, type UserData } from "@/lib/api";
import { getProfilSiswa, type ProfilSiswa } from "@/lib/siswa";
import { NotifPopup } from "./components/NotifPopup";
import { Skeleton, ToastProvider } from "./components";
import styles from "./layout.module.css";

type MenuIcon = "dashboard" | "materi" | "asesmen" | "tugas" | "pengumuman" | "profile" | "logout" | "menu";
const menus: { label: string; href: string; icon: MenuIcon }[] = [
  { label: "Dashboard", href: "/siswa/dashboard", icon: "dashboard" },
  { label: "Materi", href: "/siswa/materi", icon: "materi" },
  { label: "Asesmen", href: "/siswa/asesmen", icon: "asesmen" },
  { label: "Tugas", href: "/siswa/tugas", icon: "tugas" },
  { label: "Pengumuman", href: "/siswa/pengumuman", icon: "pengumuman" },
  { label: "Profile", href: "/siswa/profile", icon: "profile" },
];

function Icon({ name }: { name: MenuIcon }) {
  const props = { viewBox: "0 0 24 24", width: 19, height: 19, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "dashboard": return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "materi": return <svg {...props}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5v17M8 6h8M8 10h7"/></svg>;
    case "asesmen": return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3.5h6M8 10l2 2 5-5M8 17h8"/></svg>;
    case "tugas": return <svg {...props}><path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="5" rx="1"/><path d="M8 12h8M8 16h5"/></svg>;
    case "pengumuman": return <svg {...props}><path d="M3 11v2a1 1 0 0 0 1 1h3l9 5V5l-9 5H4a1 1 0 0 0-1 1z"/><path d="M7 14l2 6M19 9a4 4 0 0 1 0 6"/></svg>;
    case "profile": return <svg {...props}><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>;
    case "logout": return <svg {...props}><path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>;
    case "menu": return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
  }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "S";
}

function StudentSkeleton() {
  return <div className={styles.skeletonShell}><aside><Skeleton className={styles.skeletonLogo}/><Skeleton className={styles.skeletonProfile}/><Skeleton className={styles.skeletonMenu}/><Skeleton className={styles.skeletonMenu}/><Skeleton className={styles.skeletonMenu}/></aside><div className={styles.skeletonMain}><header/><Skeleton className={styles.skeletonTitle}/><Skeleton className={styles.skeletonPanel}/></div></div>;
}

export default function SiswaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfilSiswa | null>(null);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    if (!drawerOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [drawerOpen, closeDrawer]);
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const name = profile?.nama || user?.nama || "Siswa";
  const className = typeof profile?.kelas === "string" ? profile.kelas : profile?.kelas?.nama || profile?.nama_kelas || "";
  const photo = profile?.foto_url;
  const isActive = useCallback((href: string) => pathname === href || pathname.startsWith(href + "/"), [pathname]);
  const brand = useMemo(() => <Link className={styles.brand} href="/siswa/dashboard" aria-label="E-CLASS dashboard siswa"><span className={styles.brandIcon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3.6 2.7 8.4 2.7 12 0v-5M22 9v7"/></svg></span><strong>E-CLASS</strong></Link>, []);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!ready || !user) return <StudentSkeleton/>;

  return <ToastProvider><div className={styles.shell}>
    <aside className={[styles.sidebar, drawerOpen ? styles.sidebarOpen : ""].join(" ")}>
      {brand}
      <div className={styles.profileCard}>
        <span className={styles.avatar}>{photo ? <Image src={photo} alt="" width={40} height={40} unoptimized/> : initials(name)}</span>
        <span className={styles.profileInfo}><strong title={name}>{name}</strong><small>Siswa{className ? " Kelas " + className : ""}</small></span>
      </div>
      <nav className={styles.nav} aria-label="Navigasi siswa">
        {menus.map((menu) => <Link key={menu.href} href={menu.href} className={[styles.navItem, isActive(menu.href) ? styles.navActive : ""].join(" ")} aria-current={isActive(menu.href) ? "page" : undefined}><Icon name={menu.icon}/><span>{menu.label}</span></Link>)}
      </nav>
      <button type="button" className={styles.logout} onClick={logout}><Icon name="logout"/><span>Logout</span></button>
    </aside>
    {drawerOpen && <button type="button" className={styles.overlay} aria-label="Tutup menu" onClick={closeDrawer}/>}
    <div className={styles.main}>
      <header className={styles.topbar}>
        <button type="button" className={styles.hamburger} aria-label="Buka menu navigasi" aria-expanded={drawerOpen} onClick={() => setDrawerOpen((value) => !value)}><Icon name="menu"/></button>
        <div className={styles.topbarRight}>
          <NotifPopup/>
          <Link href="/siswa/profile" className={styles.topProfile} aria-label="Buka profil saya"><span className={styles.topAvatar}>{photo ? <Image src={photo} alt="" width={32} height={32} unoptimized/> : initials(name)}</span></Link>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  </div></ToastProvider>;
}
