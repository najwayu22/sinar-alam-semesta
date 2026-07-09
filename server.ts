import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

// ============================================================================
// MYSQL DATABASE DDL SCHEMA (Untuk implementasi di server MySQL produksi)
// ============================================================================
/*
CREATE DATABASE IF NOT EXISTS sinar_alam_semesta;
USE sinar_alam_semesta;

-- 1. Tabel Users
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL,
  department VARCHAR(100) NOT NULL
);

-- 2. Tabel Attendance
CREATE TABLE attendance (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  clockIn TIME DEFAULT NULL,
  clockOut TIME DEFAULT NULL,
  clockInStatus ENUM('early', 'late') DEFAULT NULL,
  overtimeMinutes INT DEFAULT 0,
  status ENUM('present', 'sick', 'on_leave', 'absent') DEFAULT 'present',
  notes VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabel Leave Requests
CREATE TABLE leave_requests (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  createdAt DATETIME NOT NULL,
  approvedBy VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tabel Notifications
CREATE TABLE notifications (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  message VARCHAR(255) NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- SEED DATA AWAL:
INSERT INTO users (id, email, password, name, role, department) VALUES
('u-1', 'admin@sinaralam.com', 'admin123', 'Budi Santoso', 'admin', 'Management'),
('u-2', 'andi@sinaralam.com', 'andi123', 'Andi Saputra', 'employee', 'Produksi'),
('u-3', 'citra@sinaralam.com', 'citra123', 'Citra Lestari', 'employee', 'Keuangan'),
('u-4', 'dewi@sinaralam.com', 'dewi123', 'Dewi Kartika', 'employee', 'Operasional');
*/

const DB_FILE = path.join(process.cwd(), 'database.json');
const JWT_SECRET = process.env.JWT_SECRET || 'sinar-alam-semesta-super-secret-key-2026';

// Helper to get formatted local time in UTC+8 timezone
function getUTC8TimeComponents() {
  const d = new Date();
  const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
  // Shift by 8 hours
  const witaTime = new Date(utcTime + (3600000 * 8));

  const year = witaTime.getFullYear();
  const month = String(witaTime.getMonth() + 1).padStart(2, '0');
  const date = String(witaTime.getDate()).padStart(2, '0');

  const hours = String(witaTime.getHours()).padStart(2, '0');
  const minutes = String(witaTime.getMinutes()).padStart(2, '0');
  const seconds = String(witaTime.getSeconds()).padStart(2, '0');

  return {
    dateString: `${year}-${month}-${date}`, // YYYY-MM-DD
    timeString: `${hours}:${minutes}:${seconds}`, // HH:MM:SS
    hours: witaTime.getHours(),
    minutes: witaTime.getMinutes(),
    rawDate: witaTime
  };
}

