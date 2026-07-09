export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface Attendance {
  id: string;
  userId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;  // HH:MM:SS (UTC+8)
  clockOut: string | null; // HH:MM:SS (UTC+8)
  clockInStatus: 'early' | 'late' | null;
  overtimeMinutes: number; // minutes after 17:00
  status: 'present' | 'sick' | 'on_leave' | 'absent';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  employeeName: string;
  department: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string or date
  approvedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Stats interface for Monthly Analytics
export interface MonthlyAnalytics {
  month: string; // e.g. "Juni 2026"
  lateCount: number;
  earlyCount: number;
  leaveCount: number;
  sickCount: number;
  overtimeHours: number;
  attendanceRate: number; // percentage
}
