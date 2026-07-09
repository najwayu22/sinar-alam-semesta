# Skrip Pembuatan Database MySQL - Sinar Alam Semesta

Skrip SQL di bawah ini dirancang khusus agar siap Anda salin (*copy-paste*) ke dalam klien MySQL pilihan Anda, seperti **phpMyAdmin, MySQL Workbench, Laragon, dbeaver, maupun MySQL Command Line Interface (CLI)**.

---

## 1. Perintah SQL Pembuatan Database dan Tabel-Tabel Relasional

Salin seluruh perintah berikut untuk membuat skema database lengkap beserta relasi antartabelnya:

```sql
-- ============================================================================
-- SKEMA BASIS DATA: SISTEM PRESENSI SINAR ALAM SEMESTA
-- ============================================================================

-- 1. Membuat Database Baru (jika belum ada)
CREATE DATABASE IF NOT EXISTS sinar_alam_semesta 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Gunakan database yang baru saja dibuat
USE sinar_alam_semesta;

-- ============================================================================
-- 1. TABEL: USERS (Penyimpan Akun Terautentikasi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  department VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. TABEL: ATTENDANCE (Log Riwayat Presensi Masuk, Pulang, dan Lembur)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(50) NOT NULL,
  userId VARCHAR(50) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  clockIn TIME DEFAULT NULL,
  clockOut TIME DEFAULT NULL,
  clockInStatus ENUM('early', 'late') DEFAULT NULL,
  overtimeMinutes INT NOT NULL DEFAULT 0,
  status ENUM('present', 'sick', 'on_leave', 'absent') NOT NULL DEFAULT 'present',
  notes VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_attendance_userId (userId),
  CONSTRAINT fk_attendance_userId 
    FOREIGN KEY (userId) 
    REFERENCES users (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. TABEL: LEAVE_REQUESTS (Pencatatan Berkas Pengajuan Cuti Karyawan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(50) NOT NULL,
  userId VARCHAR(50) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL,
  approvedBy VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_leaves_userId (userId),
  CONSTRAINT fk_leaves_userId 
    FOREIGN KEY (userId) 
    REFERENCES users (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. TABEL: NOTIFICATIONS (Sistem Informasi dan Pemberitahuan Akun)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) NOT NULL,
  userId VARCHAR(50) NOT NULL,
  message VARCHAR(255) NOT NULL,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY fk_notifications_userId (userId),
  CONSTRAINT fk_notifications_userId 
    FOREIGN KEY (userId) 
    REFERENCES users (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. Skrip Seed Data Awal (Karyawan, Admin, dan Riwayat)

Jalankan perintah pengisian data awal berikut setelah pembuatan tabel agar database Anda terisi dengan entitas teruji bawaan:

```sql
-- ============================================================================
-- INSERSI DATA AWAL (SEED DATA SET)
-- ============================================================================

-- A. Inisialisasi Akun Pengguna / Users
INSERT INTO users (id, email, password, name, role, department) VALUES
('u-1', 'admin@sinaralam.com', 'admin123', 'Budi Santoso', 'admin', 'Direksi'),
('u-2', 'andi@sinaralam.com', 'andi123', 'Andi Saputra', 'employee', 'Produksi'),
('u-3', 'citra@sinaralam.com', 'citra123', 'Citra Lestari', 'employee', 'Keuangan'),
('u-4', 'dewi@sinaralam.com', 'dewi123', 'Dewi Kartika', 'employee', 'Operasional');

