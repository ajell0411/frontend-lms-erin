"use client";

import { useRouter } from "next/navigation";
import styles from "./back-button.module.css";
import { useViewMode } from "@/lib/view-mode";

export default function BackButton() {
  const router = useRouter();
  const { basePath } = useViewMode();
  return <button type="button" className={styles.back} onClick={() => {
    if (window.history.length > 1) router.back();
    else router.push(`${basePath}/dashboard`);
  }} aria-label="Kembali"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h12" /></svg><span>Kembali</span></button>;
}
