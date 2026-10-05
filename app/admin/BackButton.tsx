"use client";

import { useRouter } from "next/navigation";
import styles from "./back-button.module.css";

export default function BackButton() {
  const router = useRouter();
  return <button type="button" className={styles.back} onClick={() => {
    if (window.history.length > 1) router.back();
    else router.push("/admin/dashboard");
  }} aria-label="Kembali">← <span>Kembali</span></button>;
}