-- B. Inisialisasi Log Presensi (Contoh Riwayat Teruji)
INSERT INTO attendance (id, userId, employeeName, department, date, clockIn, clockOut, clockInStatus, overtimeMinutes, status, notes) VALUES
('att-seed-may-u-2-1', 'u-2', 'Andi Saputra', 'Produksi', '2026-05-01', '07:49:45', '17:02:44', 'early', 0, 'present', ''),
('att-seed-may-u-3-1', 'u-3', 'Citra Lestari', 'Keuangan', '2026-05-01', '07:54:33', '17:05:10', 'early', 0, 'present', ''),
('att-seed-may-u-4-1', 'u-4', 'Dewi Kartika', 'Operasional', '2026-05-01', '07:49:15', '17:01:25', 'early', 0, 'present', ''),
('att-seed-may-u-2-4', 'u-2', 'Andi Saputra', 'Produksi', '2026-05-04', '07:50:45', '17:42:40', 'early', 42, 'present', ''),
('att-seed-may-u-3-4', 'u-3', 'Citra Lestari', 'Keuangan', '2026-05-04', '07:54:14', '17:05:10', 'early', 0, 'present', ''),
('att-seed-may-u-4-4', 'u-4', 'Dewi Kartika', 'Operasional', '2026-05-04', '07:49:15', '17:01:25', 'early', 0, 'present', ''),
('att-seed-may-u-2-5', 'u-2', 'Andi Saputra', 'Produksi', '2026-05-05', '07:52:45', '17:02:11', 'early', 0, 'present', ''),
('att-seed-may-u-3-5', 'u-3', 'Citra Lestari', 'Keuangan', '2026-05-05', '07:54:50', '17:05:10', 'early', 0, 'present', ''),
('att-seed-may-u-4-5', 'u-4', 'Dewi Kartika', 'Operasional', '2026-05-05', NULL, NULL, NULL, 0, 'sick', 'Sakit Demam Flu'),
('att-seed-may-u-2-6', 'u-2', 'Andi Saputra', 'Produksi', '2026-05-06', '07:53:45', '17:02:18', 'early', 0, 'present', ''),
('att-seed-may-u-3-6', 'u-3', 'Citra Lestari', 'Keuangan', '2026-05-06', '07:54:19', '17:05:10', 'early', 0, 'present', ''),
('att-seed-may-u-4-6', 'u-4', 'Dewi Kartika', 'Operasional', '2026-05-06', '07:49:15', '17:01:25', 'early', 0, 'present', ''),
('att-seed-may-u-4-11', 'u-4', 'Dewi Kartika', 'Operasional', '2026-05-11', '08:05:40', '17:01:25', 'late', 0, 'present', ''),
('att-seed-may-u-3-12', 'u-3', 'Citra Lestari', 'Keuangan', '2026-05-12', NULL, NULL, NULL, 0, 'on_leave', 'Cuti Tahunan (Disetujui)');

-- C. Inisialisasi Pengajuan Cuti / Leaves
INSERT INTO leave_requests (id, userId, employeeName, department, startDate, endDate, reason, status, createdAt, approvedBy) VALUES
('leave-1', 'u-3', 'Citra Lestari', 'Keuangan', '2026-05-12', '2026-05-14', 'Ada acara keluarga di luar kota', 'approved', '2026-05-10 02:15:30', 'Budi Santoso'),
('leave-2', 'u-2', 'Andi Saputra', 'Produksi', '2026-06-15', '2026-06-17', 'Urusan keluarga mendesak', 'pending', '2026-06-01 08:00:00', NULL);

-- D. Inisialisasi Sistem Notifikasi Berjalan
INSERT INTO notifications (id, userId, message, isRead, createdAt) VALUES
('notif-1', 'u-3', 'Pengajuan cuti Anda dari tanggal 2026-05-12 s/d 2026-05-14 telah DISETUJUI oleh Budi Santoso.', 1, '2026-05-11 09:00:00');
```

---

## 3. Catatan dan Petunjuk Penting SQL

1. **Foreign Key Integrity:** 
   Opsi `ON DELETE CASCADE` diatur pada tabel `attendance`, `leave_requests`, dan `notifications`. Artinya, bila sebuah akun user dihapus dari tabel `users`, seluruh log dan dokumen riwayat milik user tersebut di semua tabel relasional akan dibersihkan secara otomatis oleh database MySQL. Hal ini menjamin konsistensi data.
2. **Format Waktu & Tanggal:**
   * Tanggal menggunakan format standar standar SQL `YYYY-MM-DD`.
   * Jam presensi masuk/pulang disimpan menggunakan format tipe `TIME` (`HH:MM:SS`) untuk akurasi durasi kerja.
3. **Indeksasi:**
   Tabel di atas dilengkapi dengan indeks eksternal pada kolom `userId` guna memastikan kueri relasional `JOIN` atau filter data presensi berdasarkan karyawan tetap memiliki performa yang sangat cepat, bahkan setelah database menampung ribuan log harian.
