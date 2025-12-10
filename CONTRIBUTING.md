# Berkontribusi untuk SITUNGBA

Terima kasih atas ketertarikan Anda untuk berkontribusi. File ini menjelaskan bagaimana cara melaporkan masalah, mengusulkan perubahan, dan mengirimkan kode agar pengelola dapat meninjau dan menggabungkannya secara efisien.

## Kode Etik
Bersikaplah hormat dan konstruktif. Pelecehan atau perilaku diskriminatif tidak akan ditoleransi. Ikuti etika sumber terbuka yang umum dalam diskusi dan ulasan.

## Memulai (lokal)
Prasyarat: Node.js (LTS), npm, MySQL (atau yang kompatibel), Git.
1. Garpu repositori dan klon:
 git clone https://github.com/haykalaul/ujikomwebdev-lsp
2. Salin env dan instal:
   cp .env.example .env
 npm install
3. Siapkan basis data (buat DB, perbarui .env), lalu jalankan migrasi/perbanyakan jika tersedia.
4. Mulai server dev:
 npm run dev

Sesuaikan langkah-langkah dengan lingkungan Anda (Laragon, Docker, dll.).

## Alur Kerja & Percabangan
- Buat cabang per perubahan: feat/<deskripsi singkat>, fix/<deskripsi singkat>, chore/<deskripsi singkat>.
- Rujuk sebuah isu dalam nama cabang atau PR (misalnya, feat/#42-tambahkan-form-validasi).
- Jaga agar PR tetap kecil dan fokus.

## Masalah & Permintaan Tarik
- Buka sebuah isu untuk mendiskusikan perubahan besar sebelum diimplementasikan.
- Daftar periksa PR:
  - Tautkan isu terkait (jika ada).
  - Berikan deskripsi dan alasan singkat.
  - Sertakan langkah-langkah untuk mereproduksi/menguji.
  - Tambahkan tangkapan layar jika UI berubah.
  - Pastikan serat kode dan build.

## Pesan komit
Gunakan gaya Komit Konvensional:
- feat: tambahkan fitur baru
- fix: perbaikan bug
- docs: perubahan hanya untuk dokumentasi
Contoh:
 feat(form): memvalidasi bidang yang wajib diisi

## Gaya & Kualitas
- Ikuti pola kode yang sudah ada (Express + EJS, gaya JS/Node).
- Jalankan linters/pemformat (ESLint/Prettier) jika dikonfigurasi.
- Tambahkan tes untuk logika baru jika diperlukan.

## Pengujian
Jalankan skrip pengujian jika ada:
 npm test
Jika tidak ada pengujian, tambahkan pengujian unit untuk logika inti jika memungkinkan.

## Keamanan
Jangan membuka isu publik untuk kerentanan keamanan. Hubungi pengelola secara pribadi (gunakan kontak pengelola repositori atau kebijakan keamanan proyek).

## Perjanjian Lisensi & Kontribusi
Dengan mengirimkan PR, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah lisensi repositori. Pastikan Anda memiliki hak untuk mengirimkan kode yang Anda kontribusikan.

Terima kasih telah membantu mengembangkan SITUNGBA. Kontribusi kecil yang terdokumentasi dengan baik akan sangat dihargai.