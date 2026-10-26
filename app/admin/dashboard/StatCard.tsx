import styles from "./page.module.css";

export type StatIcon = "admin" | "guru" | "siswa" | "kelas" | "jurusan" | "pelajaran" | "aktif" | "akun";

export function Svg({ name, size = 26 }: { name: StatIcon; size?: number }) {
  const p = { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "admin": return <svg {...p}><path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>;
    case "guru": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
    case "siswa": return <svg {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" /></svg>;
    case "kelas": return <svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
    case "jurusan": return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "pelajaran": return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5" /></svg>;
    case "aktif": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>;
    default: return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20c0-3-2-5-5-5.8" /></svg>;
  }
}

// Kotak BESAR untuk bagian Total
export function StatCard({ label, value, icon }: { label: string; value: number; icon: StatIcon; tone?: number }) {
  return (
    <div className={styles.bigCard}>
      <span className={styles.bigIcon}><Svg name={icon} size={28} /></span>
      <span>
        <strong className={styles.bigValue}>{value}</strong>
        <span className={styles.bigLabel}>{label}</span>
      </span>
    </div>
  );
}

// Kotak KECIL untuk bagian Akun Aktif
export function MiniCard({ label, value, total, icon = "aktif" }: { label: string; value: number; total: number; icon?: StatIcon }) {
  return (
    <div className={styles.bigCard}>
      <span className={styles.bigIcon}><Svg name={icon} size={28} /></span>
      <span>
        <strong className={styles.bigValue}>{value}<small className={styles.bigOf}> dari {total}</small></strong>
        <span className={styles.bigLabel}>{label}</span>
      </span>
    </div>
  );
}
export function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className={styles.secHead}>
      <span className={styles.secBar} aria-hidden="true" />
      <div>
        <h2 className={styles.secTitle}>{title}</h2>
        {desc && <p className={styles.secDesc}>{desc}</p>}
      </div>
    </div>
  );
}