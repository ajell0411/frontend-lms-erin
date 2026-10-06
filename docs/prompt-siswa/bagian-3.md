BAGIAN 3 dari 4: mengerjakan asesmen, tugas, profile

Lanjutkan SISI SISWA E-CLASS (bagian 3 dari 4). Pakai layout dan komponen yang sudah ada. ATURAN TETAP: jangan ubah apa pun di admin/guru/kurikulum/kepala-sekolah, globals.css, atau fungsi lama lib/api.ts. Navbar siswa TANPA tulisan di semua halaman ini; judul diturunkan di bawah navbar. Wajib ada loading, empty, error state.

1) MENGERJAKAN ASESMEN /siswa/asesmen/[id] (gambar 4):
- Di bawah navbar: judul asesmen (mis. "Ujian Matematika Lanjut - Bab 3") dan badge timer merah (mm:ss) di kanan.
- Dua kolom. Kiri: card soal dengan "Soal No. X", badge "PILIHAN GANDA", teks soal (rumus sederhana pakai sup/sub/monospace), opsi A-D sebagai card klik (terpilih = border biru + background biru muda), tombol "Tandai Ragu-ragu", "← Soal Sebelumnya" (outline), "Simpan & Lanjut →" (primary).
- Kanan: card "Navigasi Soal" dengan grid 5 kolom nomor soal (dijawab = biru, belum = putih, ragu-ragu = kuning, aktif = ring indigo), legenda dengan jumlah, tombol "Akhiri Ujian" (outline merah) + modal konfirmasi yang menyebut jumlah soal belum dijawab. Mobile: navigasi jadi bottom sheet.
- Timer berbasis waktu_selesai dari server (tahan refresh); habis = kirim otomatis. Jawaban disimpan di state + sessionStorage, dikirim saat selesai. Peringatan beforeunload. Kalau sudah dikirim, tidak bisa masuk lagi. Kunci jawaban tidak pernah dikirim ke client. Setelah kirim tampilkan hasil ringkas + tombol kembali.

2) TUGAS /siswa/tugas (gambar 5):
- PageHeader "Tugas Pembelajaran" (di gambar masih tertulis "Asesmen Pembelajaran", ABAIKAN). Menu aktif sidebar = Tugas.
- Toolbar hanya: pencarian + dropdown "Pilih Pelajaran".
- Grid card: badge pelajaran, judul, tenggat (merah bila lewat), status. BELUM = "Kerjakan Sekarang →" ke /siswa/tugas/[id]; SUDAH = tombol hijau "Selesai" (+ nilai bila ada); lewat tenggat = badge TERLAMBAT.

3) MENGERJAKAN TUGAS /siswa/tugas/[id] (gambar 6):
- Breadcrumb di bawah navbar: "Tugas Pembelajaran > {Pelajaran} > {Judul}".
- Header: badge "TUGAS INDIVIDU", tenggat merah, judul, "Oleh: {guru} • {pelajaran} • {kelas}", kotak "Bobot Nilai {x}%".
- Card "Instruksi Tugas" (isi soal/instruksi dari guru, daftar Kriteria Penilaian, info box biru tentang format & ukuran, tombol unduh lampiran bila ada).
- Card "Area Pengumpulan": dropzone drag & drop + tombol "Pilih File", format .zip .rar .pdf maks 10MB (validasi + pesan error), chip file terpilih dengan tombol hapus, progres unggah, textarea "Catatan untuk Pengajar (Opsional)", tombol "Batal" dan "Kumpulkan Tugas" (disabled sampai ada file, loading, kirim multipart/form-data, sukses lalu toast dan kembali ke daftar).
- Bila sudah dikumpulkan: tampilkan status, nama file, waktu kirim, nilai & komentar; boleh "Ganti File" sebelum tenggat.

4) PROFILE /siswa/profile (gambar 7):
- PageHeader "Profil Saya" + "Kelola informasi pribadi dan data akademik Anda."
- Kiri: card dengan header gradasi lavender, foto bulat besar, nama/username, badge "Siswa" dan "Kelas {kelas}", tombol "Edit Profil".
- Kanan: card "Data Akademik" (Nama Lengkap, NISN, Kelas, Jurusan, read-only) dan card "Informasi Kontak" (Email Institusi). Data asli dari API, kosong tampil "-".
- "Edit Profil" membuka modal: ganti foto (JPG/PNG maks 2MB, preview), nomor HP, ubah password opsional. Simpan lewat API, perbarui user di storage, toast sukses.

Di akhir: npm run build lolos, git diff --stat tidak menyentuh file admin, ringkas hasilnya.
