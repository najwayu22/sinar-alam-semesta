import React, { useState, useEffect } from 'react';
import { 
  Clock, LogIn, LogOut, FileText, Send, Calendar, AlertCircle, 
  CheckCircle2, Bell, RefreshCw, ShieldAlert, FileMinus, ClipboardList
} from 'lucide-react';
import { Attendance, LeaveRequest, Notification } from '../types';
import { API_BASE } from '../api';

interface DashboardKaryawanProps {
  token: string;
  user: { id: string, name: string, email: string, role: string, department: string };
  onLogout: () => void;
}

export default function DashboardKaryawan({ token, user, onLogout }: DashboardKaryawanProps) {
  // Time and Date Hooks
  const [currentUTC8Time, setCurrentUTC8Time] = useState<Date>(new Date());
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [submittingClock, setSubmittingClock] = useState(false);

  // Leave Form Fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [clockMsg, setClockMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // UTC+8 Live Clock trigger
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const wita = new Date(utc + (3600000 * 8)); // UTC+8
      setCurrentUTC8Time(wita);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setLoadingStatus(true);
    setLoadingHistory(true);
    setLoadingLeaves(true);

    try {
      // 1. Get Today's Status
      const todayRes = await fetch(`${API_BASE}/api/attendance/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const todayData = await todayRes.json();
      if (todayRes.ok) {
        setTodayRecord(todayData.record);
      }

      // 2. Get Personal History
      const histRes = await fetch(`${API_BASE}/api/attendance/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const histData = await histRes.json();
      if (histRes.ok) {
        setHistory(histData.history);
      }

      // 3. Get Employee Leave Applications
      const leaveRes = await fetch(`${API_BASE}/api/leaves`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leaveData = await leaveRes.json();
      if (leaveRes.ok) {
        setLeaves(leaveData.leaves);
      }

      // 4. Get Notifications
      const notifRes = await fetch(`${API_BASE}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const notifData = await notifRes.json();
      if (notifRes.ok) {
        setNotifications(notifData.notifications);
      }

    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoadingStatus(false);
      setLoadingHistory(false);
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Clock-In (Absen Masuk)
  const handleClockIn = async () => {
    setSubmittingClock(true);
    setClockMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/clock-in`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan absen masuk.');
      }
      setTodayRecord(data.record);
      setClockMsg({ type: 'success', text: 'Absen Masuk Berhasil! Selamat bekerja.' });
      fetchData(); // Refresh history log
    } catch (err: any) {
      setClockMsg({ type: 'error', text: err.message });
    } finally {
      setSubmittingClock(false);
    }
  };

  // Handle Clock-Out (Absen Keluar)
  const handleClockOut = async () => {
    setSubmittingClock(true);
    setClockMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/clock-out`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan absen keluar.');
      }
      setTodayRecord(data.record);
      const isOvertime = data.record.overtimeMinutes > 0;
      const hoursOt = Math.floor(data.record.overtimeMinutes / 60);
      const minsOt = data.record.overtimeMinutes % 60;
      const msgText = isOvertime 
        ? `Absen Keluar Berhasil! Terima kasih atas dedikasi Anda. Tercatat lembur: ${hoursOt} jam ${minsOt} menit.`
        : 'Absen Keluar Berhasil! Terima kasih banyak atas dedikasi Anda hari ini.';
      
      setClockMsg({ type: 'success', text: msgText });
      fetchData(); // Refresh history log
    } catch (err: any) {
      setClockMsg({ type: 'error', text: err.message });
    } finally {
      setSubmittingClock(false);
    }
  };

  // Submit Leave Request (Pengajuan Cuti Online)
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setLeaveMsg({ type: 'error', text: 'Silakan isi semua kolom input pengajuan cuti!' });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setLeaveMsg({ type: 'error', text: 'Tanggal Mulai tidak boleh melewati Tanggal Berakhir.' });
      return;
    }

    setSubmittingLeave(true);
    setLeaveMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/leaves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startDate, endDate, reason })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan pengajuan cuti.');
      }

      setLeaveMsg({ type: 'success', text: 'Cuti online berhasil diajukan! Menunggu persetujuan atasan.' });
      setStartDate('');
      setEndDate('');
      setReason('');
      
      // Update local logs
      fetchData();
    } catch (e: any) {
      setLeaveMsg({ type: 'error', text: e.message });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Clear unread notifications
  const handleClearNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Formatting helpers for strings
  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status: Attendance['status'], clockInStatus?: Attendance['clockInStatus']) => {
    switch (status) {
      case 'present':
        if (clockInStatus === 'late') {
          return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Terlambat</span>;
        }
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">Hadir Tepat Waktu</span>;
      case 'sick':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">Sakit</span>;
      case 'on_leave':
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-medium">Izin (Cuti)</span>;
      case 'absent':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-medium">Mangkir</span>;
      default:
        return <span className="bg-slate-150 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">Belum Absen</span>;
    }
  };

  // Count active notifications unread
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div id="employee_layout" className="min-h-screen bg-slate-50 font-sans">
      
      {/* Navigation Header */}
      <nav id="emp_nav_bar" className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 border-b-0">
            
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/20">
                  <span className="text-slate-900 font-bold text-base font-display">S</span>
                </div>
                <div>
                  <span className="font-bold text-sm font-display text-slate-900 block leading-tight">SINAR ALAM SEMESTA</span>
                  <span className="text-[9px] text-blue-600 font-bold tracking-widest block uppercase">PORTAL KARYAWAN</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right font-sans">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Selamat Bekerja,</span>
                <span className="text-xs font-bold text-slate-800">{user.name} <span className="text-[10px] font-normal text-slate-500">({user.department})</span></span>
              </div>
              
              <button
                onClick={onLogout}
                id="logout_emp_btn"
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100/50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            </div>

          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section & Server Realtime Clock widget */}
        <div id="welcome_clock_row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* User information panel */}
          <div id="emp_welcome_banner" className="md:col-span-2 bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md flex items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-xl"></div>
            <div className="space-y-2 z-10 font-sans">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-300/35 text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full font-sans">
                Karyawan Aktif
              </span>
              <h2 className="text-2xl font-black font-display text-white">Halo, {user.name}!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg font-sans">
                Gunakan panel ini untuk melakukan absensi keluar/masuk serta melacak pengajuan cuti tahunan Anda secara akurat menggunakan waktu server.
              </p>
              <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-mono text-slate-400">
                <span>📍 DEPARTEMEN: {user.department}</span>
                <span>📧 EMAIL: {user.email}</span>
              </div>
            </div>
          </div>

          {/* Time widget using UTC+8 local calculated clocks */}
          <div id="emp_clock_widget" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Jam WITA Terkini</span>
                <h3 className="text-[9px] text-blue-600 font-mono font-bold tracking-widest mt-0.5 uppercase">LOCAL SERVER UTC+8</h3>
              </div>
              <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>

            <div className="my-2">
              <h1 className="text-3xl font-black font-mono tracking-tight text-slate-800" id="live-utc8-clock">
                {formatTime(currentUTC8Time)}
              </h1>
              <p className="text-xs text-slate-550 font-semibold mt-1 font-sans">
                {currentUTC8Time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 border-t pt-2 border-slate-100 flex items-center gap-1 font-sans">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Sinkronisasi Absensi Sinar Alam Semesta Aktif
            </div>
          </div>

        </div>

        {/* Dynamic Alerts Tray (Notifications Area from leave approval) */}
        {unreadCount > 0 && (
          <div id="notif_tray_callout" className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 mb-8 flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 flex-shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-display">Terdapat {unreadCount} Pemberitahuan Baru</h4>
                <div className="text-xs text-slate-800 space-y-2 max-h-24 overflow-y-auto pr-2">
                  {notifications.filter(n => !n.isRead).map((notif) => (
                    <div key={notif.id} className="border-l-2 border-amber-400 pl-2">
                      <p>{notif.message}</p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{formatDateIndo(notif.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleClearNotifications}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-105 hover:bg-blue-150 px-3.5 py-1.5 rounded-xl transition shrink-0 cursor-pointer"
            >
              Tandai Dibaca
            </button>
          </div>
        )}

        {/* main interactive dashboard contents */}
        <div id="interactive_dashboard_blocks" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Clocking Panel & Leave Request Form */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Standard Clock console */}
            <div id="clock_console_box" className="bg-white rounded-2xl shadow-sm border border-slate-205 p-6">
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" /> Pencatatan Absensi Kerja
              </h3>

              {clockMsg && (
                <div id="clock_activity_alerts" className={`p-4 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                  clockMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {clockMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{clockMsg.text}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Mulai Absen Masuk:</span>
                  <span className="font-mono font-semibold text-slate-700">08:00 WITA</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Mulai Lembur:</span>
                  <span className="font-mono font-semibold text-teal-700">&gt; 17:00 WITA</span>
                </div>
                <hr className="border-slate-100" />
                
                {/* Visual state representation */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status Absen Masuk:</span>
                    {todayRecord && todayRecord.clockIn ? (
                      <span className="font-mono text-emerald-600 font-medium">Recorded ({todayRecord.clockIn})</span>
                    ) : (
                      <span className="font-mono text-slate-400 font-medium">Belum Absen Masuk</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status Absen Keluar:</span>
                    {todayRecord && todayRecord.clockOut ? (
                      <span className="font-mono text-teal-600 font-medium">Recorded ({todayRecord.clockOut})</span>
                    ) : (
                      <span className="font-mono text-slate-400 font-medium">Belum Absen Keluar</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance Operations buttons */}
              <div id="clock_trigger_actions" className="grid grid-cols-2 gap-4">
                
                {/* 1. CLOCK IN BUTTON */}
                <button
                  type="button"
                  id="btn_clock_in"
                  disabled={submittingClock || (todayRecord !== null && todayRecord.clockIn !== null)}
                  onClick={handleClockIn}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider transition outline-none cursor-pointer border border-emerald-500 hover:border-emerald-600 disabled:border-slate-200 shadow-sm"
                >
                  <LogIn className="w-5 h-5 mb-1.5" />
                  <span>Absen Masuk</span>
                  <span className="text-[9px] opacity-75 mt-0.5 font-normal normal-case">Mulai Pagi</span>
                </button>

                {/* 2. CLOCK OUT BUTTON */}
                <button
                  type="button"
                  id="btn_clock_out"
                  disabled={submittingClock || !todayRecord || todayRecord.clockIn === null || todayRecord.clockOut !== null}
                  onClick={handleClockOut}
                  className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider transition outline-none cursor-pointer border border-blue-500 hover:border-blue-600 disabled:border-slate-200 shadow-sm"
                >
                  <LogOut className="w-5 h-5 mb-1.5" />
                  <span>Absen Keluar</span>
                  <span className="text-[9px] opacity-75 mt-0.5 font-normal normal-case">Selesai Kerja</span>
                </button>

              </div>

              <div id="time_warning_block" className="mt-4 flex items-start gap-1.5 p-2.5 rounded-xl bg-blue-50/50 text-[10px] text-blue-800 border border-blue-100">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Pencatatan didasarkan pada waktu server (Wita UTC+8) untuk menjaga rekam medis and ketaatan jam masuk kantor secara valid.</span>
              </div>

            </div>

            {/* Leave Submission Form Panel (Pengajuan Cuti Online) */}
            <div id="leave_form_component" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" /> Pengajuan Cuti Online
              </h3>

              {leaveMsg && (
                <div id="leave_request_alerts" className={`p-4 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                  leaveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {leaveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{leaveMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Mulai</label>
                    <div className="relative">
                      <input
                        type="date"
                        id="leave_start_input"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs transition text-slate-850"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Berakhir</label>
                    <div className="relative">
                      <input
                        type="date"
                        id="leave_end_input"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs transition text-slate-850"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Alasan Mengajukan Cuti</label>
                  <textarea
                    id="leave_reason_input"
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Menghadiri pernikahan keluarga, urusan medis, mudik, dsb."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs text-slate-850 transition resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  id="btn_submit_leave"
                  disabled={submittingLeave}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 outline-none shadow-sm shadow-blue-500/10 cursor-pointer"
                >
                  {submittingLeave ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Kirim Pengajuan Cuti
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: Attendance log history and Online Leave tracker */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Leaves Tracker Grid */}
            <div id="leaves_tracker_card" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Status Pengajuan Cuti Online
                </h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full font-mono">
                  {leaves.length} Pengajuan
                </span>
              </div>

              {loadingLeaves ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading data cuti...</p>
                </div>
              ) : leaves.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileMinus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada pengajuan cuti</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Silakan isi formulir cuti di kolom sebelah kiri.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 font-sans">
                        <th className="py-2.5 px-3">Rentang Tanggal</th>
                        <th className="py-2.5 px-3">Durasi</th>
                        <th className="py-2.5 px-3">Alasan</th>
                        <th className="py-2.5 px-3 text-right">Status Persetujuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaves.map((leave) => {
                        const days = Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1;
                        return (
                          <tr key={leave.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {leave.startDate} s/d {leave.endDate}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600">{days} Hari Kerja</td>
                            <td className="py-3 px-3 italic max-w-xs truncate">{leave.reason}</td>
                            <td className="py-3 px-3 text-right">
                              {leave.status === 'pending' ? (
                                <span className="bg-slate-100 text-slate-750 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Menunggu</span>
                              ) : leave.status === 'approved' ? (
                                <span className="bg-emerald-105 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Disetujui ✅</span>
                              ) : (
                                <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Ditolak ❌</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attendance Personal Log */}
            <div id="attendance_log_card" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" /> Riwayat Kehadiran Pribadi
                </h3>
                <button
                  type="button"
                  onClick={fetchData}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-55 text-[10px] font-bold text-slate-600 rounded-xl flex items-center gap-1 cursor-pointer font-sans uppercase tracking-widest transition"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-10">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Memuat riwayat kehadiran...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Belum ada catatan kehadiran</p>
                  <p className="text-xs text-slate-400 mt-1">Silakan lakukan absensi pertama Anda di jam masuk pagi ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 font-sans">
                        <th className="py-2.5 px-3">Tanggal Kerja</th>
                        <th className="py-2.5 px-3">Absen Masuk</th>
                        <th className="py-2.5 px-3">Absen Keluar</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Lembur</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.slice(0, 15).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {formatDateIndo(log.date)}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {log.clockIn ? (
                              <span className="text-slate-800">{log.clockIn} WITA</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {log.clockOut ? (
                              <span className="text-slate-800">{log.clockOut} WITA</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {getStatusBadge(log.status, log.clockInStatus)}
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-700 font-semibold">
                            {log.overtimeMinutes > 0 ? (
                              <span>+{Math.floor(log.overtimeMinutes / 60)}j {log.overtimeMinutes % 60}m</span>
                            ) : (
                              <span className="text-slate-350 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                            {log.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {history.length > 15 && (
                    <div className="text-center pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      Menampilkan 15 hari terakhir dari {history.length} catatan total.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      <footer className="bg-white border-t border-slate-205 mt-16 py-6 text-center text-xs text-slate-400">
        <p>&copy; 2026 PT Sinar Alam Semesta. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="mt-1 font-mono text-[9px] tracking-wider text-slate-350">PROFILER ID: {user.id} | SISTEM ABSENSI & CUTI MANDIRI</p>
      </footer>

    </div>
  );
}
