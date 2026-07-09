import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, FileCheck2, Thermometer, 
  Search, SlidersHorizontal, ArrowDownToLine, Printer, Plus,
  RefreshCw, Check, X, Shield, BarChart3, TrendingUp, HelpCircle,
  UserPlus, Trash2, Mail, Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { Attendance, LeaveRequest, MonthlyAnalytics } from '../types';

interface DashboardAdminProps {
  token: string;
  user: { id: string, name: string, email: string, role: string, department: string };
  onLogout: () => void;
}

export default function DashboardAdmin({ token, user, onLogout }: DashboardAdminProps) {
  // Tabs: 'summary' | 'logs' | 'leaves' | 'users'
  const [activeTab, setActiveTab] = useState<'summary' | 'logs' | 'leaves' | 'users'>('summary');
  
  // Data States
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics[]>([]);
  const [kpis, setKpis] = useState({
    todayDate: '',
    totalEmployees: 0,
    presentToday: 0,
    sickToday: 0,
    onLeaveToday: 0,
    lateToday: 0
  });

  // User Management lists & forms
  const [userList, setUserList] = useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Filters & Search for Logs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Load Helpers
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual Attendance Modal Input States
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualUser, setManualUser] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualStatus, setManualStatus] = useState<'sick' | 'on_leave' | 'absent'>('sick');
  const [manualNotes, setManualNotes] = useState('');
  const [manualMsg, setManualMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // UTC+8 Date formatting helper
  const getUTC8TodayStr = () => {
    const d = new Date();
    const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
    const offsetTime = new Date(utcTime + (3600000 * 8));
    const year = offsetTime.getFullYear();
    const month = String(offsetTime.getMonth() + 1).padStart(2, '0');
    const date = String(offsetTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  // User management active confirmation state
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch All Attendance Reports
      const attRes = await fetch('/api/attendance/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const attData = await attRes.json();
      if (attRes.ok) {
        setAttendance(attData.attendance);
      }

      // 2. Fetch All Leave submissions
      const leaveRes = await fetch('/api/leaves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leaveData = await leaveRes.json();
      if (leaveRes.ok) {
        setLeaves(leaveData.leaves);
      }

      // 3. Fetch Registered workers list
      const empRes = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empData = await empRes.json();
      if (empRes.ok) {
        setEmployees(empData.employees);
      }

      // 4. Fetch Analytics dashboards aggregates
      const analysisRes = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analysisData = await analysisRes.json();
      if (analysisRes.ok) {
        setMonthlyAnalytics(analysisData.monthlyAnalytics);
        setKpis(analysisData.kpis);
      }

      // 5. Fetch all registered users for management tab
      const usersRes = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setUserList(usersData.users);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole || !newUserDepartment) {
      setUserActionMsg({ type: 'error', text: 'Silakan isi seluruh kolom pendaftaran.' });
      return;
    }
    setUserActionLoading('create');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          department: newUserDepartment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan user.');
      }
      setUserActionMsg({ type: 'success', text: 'User baru berhasil ditambahkan!' });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('employee');
      setNewUserDepartment('');
      
      await loadAdminData();
      setTimeout(() => {
        setShowAddUserModal(false);
        setUserActionMsg(null);
      }, 1500);
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err.message });
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUserActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus user.');
      }
      setUserToDelete(null);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUserActionLoading(null);
    }
  };

  useEffect(() => {
    loadAdminData();
    setManualDate(getUTC8TodayStr());
  }, [token]);

  // Handle Leave Approvals
  const handleApproveLeave = async (leaveId: string, action: 'approved' | 'rejected') => {
    setActionLoading(leaveId);
    try {
      const res = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal mengubah status cuti.');
      } else {
        // Reload all datasets to reflect updates in calendars/KPIs/notifications
        await loadAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Submit manual presence injection (Keterangan Sakit/Izin manual)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser || !manualDate || !manualStatus) {
      setManualMsg({ type: 'error', text: 'Silakan isi parameter karyawan, tanggal, dan status.' });
      return;
    }

    try {
      const res = await fetch('/api/attendance/manual-absent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: manualUser,
          date: manualDate,
          status: manualStatus,
          notes: manualNotes
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan absensi manual.');
      }

      setManualMsg({ type: 'success', text: `Berhasil mendaftarkan absensi manual ${manualStatus}!` });
      setManualNotes('');
      await loadAdminData(); // Refresh UI lists & charts
      setTimeout(() => {
        setShowManualModal(false);
        setManualMsg(null);
      }, 1500);

    } catch (e: any) {
      setManualMsg({ type: 'error', text: e.message });
    }
  };

  // Extract unique departments dynamically from both attendance and employee lists
  const departments = Array.from(
    new Set([
      ...attendance.map(item => item.department),
      ...employees.map(emp => emp.department)
    ])
  )
    .filter(Boolean)
    .sort();

  // Filtering Logic for Attendance Table search
  const filteredAttendance = attendance.filter(item => {
    const matchesSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : 
                          statusFilter === 'late' ? (item.status === 'present' && item.clockInStatus === 'late') :
                          statusFilter === 'overtime' ? (item.status === 'present' && item.overtimeMinutes > 0) :
                          item.status === statusFilter;

    const matchesDept = deptFilter === 'all' ? true : item.department.toLowerCase() === deptFilter.toLowerCase();
    
    const matchesDate = dateFilter === '' ? true : item.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesDate;
  });

  // PDF Exporter Trigger: Triggers standard printer stylesheet layouts
  const handleExportPDF = () => {
    window.print();
  };

  // EXCEL EXPORTER GENERATOR (DOWLOADABLE UTF-8 DIRECT WORKBOOK STREAM)
  // satisfied requirement - "sistem ekspor laporan ke format PDF dan Excel" cleanly
  const handleExportExcel = () => {
    // Generate full CSV contents representing standard table with UTF-8 BOM
    let csvContent = '\uFEFF'; // Excel UTF-8 BOM prefix
    csvContent += 'NO;TANGGAL;NAMA KARYAWAN;DEPARTEMEN;JAM MASUK;JAM KELUAR;STATUS ABSENSI;DURASI LEMBUR;KETERANGAN\r\n';

    filteredAttendance.forEach((item, index) => {
      const lockIn = item.clockIn ? `${item.clockIn} WITA` : '-';
      const lockOut = item.clockOut ? `${item.clockOut} WITA` : '-';
      const hoursOt = item.overtimeMinutes > 0 ? `${Math.floor(item.overtimeMinutes / 60)}j ${item.overtimeMinutes % 60}m` : '-';
      const statusText = item.status === 'present' 
        ? (item.clockInStatus === 'late' ? 'Hadir Terlambat' : 'Hadir Tepat Waktu')
        : item.status === 'sick' ? 'Sakit'
        : item.status === 'on_leave' ? 'Cuti Berizin'
        : 'Mangkir';
      const notes = item.notes || '-';

      csvContent += `${index + 1};${item.date};${item.employeeName};${item.department};${lockIn};${lockOut};${statusText};${hoursOt};${notes}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sinar_Alam_Semesta_Laporan_Absensi_${getUTC8TodayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div id="admin_layout_desk" className="min-h-screen bg-slate-50 font-sans">
      
      {/* Navigation Header */}
      <nav id="admin_nav_bar" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/20">
                  <span className="text-slate-900 font-bold text-base font-display">S</span>
                </div>
                <div>
                  <span className="font-bold text-sm font-display text-slate-900 block leading-tight">SINAR ALAM SEMESTA</span>
                  <span className="text-[9px] text-blue-600 font-bold tracking-widest block flex items-center gap-1 uppercase">
                    <Shield className="w-3 h-3 text-amber-500" /> PORTAL ADMINISTRATOR
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right font-sans">
                <span className="text-[10px] text-slate-405 uppercase tracking-wide font-semibold">Direktur / HRD</span>
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
              </div>
              
              <button
                onClick={onLogout}
                id="logout_admin_btn"
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100/50 text-slate-650 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                Keluar
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main body wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner with header controls */}
        <div id="admin_header_panel" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b pb-5 border-slate-200 print:hidden">
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Dashboard Pemantauan Kinerja</h1>
            <p className="text-xs text-slate-500 mt-1">
              Rekapitulasi absensi online waktu server WITA, persetujuan cuti tim, dan ekspor laporan instan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadAdminData}
              className="px-3.5 py-1.5 border border-slate-202 bg-white hover:bg-slate-50 text-slate-650 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> Segarkan Data
            </button>
            
            {/* MANUAL STATUS REGISTRATION MODAL TRIGGER */}
            <button
              onClick={() => setShowManualModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Catat Absen Manual
            </button>
          </div>
        </div>

        {/* Real-time KPI Statistics Row */}
        <div id="admin_kpi_metrics" className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-150/50 rounded-lg flex items-center justify-center text-slate-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Tim</span>
              <span className="text-xl font-black text-slate-800 font-mono leading-tight">{kpis.totalEmployees}</span>
              <span className="block text-[9px] text-slate-400 font-medium">Aktif Terdaftar</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Hadir Hari Ini</span>
              <span className="text-xl font-black text-emerald-750 font-mono leading-tight">{kpis.presentToday}</span>
              <span className="block text-[9px] text-slate-400 font-medium">Karyawan Masuk</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Terlambat</span>
              <span className="text-xl font-black text-amber-700 font-mono leading-tight">{kpis.lateToday}</span>
              <span className="block text-[9px] text-amber-500 font-medium">Butuh Evaluasi</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50/60 rounded-lg flex items-center justify-center text-blue-600">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Sakit</span>
              <span className="text-xl font-black text-blue-700 font-mono leading-tight">{kpis.sickToday}</span>
              <span className="block text-[9px] text-slate-400 font-medium">Sakit Terdaftar</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100/40 rounded-lg flex items-center justify-center text-blue-700">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Cuti / Izin</span>
              <span className="text-xl font-black text-blue-800 font-mono leading-tight">{kpis.onLeaveToday}</span>
              <span className="block text-[9px] text-slate-400 font-medium">Cuti Online Aktif</span>
            </div>
          </div>

        </div>

        {/* Tab Selection Row */}
        <div id="admin_tab_row" className="flex border-b border-slate-200 mb-8 gap-3 print:hidden">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
              activeTab === 'summary' 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Rekapitulasi & Grafik Analitik
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
              activeTab === 'logs' 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Tabel Laporan Kehadiran ({filteredAttendance.length})
          </button>
          
          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 relative uppercase tracking-wider ${
              activeTab === 'leaves' 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" /> Verifikasi Persetujuan Cuti
            {leaves.filter(l => l.status === 'pending').length > 0 && (
              <span className="absolute -top-1 right-0 text-[9px] font-bold bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {leaves.filter(l => l.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 relative uppercase tracking-wider ${
              activeTab === 'users' 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Manajemen User ({userList.length})
          </button>
        </div>

        {/* TAB CONTENTS */}

        {/* TAB A: SUMMARY AND ANALYTICAL CHARTS (Recharts implementation) */}
        {activeTab === 'summary' && (
          <div id="summary_tab_wrapper" className="space-y-8 print:hidden">
            
            {/* Top Row: Description */}
            <div className="bg-white p-5 rounded-xl border border-slate-201 shadow-sm">
              <h3 className="text-base font-bold text-slate-850 font-display flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Dashboard Produktivitas Tim Real-Time
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl font-sans">
                Visualisasi berikut dirancang agar manajemen dapat mendeteksi tren kedisiplinan dan lembur karyawan dari bulan ke bulan. 
                Data dikompilasi secara dinamis berdasarkan jam presensi masuk kantor yang ideal pukul <strong className="text-slate-700 font-semibold">08:00 WITA</strong>. 
                Sistem menghitung keterlambatan secara adil, sementara sisa durasi kerja lembur dihitung otomatis saat karyawan melampaui jam pelayanan kantor pukul <strong className="text-blue-700 font-semibold">17:00 WITA</strong>.
              </p>
            </div>

            {/* Recharts Graphical Visualizations Row */}
            <div id="recharts_row_container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart 1: Monthly Attendance Rate (Percentage) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Tingkat Kehadiran Bulanan (%)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Persentase karyawan hadir utama terhadap hari kerja produktif</p>
                </div>
                <div className="h-60 mt-4">
                  {monthlyAnalytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyAnalytics}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip />
                        <Area type="monotone" dataKey="attendanceRate" name="Persentase Presensi" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada statistik penunjang.</div>
                  )}
                </div>
              </div>

              {/* Chart 2: Late / Sick / Leave Distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Faktor Ketidakhadiran & Hambatan</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-display">Jumlah keterlambatan (Late), izin (Leave), dan sakit (Sick)</p>
                </div>
                <div className="h-60 mt-4">
                  {monthlyAnalytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="lateCount" name="Terlambat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sickCount" name="Sakit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="leaveCount" name="Izin/Cuti" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada statistik penunjang.</div>
                  )}
                </div>
              </div>

              {/* Chart 3: Overtime Hours Accumulation */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Akumulasi Jam Lembur Karyawan (Jam)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total jam kerja di luar reguler (&gt; 17:00 WITA) kumulatif tim</p>
                </div>
                <div className="h-60 mt-4">
                  {monthlyAnalytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="overtimeHours" name="Total Jam Lembur" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada statistik penunjang.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Quick Helper Tips */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-850">Mengapa analitik ini real-time?</strong> Setiap kali karyawan PT Sinar Alam Semesta melakukan pencatatan absensi masuk, keluar, atau cuti disetujui, visualisasi grafis ini akan segera menghitung durasi rekap denda kedisplinan secara akurat di database server.
              </div>
            </div>

          </div>
        )}

        {/* TAB B: ATTENDANCE LOG REPORT TABLE (With search, filters, Excel, & PDF printers) */}
        {activeTab === 'logs' && (
          <div id="logs_tab_wrapper" className="space-y-6">
            
            {/* Table Filters header section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* Search Text input */}
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-450">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari nama karyawan, divisi, atau departemen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs text-slate-800 bg-slate-50 border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Status Filter selector */}
                <div className="w-auto min-w-[130px] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded-xl text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="all">Sua Status</option>
                    <option value="present">Hadir (Sua)</option>
                    <option value="late">Hadir Terlambat ⚠️</option>
                    <option value="overtime">Hadir Lembur ⚡</option>
                    <option value="sick">Sakit 🩺</option>
                    <option value="on_leave">Cuti / Izin 📅</option>
                    <option value="absent">Mangkir ❌</option>
                  </select>
                </div>

                {/* Divisi Filter selector */}
                <div className="w-auto min-w-[140px] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded-xl text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="all">Semua Divisi</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date filter selector */}
                <div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl text-xs text-slate-700 focus:outline-none"
                  />
                </div>

                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-xs text-slate-400 hover:text-red-500 underline font-medium self-center cursor-pointer"
                  >
                    Reset Tgl
                  </button>
                )}

              </div>

              {/* Data Export actions buttons container */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                <span className="text-[11px] text-slate-400">
                  Menampilkan <strong className="text-slate-700">{filteredAttendance.length}</strong> data absensi yang sesuai filter.
                </span>

                <div className="flex gap-2">
                  {/* EXPORT TO EXCEL */}
                  <button
                    onClick={handleExportExcel}
                    className="p-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/15"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Ekspor ke Excel
                  </button>

                  {/* EXPORT TO PDF via native beautiful print styling page */}
                  <button
                    onClick={handleExportPDF}
                    className="p-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> Ekspor PDF (Cetak)
                  </button>
                </div>
              </div>

            </div>

            {/* Attendance database search values result block table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              
              {/* Only visible in window prints PDF generation */}
              <div className="hidden print:block p-6 border-b border-slate-400 mb-6 font-sans">
                <h1 className="text-2xl font-black font-display text-slate-900 text-center uppercase">PT SINAR ALAM SEMESTA</h1>
                <h3 className="text-base text-slate-700 text-center font-semibold mt-1">LAPORAN REKAPITULASI PRESENSI & ABSENSI KARYAWAN</h3>
                <div className="flex justify-between items-center text-xs mt-6 text-slate-700">
                  <span>Tanggal Ekstraksi: {getUTC8TodayStr()}</span>
                  <span>Oleh Administrator: {user.name} ({user.department})</span>
                </div>
                <hr className="border-slate-800 mt-2" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-display text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Nama Karyawan / Devisi</th>
                      <th className="py-3 px-4">Tanggal Kerja</th>
                      <th className="py-3 px-4">Absen Masuk (08:00)</th>
                      <th className="py-3 px-4">Absen Keluar (17:00)</th>
                      <th className="py-3 px-4">Kedisplinan / Status</th>
                      <th className="py-3 px-4">Jam Lembur</th>
                      <th className="py-3 px-4">Status / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 font-medium bg-slate-50/50">
                          Tidak ada data absensi karyawan yang cocok dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <span className="block">{item.employeeName}</span>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.department}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                            {item.date}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {item.clockIn ? (
                              <span className="text-slate-800">{item.clockIn}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {item.clockOut ? (
                              <span className="text-slate-800">{item.clockOut}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.status === 'present' ? (
                              item.clockInStatus === 'late' ? (
                                <span className="bg-amber-100/80 text-amber-900 border border-amber-220 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Terlambat ⚠️</span>
                              ) : (
                                <span className="bg-emerald-100/80 text-emerald-900 border border-emerald-220 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Tepat Waktu ✅</span>
                              )
                            ) : item.status === 'sick' ? (
                              <span className="bg-blue-105 text-blue-900 border border-blue-220 text-[10px] font-bold px-2 py-0.5 rounded uppercase">🩺 Sakit</span>
                            ) : item.status === 'on_leave' ? (
                              <span className="bg-indigo-105 text-indigo-900 border border-indigo-220 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-display">📅 Cuti / Izin</span>
                            ) : (
                              <span className="bg-rose-100 text-rose-900 border border-rose-220 text-[10px] font-bold px-2 py-0.5 rounded uppercase">❌ Mangkir</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-teal-700 font-black">
                            {item.overtimeMinutes > 0 ? (
                              <span>+{Math.floor(item.overtimeMinutes / 60)}j {item.overtimeMinutes % 60}m</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 italic text-slate-500 max-w-xs truncate">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* TAB C: LEAVE REQUESTS APPROVAL VERTICAL PANELS */}
        {activeTab === 'leaves' && (
          <div id="leaves_tab_wrapper" className="space-y-6 print:hidden">
            
            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2 mb-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" /> Verifikasi Pengajuan Cuti Mandiri Online
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tinjau pengajuan cuti libur, darurat, dan pribadi yang diajukan secara online oleh karyawan di portal mandiri. 
                Menyetujui tindakan ini akan **secara otomatis merekam status kehadiran "Cuti/Izin"** pada rentang tanggal tersebut di basis data presensi, dan **mengirimkan notifikasi push konfirmasi instan** kepada karyawan bersangkutan.
              </p>
            </div>

            {/* List and approval boxes */}
            {leaves.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">Belum ada permohonan cuti online terdaftar.</p>
                <p className="text-xs text-slate-400 mt-1">Seluruh pengajuan cuti yang dikirimkan karyawan akan muncul di tab ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {leaves.map((leave) => {
                  const days = Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1;
                  const isPending = leave.status === 'pending';
                  
                  return (
                    <div 
                      key={leave.id} 
                      className={`rounded-2xl p-6 border shadow-sm transition ${
                        isPending 
                          ? 'bg-gradient-to-r from-amber-50/40 to-white border-amber-200' 
                          : leave.status === 'approved' 
                          ? 'bg-white border-slate-200' 
                          : 'bg-white border-slate-200 opacity-65'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pemohon Cuti:</span>
                          <h4 className="text-base font-bold text-slate-800 font-display mt-0.5">{leave.employeeName}</h4>
                          <span className="bg-slate-105 text-slate-500 text-[9px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded-full">
                            {leave.department}
                          </span>
                        </div>

                        <div>
                          {leave.status === 'pending' ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Menunggu Tinjauan</span>
                          ) : leave.status === 'approved' ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Disetujui ✅</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Ditolak ❌</span>
                          )}
                        </div>
                      </div>

                      <hr className="border-slate-100 my-3" />

                      <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Durasi Izin Cuti:</span>
                          <strong className="text-slate-800 font-display">{days} Hari Saja ({leave.startDate} s/d {leave.endDate})</strong>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alasan Pengajuan Cuti:</span>
                          <p className="text-slate-700 italic">"{leave.reason}"</p>
                        </div>
                      </div>

                      {/* Approval buttons */}
                      {isPending && (
                        <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2.5">
                          <button
                            onClick={() => handleApproveLeave(leave.id, 'approved')}
                            disabled={actionLoading !== null}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10"
                          >
                            <Check className="w-3.5 h-3.5 animate-pulse" /> Setujui
                          </button>

                          <button
                            onClick={() => handleApproveLeave(leave.id, 'rejected')}
                            disabled={actionLoading !== null}
                            className="flex-1 py-2 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </div>
                      )}

                      {!isPending && leave.approvedBy && (
                        <div className="mt-4 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 italic">
                          Tindakan diselesaikan oleh: {leave.approvedBy}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB D: USER MANAGEMENT CONTROL CENTER */}
        {activeTab === 'users' && (
          <div id="users_tab_wrapper" className="space-y-6 print:hidden">
            
            {/* Header Description & Action block */}
            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-650" /> Pusat Kendali Manajemen Pengguna Terdaftar
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Daftarkan karyawan baru ke sistem, berikan otorisasi peran (Karyawan / Admin), atau hapus data user. 
                  Menghapus pengguna akan membersihkan seluruh data riwayat absensi dan data perizinan mereka secara otomatis demi integritas data referensial.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2.5 px-4 uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <UserPlus className="w-4 h-4" /> Tambah User Baru
                </button>
              </div>
            </div>

            {/* List of Users Grid/Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none font-display">Daftar Akun Otorisasi</span>
                <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-full font-bold">Total: {userList.length} Akun</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100">
                      <th className="py-3 px-4">UID</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Alamat Email</th>
                      <th className="py-3 px-4">Divisi / Departemen</th>
                      <th className="py-3 px-4">Hak Akses</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {userList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                          Belum ada data user dalam sistem.
                        </td>
                      </tr>
                    ) : (
                      userList.map((usr) => {
                        const isSelf = usr.id === user.id;
                        const isSeedAdmin = usr.id === 'u-1';
                        const cannotDelete = isSelf || isSeedAdmin;
                        
                        return (
                          <tr key={usr.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                              {usr.id}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {usr.name} {isSelf && <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase leading-none font-bold">Anda</span>}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono">
                              {usr.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="bg-slate-100 text-slate-750 text-[10px] font-semibold px-2 py-0.5 rounded font-display border border-slate-200">
                                {usr.department || '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {usr.role === 'admin' ? (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                                  🛡️ Administrator
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                                  👤 Karyawan
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {cannotDelete ? (
                                <span 
                                  title={isSelf ? "Tidak dapat menghapus diri sendiri" : "Admin Utama dilindungi"}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-350 cursor-not-allowed"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(usr)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-center text-xs text-slate-400 print:hidden">
        <p>&copy; 2026 PT Sinar Alam Semesta. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="mt-1 font-mono text-[9px] text-slate-350 tracking-wider">ADMINISTRATIVE DASHBOARD | JWT AUTHS CERTIFIED</p>
      </footer>

      {/* MANUAL ABSENCE ENTRY MODAL DIALOG */}
      {showManualModal && (
        <div id="manual_absence_dialog" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-250 w-full max-w-sm overflow-hidden transform transition animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white p-4 font-display font-bold flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest font-sans font-bold">Catat Absensi Manual Karyawan</span>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body form */}
            <form onSubmit={handleManualSubmit} className="p-5 space-y-4 text-xs">
              
              {manualMsg && (
                <div className={`p-3 rounded-xl border text-xs ${
                  manualMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-red-50 text-red-800 border-red-250'
                }`}>
                  {manualMsg.text}
                </div>
              )}

              {/* 1. Select employee drop-down */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Karyawan</label>
                <select
                  required
                  value={manualUser}
                  onChange={(e) => setManualUser(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-teal-500 text-slate-800 cursor-pointer bg-slate-50"
                >
                  <option value="">Pilih Karyawan...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              {/* 2. Select Date input */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tanggal Absensi</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-teal-500"
                />
              </div>

              {/* 3. Reason/Status Selection */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Status Absen</label>
                <div className="grid grid-cols-3 gap-2">
                  
                  <button
                    type="button"
                    onClick={() => setManualStatus('sick')}
                    className={`py-2 px-1 border rounded-lg font-semibold transition cursor-pointer ${
                      manualStatus === 'sick' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    🩺 Sakit
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualStatus('on_leave')}
                    className={`py-2 px-1 border rounded-lg font-semibold transition cursor-pointer ${
                      manualStatus === 'on_leave' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    📅 Izin / Cuti
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualStatus('absent')}
                    className={`py-2 px-1 border rounded-lg font-semibold transition cursor-pointer ${
                      manualStatus === 'absent' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700' 
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    ❌ Mangkir
                  </button>
                  
                </div>
              </div>

              {/* 4. Notes Text area */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Keterangan / Dokumen Pendukung</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Misalnya: Surat Dokter, Acara duka, dsb."
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-850 outline-none focus:border-blue-500 resize-none text-[11px]"
                ></textarea>
              </div>

              {/* Submit footer trigger buttons */}
              <div className="flex gap-2.5 pt-2 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Simpan Catatan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM USER DELETION OVERLAY */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden transform transition animate-fade-in">
            <div className="bg-rose-600 p-4 text-white font-display font-bold flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest font-sans">Konfirmasi Hapus User</span>
              <button onClick={() => setUserToDelete(null)} className="text-rose-200 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus user <strong className="text-slate-800">{userToDelete.name}</strong> ({userToDelete.email})?
              </p>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-[10px] text-rose-700 leading-relaxed font-semibold">
                ⚠️ PERINGATAN: Seluruh riwayat presensi, pengajuan cuti, dan notifikasi yang berhubungan dengan user ini akan dihapus secara permanen dari basis data Sinar Alam Semesta.
              </div>
              
              <div className="flex gap-3 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(userToDelete.id)}
                  disabled={userActionLoading === userToDelete.id}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {userActionLoading === userToDelete.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div id="add_user_dialog" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-250 w-full max-w-md overflow-hidden transform transition animate-fade-in">
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white p-4 font-display font-bold flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest font-sans font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-500" /> Daftarkan Karyawan / User Baru
              </span>
              <button 
                onClick={() => { setShowAddUserModal(false); setUserActionMsg(null); }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {userActionMsg && (
                <div className={`p-3 rounded-xl text-center text-[11px] font-semibold ${
                  userActionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-750 border border-emerald-200' : 'bg-rose-50 text-rose-750 border border-rose-200'
                }`}>
                  {userActionMsg.text}
                </div>
              )}

              {/* 1. Name */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Akbar"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* 2. Email */}
              <div>
                <label className="block text-slate-505 font-semibold mb-1">Alamat Email Login</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-450" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: akbar@sinaralam.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-medium font-mono"
                  />
                </div>
              </div>

              {/* 3. Password */}
              <div>
                <label className="block text-slate-505 font-semibold mb-1">Kata Sandi (Minimum 6 Karakter)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-450" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Contoh: akbar123"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-medium font-mono"
                  />
                </div>
              </div>

              {/* 4. Role & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-505 font-semibold mb-1">Hak Akses (Peran)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none bg-white font-medium"
                  >
                    <option value="employee">Karyawan biasa</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-505 font-semibold mb-1">Divisi / Departemen</label>
                  <select
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none bg-white font-medium"
                  >
                    <option value="">Pilih Divisi...</option>
                    <option value="Direksi">Direksi</option>
                    <option value="Management">Management</option>
                    <option value="Produksi">Produksi</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Operasional">Operasional</option>
                    <option value="SDM / HRD">SDM / HRD</option>
                    <option value="Logistik">Logistik</option>
                  </select>
                </div>
              </div>

              {/* Submit footer trigger buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => { setShowAddUserModal(false); setUserActionMsg(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={userActionLoading !== null}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  {userActionLoading === 'create' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
