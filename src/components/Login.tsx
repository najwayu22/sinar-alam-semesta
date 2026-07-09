import React, { useState } from 'react';
import { LogIn, Key, Mail, Shield, User, Building } from 'lucide-react';
import { API_BASE } from '../api';

interface LoginProps {
  onLoginSuccess: (token: string, user: { id: string, name: string, email: string, role: 'admin' | 'employee', department: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick fill helper data
  const credentials = [
    { label: 'Admin (Budi Santoso)', email: 'admin@sinaralam.com', pass: 'admin123', role: 'admin' },
    { label: 'Karyawan 1 (Andi Saputra)', email: 'andi@sinaralam.com', pass: 'andi123', role: 'karyawan' },
    { label: 'Karyawan 2 (Citra Lestari)', email: 'citra@sinaralam.com', pass: 'citra123', role: 'karyawan' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan login.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (cEmail: string, cPass: string) => {
    setEmail(cEmail);
    setPassword(cPass);
    setError(null);
  };

  return (
    <div id="login_screen" className="min-h-screen flex items-center justify-center px-4 bg-slate-50 font-sans">
      <div id="login_card_wrapper" className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition duration-500">
        
        {/* Banner Brand Header */}
        <div id="brand_header" className="bg-slate-900 px-6 py-8 text-center text-white relative border-b border-slate-800">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-600/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl"></div>
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/20 mx-auto mb-3">
            <span className="text-slate-900 font-bold text-lg font-display">S</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight font-display text-white uppercase leading-tight">
            Sinar Alam <span className="text-amber-400 block pb-1">Semesta</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-sans">Portal Kehadiran & Manajemen Cuti Mandiri</p>
        </div>

        {/* Form Body */}
        <div id="form_body" className="p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-800 mb-5 font-display flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-600" /> Masuk ke Akun Anda
          </h2>

          {error && (
            <div id="login_error_bin" className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded text-xs mb-4">
              <span className="font-semibold">Gagal:</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="login_email_input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sinaralam.com"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs transition text-slate-850 bg-slate-55"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kata Sandi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  id="login_password_input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs transition text-slate-850 bg-slate-55"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login_submit_btn"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 outline-none shadow-md shadow-blue-500/15 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" /> Masuk Aplikasi
                </>
              )}
            </button>
          </form>

          {/* Quick Login Helper Panel */}
          <div id="quick_login_helper" className="mt-6 pt-5 border-t border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-display">
              <Shield className="w-3.5 h-3.5 text-blue-600" /> Akun Uji Coba Cepat (Sandbox):
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {credentials.map((cred, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickFill(cred.email, cred.pass)}
                  className="flex items-center justify-between text-left px-3.5 py-2.5 bg-slate-55 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs transition cursor-pointer text-slate-700 font-sans"
                >
                  <span className="flex items-center gap-1.5">
                    {cred.role === 'admin' ? (
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <strong>{cred.label}</strong>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-wider">ISI CEPAT</span>
                </button>
              ))}
            </div>
          </div>

          <div id="support_brand" className="mt-6 text-center">
            <span className="text-[9px] text-slate-400 font-mono tracking-wider">WAKTU SERVER: UTC+8 (WITA)</span>
          </div>

        </div>
      </div>
    </div>
  );
}
