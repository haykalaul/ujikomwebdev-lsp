Postman collection: SITUNGBA API

Files:
- SITUNGBA.postman_collection.json  - import ke Postman untuk mengakses dua endpoint:
  - GET /api/csv-info  -> informasi file CSV (exists, size, mtime, rows)
  - GET /health        -> health check { ok: true }

Cara impor ke Postman:
1. Buka Postman -> File -> Import -> pilih file `postman/SITUNGBA.postman_collection.json`.
2. Setelah impor, pilih environment atau langsung jalankan request. Pastikan server berjalan di `http://localhost:3000`.

Contoh quick-test menggunakan curl (PowerShell / cmd):

curl http://localhost:3000/health
curl http://localhost:3000/api/csv-info

Notes:
- Jika server berjalan di host/port berbeda, edit URL di Postman setelah impor.
- Contoh response disertakan di collection sebagai referensi.
