import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-CLASS | Learning Management System",
  description: "Platform pembelajaran digital terpadu untuk siswa, guru, dan sekolah.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <div id="site-content">{children}</div>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} E-CLASS LMS. Hak Cipta Dilindungi Undang-Undang.</span>
          <span aria-hidden="true">·</span>
          <span>Dibuat oleh <strong>RBN</strong></span>
        </footer>
      </body>
    </html>
  );
}