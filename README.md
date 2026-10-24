# Looma

Looma adalah aplikasi kreatif untuk membuat dan membagikan karya, menemukan kreator lain, dan ikut tantangan harian. Aplikasi dibuat dengan Expo dan React Native, dengan backend FastAPI serta database SQL.

## Fitur

- Feed karya yang juga terhubung dengan tab unggahan di profil.
- Studio untuk menulis, menggambar, membuat papan ide, dan mengerjakan tantangan Truth or Dare.
- Draf yang dapat dibuka kembali, dilanjutkan, lalu diposting.
- Profil kreator, pencarian dan saran kreator dari database, serta leaderboard.
- Like, simpan, komentar, balasan, dan pin komentar oleh pemilik postingan.
- Antarmuka bahasa Indonesia dan Inggris.

## Teknologi

- Expo SDK 57, Expo Router, React Native 0.86, dan React 19.
- React Native Web dan NativeWind untuk antarmuka web.
- FastAPI, SQLAlchemy, dan MySQL atau SQLite untuk backend dan penyimpanan data.

## Menjalankan aplikasi

Pastikan Node.js dan Python tersedia.

### 1. Pasang dependensi aplikasi

```bash
npm ci
```

### 2. Pasang dependensi backend

Buat virtual environment, lalu pasang paket backend:

```bash
python -m venv .venv
```

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

macOS atau Linux:

```bash
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

### 3. Jalankan backend

Dari folder utama proyek:

```bash
python -m uvicorn main:app --reload --port 8001 --app-dir backend
```

Backend membuat tabel saat pertama kali dijalankan. Dokumentasi API tersedia di [http://localhost:8001/docs](http://localhost:8001/docs).

### 4. Jalankan aplikasi

Untuk web:

```bash
npm run web
```

Untuk development server Expo:

```bash
npm start
```

Pilih Android atau iOS dari terminal Expo, atau gunakan `npm run android` / `npm run ios`.

## Database

Backend mencoba menghubungkan ke MySQL terlebih dahulu. Atur environment variable berikut bila memakai MySQL:

| Variable | Default |
| --- | --- |
| `MYSQL_USER` | `root` |
| `MYSQL_PASSWORD` | kosong |
| `MYSQL_HOST` | `localhost` |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DB` | `looma` |

Jika koneksi MySQL gagal, backend memakai SQLite di `backend/looma.db`. Jangan hapus file tersebut jika ingin mempertahankan data lokal.

## Perintah proyek

```bash
npm run lint       # Expo lint
npx tsc --noEmit   # TypeScript check
```

## Catatan pengembangan

- File route Expo Router ada di `src/app/`; komponen dan studio ada di `src/components/`.
- Backend ada di `backend/main.py`; daftar dependensinya ada di `backend/requirements.txt`.
- Aplikasi saat ini memanggil API melalui `http://localhost:8001`. Untuk menguji dari perangkat fisik, alamat API perlu mengarah ke alamat jaringan komputer yang menjalankan backend.
