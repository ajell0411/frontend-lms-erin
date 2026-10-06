BAGIAN 1 dari 4: aturan, landing page, layout, popup lonceng

Kerjakan SISI SISWA project E-CLASS (bagian 1 dari 4). Frontend: e-class-frontend (Next.js App Router, TypeScript, CSS Modules, TANPA Tailwind, UI bahasa Indonesia). Backend: e-class-backend (Go, Gin, GORM, SQLite, port 8080, API di /api).

PERSIAPAN:
- Buat branch baru "fitur-siswa". Pastikan git status bersih.
- Baca (read-only) app/admin/layout.tsx, CSS-nya, dan app/globals.css untuk meniru warna, font, radius, shadow, ukuran sidebar/navbar.
- Pakai ulang lib/api.ts (getToken, saveSession, clearSession, dashboardPath). Fungsi API siswa ditaruh di file baru lib/siswa.ts.

ATURAN KERAS: JANGAN UBAH APA PUN YANG ADA DI ADMIN
- Dilarang edit/pindah/hapus file di app/admin, app/guru, app/kurikulum, app/kepala-sekolah, komponen yang dipakai admin, style di globals.css, dan perilaku fungsi lama di lib/api.ts.
- Butuh komponen serupa? Buat BARU di app/siswa/components (tiru gayanya). Variable CSS baru pakai prefix --siswa- di CSS module siswa.
- Backend: hanya TAMBAH route/handler baru (handlers/siswa_*.go). Jangan ubah route/handler/format respons lama.
- Jangan refactor atau "perbaiki sekalian" di luar siswa. Bug di admin cukup dicatat di ringkasan.
- Boleh edit landing page "/" HANYA di bagian hero foto.

DESAIN: samakan dengan admin (indigo, lavender muda, card putih radius 12px, border tipis, shadow halus). Data dummy di gambar (mis. "rabunajell") jangan di-hardcode, ambil dari API/session.

1) LANDING PAGE (gambar 8): di hero "Nikmati Kemudahan Belajar Bersama E-CLASS", foto ilustrasi diberi border-radius ±24px (overflow hidden) dan ada KOTAK BIRU di belakangnya (::before, gradasi biru muda ke biru, radius ±28px, digeser ±20px ke kanan-bawah, z-index di bawah foto). Pertahankan warna, teks, tombol "Masuk ke Kelas" (ke /login), animasi yang ada. Mobile: foto di bawah teks.

2) LAYOUT SISWA app/siswa/layout.tsx (gambar 1):
- Guard: harus login role siswa, kalau tidak redirect (belum login ke /login, role lain ke dashboardPath(role)).
- Sidebar kiri 240px putih: logo E-CLASS, kartu profil mini (foto, nama, "Siswa Kelas {kelas}" dari data user), menu Dashboard, Materi, Asesmen, Tugas, Pengumuman, Profile (aktif = background indigo teks putih, termasuk sub-route), Logout merah di bawah. Di <1024px jadi drawer + hamburger.
- Navbar atas tipis 56px: JANGAN ada tulisan/judul apa pun di navbar. Hanya lonceng (titik merah bila ada yang baru) dan foto profil kecil (ke /siswa/profile) di kanan.
- Judul halaman + subjudul DITURUNKAN ke bawah navbar lewat komponen PageHeader (bukan di navbar).
- Lonceng = POP UP dropdown (lebar 360px, scroll, tutup saat klik luar/Esc): isinya sama dengan Pengumuman, yaitu grup "Materi Terbaru", "Tugas Terbaru", "Asesmen Terbaru" (maks 3 per grup; ikon jenis, judul, pelajaran, waktu relatif). Klik item menuju halaman terkait. Footer: "Lihat semua pengumuman" (ke /siswa/pengumuman) dan "Tandai sudah dibaca". Ada loading, empty, error state.
- Komponen bersama di app/siswa/components: PageHeader, Card, Badge, Dropdown kustom, SearchInput, EmptyState, ErrorState, Skeleton, Toast, Modal, FileDropzone.

Di akhir: pastikan npm run build lolos, git diff --stat tidak menyentuh file admin, lalu ringkas file yang dibuat/diubah.