// Generate seeded database file if it does not exist
function initializeDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      JSON.parse(data);
      return;
    } catch (e) {
      console.error('Error parsing old database, recreating...');
    }
  }

  const defaultUsers = [
    { id: 'u-1', email: 'admin@sinaralam.com', password: 'admin123', name: 'Budi Santoso', role: 'admin', department: 'Direksi' },
    { id: 'u-2', email: 'andi@sinaralam.com', password: 'andi123', name: 'Andi Saputra', role: 'employee', department: 'Produksi' },
    { id: 'u-3', email: 'citra@sinaralam.com', password: 'citra123', name: 'Citra Lestari', role: 'employee', department: 'Keuangan' },
    { id: 'u-4', email: 'dewi@sinaralam.com', password: 'dewi123', name: 'Dewi Kartika', role: 'employee', department: 'Operasional' }
  ];

  // Let's generate rich attendance mock logs for the previous month (Mei 2026) and current month (Juni 2026)
  // this satisfies the requirement: "grafik analitik kinerja kehadiran bulanan bagi manajemen"
  const attendanceLogs: any[] = [];
  const employees = defaultUsers.filter(u => u.role === 'employee');

  // Generating mock history for May 2026 (Days 1 to 28, excluding weekends)
  for (let d = 1; d <= 28; d++) {
    const dayOfWeek = new Date(2026, 4, d).getDay(); // May is index 4
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
    const dateStr = `2026-05-${String(d).padStart(2, '0')}`;

    employees.forEach((emp, index) => {
      // Create interesting differences
      // Employee 1 (Andi): Mostly early, sometimes late, sometimes overtime
      // Employee 2 (Citra): Standard early, has a leave
      // Employee 3 (Dewi): Mostly early, sometimes sick

      // Random state
      let status: 'present' | 'sick' | 'on_leave' | 'absent' = 'present';
      let clockIn: string | null = null;
      let clockOut: string | null = null;
      let clockInStatus: 'early' | 'late' | null = null;
      let overtimeMinutes = 0;
      let notes = '';

      if (emp.id === 'u-2') { // Andi
        const isLate = Math.random() < 0.15;
        if (isLate) {
          clockIn = `08:${String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')}:12`;
          clockInStatus = 'late';
        } else {
          clockIn = `07:${String(Math.floor(Math.random() * 20) + 35).padStart(2, '0')}:45`;
          clockInStatus = 'early';
        }

        const isOvertime = Math.random() < 0.6; // High overtime
        if (isOvertime) {
          const overtimeDur = Math.floor(Math.random() * 120) + 15; // 15 to 135 mins
          const otHours = 17 + Math.floor(overtimeDur / 60);
          const otMins = overtimeDur % 60;
          clockOut = `${String(otHours).padStart(2, '0')}:${String(otMins).padStart(2, '0')}:40`;
          overtimeMinutes = overtimeDur;
        } else {
          clockOut = `17:02:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
        }
      } else if (emp.id === 'u-3') { // Citra
        // Citra was on leave on May 12-14
        if (d >= 12 && d <= 14) {
          status = 'on_leave';
          notes = 'Cuti Tahunan (Disetujui)';
        } else {
          clockIn = `07:54:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
          clockInStatus = 'early';
          clockOut = `17:05:10`;
        }
      } else if (emp.id === 'u-4') { // Dewi
        // Dewi was sick on May 5
        if (d === 5) {
          status = 'sick';
          notes = 'Sakit Demam Flu';
        } else {
          const isLate = Math.random() < 0.05;
          if (isLate) {
            clockIn = '08:05:40';
            clockInStatus = 'late';
          } else {
            clockIn = '07:49:15';
            clockInStatus = 'early';
          }
          clockOut = '17:01:25';
        }
      }

      attendanceLogs.push({
        id: `att-seed-may-${emp.id}-${d}`,
        userId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: dateStr,
        clockIn,
        clockOut,
        clockInStatus,
        overtimeMinutes,
        status,
        notes
      });
    });
  }

  // Same seeds for current month June 2026 up to date=1 (Current local time in app is June 1st, 2026)
  // Let's seed just today or general structure
  const leaveRequests: any[] = [
    {
      id: 'leave-1',
      userId: 'u-3',
      employeeName: 'Citra Lestari',
      department: 'Keuangan',
      startDate: '2026-05-12',
      endDate: '2026-05-14',
      reason: 'Ada acara keluarga di luar kota',
      status: 'approved',
      createdAt: '2026-05-10T02:15:30.000Z',
      approvedBy: 'Budi Santoso'
    },
    {
      id: 'leave-2',
      userId: 'u-2',
      employeeName: 'Andi Saputra',
      department: 'Produksi',
      startDate: '2026-06-15',
      endDate: '2026-06-17',
      reason: 'Urusan keluarga mendesak',
      status: 'pending',
      createdAt: '2026-06-01T08:00:00.000Z'
    }
  ];

  const notifications: any[] = [
    {
      id: 'notif-1',
      userId: 'u-3',
      message: 'Pengajuan cuti Anda dari tanggal 2026-05-12 s/d 2026-05-14 telah DISETUJUI oleh Budi Santoso.',
      isRead: true,
      createdAt: '2026-05-11T09:00:00.000Z'
    }
  ];

  const db = {
    users: defaultUsers,
    attendance: attendanceLogs,
    leaves: leaveRequests,
    notifications
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  console.log('Database initialized successfully with rich mock seed data.');
}

