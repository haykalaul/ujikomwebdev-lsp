# Aplikasi Hitung Luas & Volume Siswa SD

Merupakan tugas praktik dari Uji Kompetensi Junior Web Program di LSP - Aplikasi sederhana Node.js + Express untuk siswa menghitung luas dan volume bangun datar/ruang, menyimpan hasil ke CSV dan MySQL, serta menampilkan dashboard statistik.

Persyaratan:
- Node.js 14+
- Express JS
- MySQL

## 📸 Screenshot

![Screenshot](public/hero2.png)

## Setup singkat

1. Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi database.
2. Buat database di MySQL sesuai `DB_NAME`.
3. Jalankan `npm install` lalu `npm start`.
4. Tabel akan dibuat otomatis saat server berjalan. CSV akan disimpan di `data/records.csv`.

Catatan penting untuk deployment: pada layanan serverless (seperti Vercel), penyimpanan file lokal bersifat sementara/ephemeral — file CSV yang ditulis ke disk tidak akan bertahan. Untuk deployment production, sarankan menggunakan MySQL (atau penyimpanan eksternal seperti S3) untuk menyimpan rekor.

### Deploy ke Vercel (singkat)

1. Buat akun di https://vercel.com dan hubungkan repository GitHub/GitLab/Bitbucket.
2. Saat mengimpor project, atur Environment Variables di dashboard Vercel agar sesuai dengan `.env` Anda:
   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, dan variabel lain yang diperlukan.
3. Karena aplikasi menggunakan Express (server Node.js), Anda dapat deploy sebagai fungsi serverless dengan konfigurasi sederhana. Tambahkan file `vercel.json` di root proyek (contoh di bawah). Jika entry point Anda bernama `index.js` atau `server.js`, sesuaikan nama file di konfigurasi.
4. Perhatikan bahwa penyimpanan file lokal (mis. `data/records.csv`) tidak persisten di Vercel. Untuk menyimpan CSV di deployment production, gunakan:
   - Penyimpanan eksternal seperti AWS S3 / DigitalOcean Spaces, atau
   - Simpan rekor sepenuhnya di MySQL dan buat export CSV saat diminta (mis. generate CSV on-demand dan kirim sebagai response/download).
5. Setelah konfigurasi selesai, deploy melalui tombol "Deploy" di Vercel atau push ke branch yang dipantau.

Contoh `vercel.json` (sesuaikan entry file):
```json
{
  "version": 2,
  "builds": [
    { "src": "index.js", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "index.js" }
  ]
}
```

Tips tambahan:
- Pastikan script `start` di `package.json` menjalankan server (contoh: `"start": "node index.js"`).
- Atur variabel PORT dari environment (Vercel menyediakan port runtime) atau biarkan Express fallback ke process.env.PORT || 3000.
- Untuk debugging build di Vercel, lihat logs di dashboard deployment.

Tabel akan dibuat otomatis saat server berjalan. CSV akan disimpan di `data/records.csv`.

Shapes yang didukung:
- persegi (luas)
- segitiga (luas)
- lingkaran (luas)
- kubus (volume)
- limas (volume) - diasumsikan alas persegi
- tabung (volume)

Catatan: field parameter akan disimpan sebagai JSON. Jika Anda ingin menambah validasi atau fitur export lebih lanjut, saya bisa bantu.
