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

### Deploy ke Railway (singkat)

Railway is a simple platform to host both the Node.js app and a managed MySQL database. Use these steps to deploy the project and its database on Railway:

1. Create an account at https://railway.app and connect your GitHub repository.
2. In Railway create a new project and link the repository. Railway can build the app automatically from your repository.
3. Provision a managed MySQL database from Railway's plugin/add-on marketplace (within the same project). After provisioning, Railway exposes connection details (host, port, user, password, database).
4. Set the required environment variables in Railway's project settings (or via the Railway CLI):
  - DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
  - PORT (optional; Railway will provide one at runtime; app already falls back to process.env.PORT || 3000)
  - CSV_PATH (optional) — note: Railway's filesystem is ephemeral; prefer storing records in MySQL or an external object storage if persistence is required.
5. Ensure `package.json` has a `start` script (this project uses `server.js` so `"start": "node server.js"` is correct).
6. Deploy: trigger a deploy from Railway (it will run the build and start the app). Use the Railway dashboard to view logs and the assigned public URL.

Notes and best practices on Railway
- Railway offers an ephemeral container filesystem — writing to `data/records.csv` will not persist across redeploys or container restarts. Rely on the managed MySQL database for persistent records and implement on-demand CSV export if you need downloadable CSVs in production.
- When you provision MySQL through Railway, copy the provided credentials into environment variables rather than hardcoding them.
- To run locally with Railway-provided variables, use the Railway CLI (`railway run` or `railway link`) or copy environment values into a local `.env` file.

Quick environment-variable mapping example (Railway-provided values):

```
DB_HOST=your-db-host.railway.app
DB_PORT=3306
DB_USER=railway_user
DB_PASS=railway_password
DB_NAME=railway_db
PORT=3000
CSV_PATH=data/records.csv  # optional; not persistent on Railway
```

Troubleshooting
- Check Railway logs for startup errors (DB connection failures, missing env vars).
- If `ensureTable()` fails at startup, verify the DB credentials and that the Railway MySQL plugin is healthy.


Tabel akan dibuat otomatis saat server berjalan. CSV akan disimpan di `data/records.csv`.

Shapes yang didukung:
- persegi (luas)
- segitiga (luas)
- lingkaran (luas)
- kubus (volume)
- limas (volume) - diasumsikan alas persegi
- tabung (volume)

Catatan: field parameter akan disimpan sebagai JSON.