// Read database from file
function readDb(): any {
  if (!fs.existsSync(DB_FILE)) {
    initializeDatabase();
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    initializeDatabase();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  }
}

// Write database to file
function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate default database files right away
initializeDatabase();

// Express app config
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// CORS Middleware — izinkan frontend dari domain berbeda (Netlify)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token otentikasi tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa.' });
    }
    req.user = user;
    next();
  });
}

// API ENDPOINTS

// 1. Auth Login (JWT)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  // Exclude password from token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    message: 'Login berhasil.',
    token,
    user: tokenPayload
  });
});

// 2. Get current session details
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// 3. Employee Clock In / Clock Out status today
app.get('/api/attendance/status', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { dateString } = getUTC8TimeComponents();

  const db = readDb();
  const todayRecord = db.attendance.find((a: any) => a.userId === userId && a.date === dateString);

  res.json({
    date: dateString,
    record: todayRecord || null
  });
});

// 4. Clock In (Absen Masuk)
app.post('/api/attendance/clock-in', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { dateString, timeString, hours } = getUTC8TimeComponents();

  const db = readDb();
  
  // Check if already checked in
  let todayRecord = db.attendance.find((a: any) => a.userId === userId && a.date === dateString);
  if (todayRecord && todayRecord.clockIn) {
    return res.status(400).json({ error: 'Anda sudah melakukan pengisian absensi masuk hari ini.' });
  }

  // Check in logic
  // "absen dimulai dari jam 08:00" -> anything after 08:00 of the day is considered late.
  const isLate = hours >= 8 && (hours > 8 || getUTC8TimeComponents().minutes > 0);
  const clockInStatus = isLate ? 'late' : 'early';

  if (!todayRecord) {
    todayRecord = {
      id: `att-${Date.now()}-${userId}`,
      userId,
      employeeName: req.user.name,
      department: req.user.department,
      date: dateString,
      clockIn: timeString,
      clockOut: null,
      clockInStatus,
      overtimeMinutes: 0,
      status: 'present',
      notes: isLate ? 'Terlambat melakukan absensi' : 'Tepat waktu'
    };
    db.attendance.push(todayRecord);
  } else {
    // If there was an excused/absent status slot pre-created, overwrite with clock-in
    todayRecord.clockIn = timeString;
    todayRecord.clockInStatus = clockInStatus;
    todayRecord.status = 'present';
    todayRecord.notes = isLate ? 'Terlambat melakukan absensi' : 'Tepat waktu';
  }

  saveDb(db);
  res.json({
    message: 'Absensi masuk berhasil direkam.',
    record: todayRecord
  });
});

// 5. Clock Out (Absen Keluar)
app.post('/api/attendance/clock-out', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { dateString, timeString, hours, minutes } = getUTC8TimeComponents();

  const db = readDb();
  
  const todayRecord = db.attendance.find((a: any) => a.userId === userId && a.date === dateString);
  if (!todayRecord || !todayRecord.clockIn) {
    return res.status(400).json({ error: 'Anda harus melakukan pengisian absensi masuk terlebih dahulu sebelum keluar.' });
  }

  if (todayRecord.clockOut) {
    return res.status(400).json({ error: 'Anda sudah melakukan pengisian absensi keluar hari ini.' });
  }

  // Calculate overtime
  // "absen karyawan bisa terhitung lembur jika absensi lebih dari jam 17:00"
  let overtimeMinutes = 0;
  if (hours >= 17) {
    const otMins = (hours - 17) * 60 + minutes;
    overtimeMinutes = otMins > 0 ? otMins : 0;
  }

  todayRecord.clockOut = timeString;
  todayRecord.overtimeMinutes = overtimeMinutes;
  
  if (overtimeMinutes > 0) {
    todayRecord.notes = (todayRecord.notes ? todayRecord.notes + ' & ' : '') + `Lembur ${Math.floor(overtimeMinutes / 60)}j ${overtimeMinutes % 60}m`;
  }

  saveDb(db);
  res.json({
    message: 'Absensi keluar berhasil direkam.',
    record: todayRecord
  });
});

