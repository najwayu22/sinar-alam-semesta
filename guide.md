# Petunjuk Setup Mandiri Project Presensi Sinar Alam Semesta di Localhost

Panduan ini dirancang untuk membantu Anda melakukan setup (*bootstrapping*) dan menjalankan aplikasi **Sistem Presensi Karyawan Sinar Alam Semesta** secara mandiri di komputer lokal (localhost) Anda, baik menggunakan sistem operasi Windows, macOS, maupun Linux.

---

## 1. Persiapan Awal (Prasyarat Sistem)

Sebelum memulai, pastikan komputer Anda sudah terinstal beberapa peralatan (*software*) berikut:

1. **Node.js (Versi LTS direkomendasikan, minimal v18+)**
   * Berfungsi sebagai runtime Javascript di server lokal Anda.
   * Unduh di [nodejs.org](https://nodejs.org/).
   * Verifikasi instalasi dengan menjalankan perintah ini di Command Prompt/Terminal/PowerShell:
     ```bash
     node -v
     npm -v
     ```

2. **Git (Opsional - sangat direkomendasikan)**
   * Berfungsi jika Anda mengunduh project melalui github repository.
   * Unduh di [git-scm.com](https://git-scm.com/).

3. **Code Editor**
   * Gunakan editor modern seperti **Visual Studio Code (VS Code)** yang dapat diunduh di [code.visualstudio.com](https://code.visualstudio.com/).

4. **Sistem Database Mandiri (Opsional untuk integrasi MySQL)**
   * Secara bawaan (*default*), aplikasi ini dibuat modular dan instan. Backend Node.js Express menggunakan sistem manajemen data file JSON (`database.json`) yang interaktif dan **langsung berfungsi otomatis tanpa membutuhkan database eksternal**.
   * Jika Anda ingin memigrasikan atau mengembangkan aplikasi ini ke MySQL Server, Anda bisa menyiapkan:
     * **XAMPP / Laragon (Disarankan di Windows)** yang berisi MySQL Server dan phpMyAdmin.
     * Atau menginstal MySQL Server secara mandiri.

---

## 2. Cara Mengunduh & Mengekspor Project dari AI Studio

Untuk memindahkan project dari Google AI Studio ke komputer Anda, ikuti langkah berikut:

1. Buka workspace project Anda di **Google AI Studio**.
2. Klik tombol menu **Ekspor (Export)** di pojok kanan atas layar atau buka opsi menu pengaturan workspace.
3. Pilih opsi **Download as ZIP (Unduh sebagai ZIP)** untuk mengunduh semua berkas source code ke komputer Anda.
4. Atau pilih opsi **Export to GitHub** jika Anda ingin memasukkannya ke akun GitHub pribadi Anda terlebih dahulu, kemudian meng-clone repositori tersebut ke lokal menggunakan perintah:
   ```bash
   git clone <URL_REPOS_ANDA>
   ```
5. Ekstrak file ZIP yang sudah terunduh ke dalam suatu folder kerja lokal, misalnya `C:\Project\sinar-alam-semesta` atau `/Documents/sinar-alam-semesta`.

---

## 3. Struktur Direktori Utama Project

Berikut adalah peta struktur berkas utama yang perlu Anda kenali setelah mengekstrak folder:

```text
├── .env.example            # Templat konfigurasi lingkungan (environment variables)
├── package.json            # Daftar dependencies NPM, libs, dan script eksekusi
├── server.ts               # Core Backend Server (Express + API Endpoints + database.json controller)
├── database.json           # File database JSON lokal (Otomatis terbuat jika belum ada)
├── index.html              # Entrypoint HTML File untuk bundler Vite
├── vite.config.ts          # Konfigurasi plugin React dan routing bundler Vite
├── tsconfig.json           # Konfigurasi compiler TypeScript
├── src/                    # Folder Source Code Frontend (React + TypeScript)
│   ├── main.tsx            # Entrypoint TypeScript Client
│   ├── index.css           # Styling Global dengan Tailwind CSS
│   ├── App.tsx             # Pengendali rute utama UI (Login, Dashboard Karyawan, Dashboard Admin)
│   ├── types.ts            # Definisi Type Safety TypeScript
│   └── components/         # Komponen UI Modular
│       ├── Login.tsx              # Halaman login otentikasi JWT
│       ├── DashboardKaryawan.tsx  # Beranda interaktif karyawan (Absen, history, cuti)
│       └── DashboardAdmin.tsx     # Panel kontrol administrator & manajemen user
```

---

## 4. Langkah-Langkah Mengaktifkan Aplikasi di Localhost

Ikuti langkah demi langkah di bawah ini menggunakan Terminal (macOS/Linux) atau Command Prompt/PowerShell (Windows):

### Langkah A: Membuka Folder Project di VS Code
1. Buka VS Code di komputer Anda.
2. Klik **File -> Open Folder...** lalu pilih folder ekstraksi project Anda.
3. Buka Terminal terintegrasi di VS Code dengan menekan tombol kombinasi `Ctrl + ` ` ` (backtick) atau melalui menu **Terminal -> New Terminal** di bar atas.

### Langkah B: Instalasi Dependensi NPM
Instal semua package dan pustaka (*libraries*) yang dibutuhkan oleh aplikasi dengan menjalankan perintah berikut di terminal:
```bash
npm install
```
*Proses ini akan mengunduh seluruh package (seperti React, Express, Vite, Tailwind CSS, Lucide, dll.) dan menyimpannya di dalam folder otomatis bernama `node_modules`.*

### Langkah C: Membuat Berkas Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi contoh `.env.example` menjadi file konfigurasi aktif bernama `.env`:

* **Di Linux/macOS:**
  ```bash
  cp .env.example .env
  ```
* **Di Windows (PowerShell):**
  ```powershell
  copy .env.example .env
  ```

Buka file `.env` baru tersebut, lalu isi konfigurasinya seperti di bawah ini untuk localhost:
```env
# Port server yang akan diakses di browser (default port development: 3000)
PORT=3000

# JSON Web Token Secret Key untuk keamanan enkripsi sesi login
JWT_SECRET="kunci-rahasia-jwt-pilihan-anda-12345"

# Google Gemini API Key jika Anda mengaktifkan kecerdasan buatan (AI) di backend
GEMINI_API_KEY="ISI_DENGAN_GEMINI_API_KEY_ANDA_JIKA_ADA"

# URL Utama Aplikasi lokal Anda
APP_URL="http://localhost:3000"
```

---

## 5. Menjalankan Aplikasi di Mode Pengembangan (Development Mode)

Guna memulai server lokal dalam mode pengembangan, eksekusi perintah berikut:
```bash
npm run dev
```

Anda akan melihat log keluaran terminal seperti berikut:
```text
> tsx server.ts
Server running on http://localhost:3000
```

1. Buka browser web Anda (Chrome, Edge, Firefox, dll.).
2. Akses alamat URL berikut: **`http://localhost:3000`**
3. Sistem login akan muncul secara instan, dan siap digunakan!

### Akun Bawaan Sasaran Pengujian awal
Gunakan detail akun awal di bawah ini yang diambil dari database rujukan (`database.json`):

* **Akses Administrator:**
  * **Email:** `admin@sinaralam.com`
  * **Password:** `admin123`
* **Akses Karyawan:**
  * **Email:** `andi@sinaralam.com` atau `citra@sinaralam.com` atau `dewi@sinaralam.com`
  * **Password:** `andi123` (password untuk Andi), `citra123` (Citra), atau `dewi123` (Dewi)

---

## 6. Menjalankan Aplikasi di Mode Produksi (Production Build)

Jika Anda ingin melakukan uji coba performa tinggi atau mendeploy aplikasi ini ke VPS/Cloud Server mandiri Anda, lakukan build produksi:

1. Compile source code TypeScript menjadi bundel JavaScript yang ringan & optimal:
   ```bash
   npm run build
   ```
2. Jalankan aplikasi dalam status produksi:
   ```bash
   npm start
   ```
Server akan berjalan secara optimal dan melayani request di port 3000 dengan konsumsi memori yang minimum.

---

## 7. Rujukan Migrasi Database ke Server MySQL

Secara default, project ini menggunakan file `database.json` sebagai server basis datanya demi membebaskan Anda dari kebutuhan mengonfigurasi DBMS lokal yang rumit. 

Namun, jika Anda ingin memigrasikan database tersebut ke MySQL nyata, Anda bisa mengikuti referensi ini:

1. Jalankan perintah SQL yang ada pada berkas **`command.md`** di MySQL Server Anda (bisa melalui phpMyAdmin atau MySQL cli terminal). Perintah tersebut akan membuat database, tabel relasional, serta data contoh awal.
2. Di dalam file **`server.ts`**, Anda dapat memodifikasi pemanggilan baca-tulis file yang saat ini menggunakan library bawaan `fs`:
   - Ganti fungsi utilitas pembacaan `readDb()` dan penyuntingan `saveDb(db)` dengan kueri database.
   - Gunakan paket driver seperti **`mysql2`** atau ORM seperti **`Prisma`** atau **`Sequelize`** untuk mengeksekusi sintaks `SELECT`, `INSERT`, dan `DELETE` ke database MySQL Anda.

*Contoh modifikasi file di backend untuk mengintegrasikan MySQL:*
```typescript
// 1. Install driver mysql
// npm install mysql2

// 2. Buat koneksi pool di server.ts:
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sinar_alam_semesta',
  waitForConnections: true,
  connectionLimit: 10
});

// 3. Contoh mengubah endpoint GET /api/users di server.ts:
app.get('/api/users', authenticateToken, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, department FROM users');
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data dari MySQL.' });
  }
});
```

Aplikasi Sistem Presensi Sinar Alam Semesta Anda kini sepenuhnya siap diaktifkan dan dapat dioperasikan secara lokal! Jika ada kendala, hubungi pengembang sistem presensi ini atau periksa kembali keakuratan versi Node.js Anda.
