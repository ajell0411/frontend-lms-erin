BAGIAN 2 dari 4: dashboard, pengumuman, materi, asesmen

Lanjutkan SISI SISWA E-CLASS (bagian 2 dari 4). Layout, sidebar, navbar, popup lonceng, dan komponen bersama dari bagian 1 sudah ada, pakai ulang. ATURAN TETAP: jangan ubah apa pun di admin/guru/kurikulum/kepala-sekolah, globals.css, atau fungsi lama lib/api.ts. Hanya tambah file baru di app/siswa dan lib/siswa.ts. Navbar siswa tetap TANPA tulisan; judul halaman di bawah navbar. Tiap halaman wajib punya loading skeleton, empty state, error state + "Coba lagi".

1) DASHBOARD /siswa/dashboard (gambar 1):
- Banner gradasi indigo-biru: "Selamat datang, {nama}!" + "Semester {Ganjil/Genap} {tahun ajaran} sedang berjalan. Terus semangat belajarnya!" (dihitung dari tanggal).
- Section "Asesmen Terbaru" (tautan kecil "LIHAT SEMUA"): card list dengan ikon, judul, tanggal & jam, badge BELUM DIKERJAKAN merah / SELESAI hijau, chevron.
- Section "Tugas Terbaru": judul, tenggat (merah bila <24 jam/lewat), progres, badge PROSES/SELESAI/TERLAMBAT.
- TAMBAHKAN section "Materi Terbaru": ikon tipe file, judul, badge pelajaran, tanggal unggah, tombol kecil unduh.
- Maks 3 item per section.

2) PENGUMUMAN /siswa/pengumuman:
- Isinya materi, tugas, dan asesmen terbaru. Filter chip Semua | Materi | Tugas | Asesmen.
- Feed card gaya Pengumuman admin: ikon bulat per jenis, "Guru {nama} menambahkan {jenis} {judul}", pelajaran, waktu relatif, titik biru bila belum dilihat. Klik menuju halaman terkait. 10 item per halaman + "Muat lebih banyak".

3) MATERI /siswa/materi (gambar 2):
- PageHeader "Materi Pembelajaran" di bawah navbar (bukan di navbar).
- Toolbar: pencarian "Cari materi pembelajaran..." (debounce 300ms) dan dropdown "Pilih Pelajaran" (BUKAN "Pilih Kelas"; opsi Semua Pelajaran + pelajaran siswa).
- Grid card (3 kolom desktop): ikon tipe file, judul, badge pelajaran, "Diunggah: tanggal", tombol "Unduh Materi" yang BENAR-BENAR mengunduh (fetch dengan token, jadikan blob, anchor download dengan nama file asli; ada loading dan toast sukses/gagal).

4) ASESMEN /siswa/asesmen (gambar 3):
- PageHeader "Asesmen Pembelajaran" + "Kerjakan dan kerjakan evaluasi pembelajaran Anda di sini."
- Toolbar: pencarian + dropdown "Pilih Pelajaran" + dropdown "Pilih Asesmen" (opsi Semua, Ujian Harian, Kuis). Semua dropdown kustom (bukan select bawaan: panel putih, hover lavender, ceklis, Esc untuk tutup). Hapus chip filter lama.
- Grid card: border-kiri berwarna pelajaran, badge pelajaran, durasi (ikon jam), judul, deskripsi. Status: AKTIF = tombol "Kerjakan Sekarang →" (modal konfirmasi lalu ke /siswa/asesmen/[id]); SELESAI = "Nilai: 85/100" hijau; TERKUNCI = card pudar + gembok + "Terkunci hingga {tanggal, jam}" + tombol "Belum Dimulai" disabled.

Gunakan fungsi di lib/siswa.ts (interface TypeScript, respons backend {success, message, data}). Kalau endpoint belum ada, siapkan pemanggilnya dan beri komentar TODO; backend dikerjakan di bagian 4.
Di akhir: npm run build lolos, git diff --stat tidak menyentuh file admin, ringkas hasilnya.