// 6. Get Personal Attendance History (Log)
app.get('/api/attendance/history', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const db = readDb();
  
  const history = db.attendance
    .filter((a: any) => a.userId === userId)
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  res.json({ history });
});

// 7. Get All Leave Requests (User / Admin)
app.get('/api/leaves', authenticateToken, (req: any, res) => {
  const db = readDb();
  let leaves = [];

  if (req.user.role === 'admin') {
    leaves = db.leaves.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  } else {
    leaves = db.leaves
      .filter((l: any) => l.userId === req.user.id)
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  }

  res.json({ leaves });
});

// 8. Submit Online Leave Request (Employee Dashboard)
app.post('/api/leaves', authenticateToken, (req: any, res) => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Semua kolom wajib diisi (tanggal mulai, berakhir, dan alasan).' });
  }

  const db = readDb();
  const newLeave = {
    id: `leave-${Date.now()}`,
    userId: req.user.id,
    employeeName: req.user.name,
    department: req.user.department,
    startDate,
    endDate,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.leaves.push(newLeave);

  // Auto notification to Admin logs if needed, but not required by user.
  saveDb(db);

  res.json({
    message: 'Pengajuan cuti online berhasil dikirim ke atasan.',
    leave: newLeave
  });
});

// 9. Approve or Reject Leave Requests (Admin Only)
// "Sistem harus dilengkapi notifikasi otomatis saat pengajuan cuti disetujui oleh atasan."
app.post('/api/leaves/:id/approve', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang dapat menyetujui pengajuan cuti.' });
  }

  const { id } = req.params;
  const { action } = req.body; // 'approved' | 'rejected'

  if (!action || (action !== 'approved' && action !== 'rejected')) {
    return res.status(400).json({ error: 'Aksi persetujuan tidak valid.' });
  }

  const db = readDb();
  const leaveIndex = db.leaves.findIndex((l: any) => l.id === id);

  if (leaveIndex === -1) {
    return res.status(404).json({ error: 'Pengajuan cuti tidak ditemukan.' });
  }

  const leave = db.leaves[leaveIndex];
  leave.status = action;
  leave.approvedBy = req.user.name;

  // If approved, seed/insert attendance status for employee for those block of dates
  if (action === 'approved') {
    // Generate dates in block
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    
    // Cycle through dates and insert leave status
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dt}`;

      // Check if attendance already exists, if so overwrite, if not push new
      const existingAttIndex = db.attendance.findIndex((a: any) => a.userId === leave.userId && a.date === dateStr);
      const newLeaveAtt = {
        id: `att-${Date.now()}-${leave.userId}-${dateStr}`,
        userId: leave.userId,
        employeeName: leave.employeeName,
        department: leave.department,
        date: dateStr,
        clockIn: null,
        clockOut: null,
        clockInStatus: null,
        overtimeMinutes: 0,
        status: 'on_leave',
        notes: `Cuti Online: ${leave.reason}`
      };

      if (existingAttIndex !== -1) {
        db.attendance[existingAttIndex] = newLeaveAtt;
      } else {
        db.attendance.push(newLeaveAtt);
      }
    }
  }

  // Create notifications automatically to the employee
  const notifMsg = `Pengajuan cuti Anda dari tanggal ${leave.startDate} s/d ${leave.endDate} telah ${action === 'approved' ? 'DISETUJUI ✅' : 'DITOLAK ❌'} oleh ${req.user.name}.`;
  
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: leave.userId,
    message: notifMsg,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDb(db);

  res.json({
    message: `Pengajuan cuti berhasil di-${action === 'approved' ? 'setujui' : 'tolak'}.`,
    leave
  });
});

// 10. Get Employee Notifications
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const db = readDb();
  const userNotifs = db.notifications
    .filter((n: any) => n.userId === req.user.id)
    .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));

  res.json({ notifications: userNotifs });
});

// 11. Mark all notifications as read
app.post('/api/notifications/read-all', authenticateToken, (req: any, res) => {
  const db = readDb();
  db.notifications = db.notifications.map((n: any) => {
    if (n.userId === req.user.id) {
      n.isRead = true;
    }
    return n;
  });

  saveDb(db);
  res.json({ message: 'Semua notifikasi ditandai dibaca.' });
});

// 12. Create manual attendance reports by Admin
// Admin can record sickness "sakit" or permission "izin"
app.post('/api/attendance/manual-absent', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya administrator yang dapat mendaftarkan absensi manual.' });
  }

  const { employeeId, date, status, notes } = req.body;

  if (!employeeId || !date || !status) {
    return res.status(400).json({ error: 'Karyawan, tanggal, dan status wajib ditentukan.' });
  }

  const db = readDb();
  const emp = db.users.find((u: any) => u.id === employeeId);

  if (!emp) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  }

  // Check if there's already attendance for this employee on this date
  const index = db.attendance.findIndex((a: any) => a.userId === employeeId && a.date === date);

  const mockRecord = {
    id: index !== -1 ? db.attendance[index].id : `att-${Date.now()}-${employeeId}`,
    userId: employeeId,
    employeeName: emp.name,
    department: emp.department,
    date,
    clockIn: null,
    clockOut: null,
    clockInStatus: null,
    overtimeMinutes: 0,
    status, // 'sick' | 'on_leave' | 'absent'
    notes: notes || (status === 'sick' ? 'Keterangan Sakit' : status === 'on_leave' ? 'Sakit/Izin Kerja' : 'Mangkir / Tanpa Keterangan')
  };

  if (index !== -1) {
    db.attendance[index] = mockRecord;
  } else {
    db.attendance.push(mockRecord);
  }

  saveDb(db);

  res.json({
    message: `Pencatatan status ${status} untuk Karyawan ${emp.name} berhasil disimpan.`,
    record: mockRecord
  });
});

// 13. Get all registered employees (for Admin select drop downs)
app.get('/api/employees', authenticateToken, (req: any, res) => {
  const db = readDb();
  const employees = db.users
    .filter((u: any) => u.role === 'employee')
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department
    }));
  res.json({ employees });
});

// 13.b User Management Endpoints (Admin Only)
app.get('/api/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  const db = readDb();
  const users = db.users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department
  }));
  res.json({ users });
});

app.post('/api/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role || !department) {
    return res.status(400).json({ error: 'Semua kolom wajib diisi (Nama, Email, Password, Peran, Departemen).' });
  }

  const db = readDb();
  const emailExists = db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: 'Email sudah terdaftar di sistem.' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password,
    role,
    department
  };

  db.users.push(newUser);
  saveDb(db);

  res.json({
    message: 'User baru berhasil didaftarkan.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department
    }
  });
});

app.delete('/api/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
  }

  if (id === 'u-1') {
    return res.status(400).json({ error: 'User Budi Santoso (Admin Utama) tidak boleh dihapus demi keamanan sistem.' });
  }

  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  const deletedUser = db.users[userIndex];
  db.users.splice(userIndex, 1);

  // Clean up cascading records
  db.attendance = db.attendance.filter((a: any) => a.userId !== id);
  db.leaves = db.leaves.filter((l: any) => l.userId !== id);
  db.notifications = db.notifications.filter((n: any) => n.userId !== id);

  saveDb(db);

  res.json({
    message: `User ${deletedUser.name} beserta seluruh riwayatnya berhasil dihapus dari sistem.`
  });
});

// 14. Get all attendance logs (For Admin search Table)
app.get('/api/attendance/all', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  const db = readDb();
  res.json({ attendance: db.attendance });
});

// 15. Analytics report data for Real-time management graphs
app.get('/api/analytics', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  const db = readDb();
  const allAtt = db.attendance;

  // Let's summarize performance into months
  // Group key will be Year-Month "2026-05" or "2026-06", etc.
  const groups: { [key: string]: any } = {};

  allAtt.forEach((record: any) => {
    const parts = record.date.split('-');
    if (parts.length < 2) return;
    const yearMonth = `${parts[0]}-${parts[1]}`; // e.g. "2026-05"

    // Convert to readable month name in Indonesian
    const monthIndex = parseInt(parts[1], 10);
    const monthsIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = `${monthsIndo[monthIndex - 1]} ${parts[0]}`;

    if (!groups[yearMonth]) {
      groups[yearMonth] = {
        month: monthName,
        lateCount: 0,
        earlyCount: 0,
        leaveCount: 0,
        sickCount: 0,
        overtimeHours: 0,
        totalEntries: 0,
        presentCount: 0,
      };
    }

    const g = groups[yearMonth];
    g.totalEntries += 1;

    if (record.status === 'present') {
      g.presentCount += 1;
      if (record.clockInStatus === 'late') {
        g.lateCount += 1;
      } else if (record.clockInStatus === 'early') {
        g.earlyCount += 1;
      }
      if (record.overtimeMinutes > 0) {
        g.overtimeHours += parseFloat((record.overtimeMinutes / 60).toFixed(1));
      }
    } else if (record.status === 'sick') {
      g.sickCount += 1;
    } else if (record.status === 'on_leave') {
      g.leaveCount += 1;
    }
  });

  // Calculate percentage attendance rates
  const analyticsArray = Object.keys(groups)
    .sort()
    .map(key => {
      const g = groups[key];
      const maxPossibleWork = g.totalEntries;
      const rate = maxPossibleWork > 0 ? (g.presentCount / maxPossibleWork) * 100 : 100;
      return {
        month: g.month,
        lateCount: g.lateCount,
        earlyCount: g.earlyCount,
        leaveCount: g.leaveCount,
        sickCount: g.sickCount,
        overtimeHours: Math.round(g.overtimeHours * 10) / 10,
        attendanceRate: Math.round(rate)
      };
    });

  // Also include fresh metrics (real-time KPIs) for the top widgets
  const todayStr = getUTC8TimeComponents().dateString;
  const todayRecords = allAtt.filter((a: any) => a.date === todayStr);

  const kpis = {
    todayDate: todayStr,
    totalEmployees: db.users.filter((u: any) => u.role === 'employee').length,
    presentToday: todayRecords.filter((a: any) => a.status === 'present').length,
    sickToday: todayRecords.filter((a: any) => a.status === 'sick').length,
    onLeaveToday: todayRecords.filter((a: any) => a.status === 'on_leave').length,
    lateToday: todayRecords.filter((a: any) => a.status === 'present' && a.clockInStatus === 'late').length
  };

  res.json({
    monthlyAnalytics: analyticsArray,
    kpis
  });
});

// Setup Vite & Static Files Hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`Server Sinar Alam Semesta running`);
    console.log(`Akses local pada: http://localhost:${PORT}`);
    console.log(`Local Time (UTC+8): ${getUTC8TimeComponents().dateString} ${getUTC8TimeComponents().timeString}`);
    console.log(`========================================`);
  });
}

startServer();
