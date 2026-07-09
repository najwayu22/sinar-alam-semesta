import { useState, useEffect } from 'react';
import Login from './components/Login';
import DashboardKaryawan from './components/DashboardKaryawan';
import DashboardAdmin from './components/DashboardAdmin';
import { RefreshCw } from 'lucide-react';

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  department: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Check if token exists in local storage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('sas_token');
    
    if (storedToken) {
      // Validate token with server to restore session
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      .then(res => {
        if (!res.ok) {
          throw new Error('Token expired or invalid');
        }
        return res.json();
      })
      .then(data => {
        setToken(storedToken);
        setUser(data.user);
      })
      .catch((err) => {
        console.warn("Session restore failed, clearing credentials:", err.message);
        localStorage.removeItem('sas_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsVerifying(false);
      });
    } else {
      setIsVerifying(false);
    }
  }, []);

  const handleLoginSuccess = (userToken: string, loggedInUser: AuthenticatedUser) => {
    localStorage.setItem('sas_token', userToken);
    setToken(userToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('sas_token');
    setToken(null);
    setUser(null);
  };

  // Loading Splash Screen while verifying token
  if (isVerifying) {
    return (
      <div id="loading_splash" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl animate-bounce mb-4">
          SAS
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Menghubungkan ke Portal Sinar Alam Semesta...</p>
        <RefreshCw className="w-5 h-5 text-teal-400 animate-spin mt-4" />
      </div>
    );
  }

  // Not logged in: Show elegant Login page
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in: Route based on role
  if (user.role === 'admin') {
    return (
      <DashboardAdmin 
        token={token} 
        user={user} 
        onLogout={handleLogout} 
      />
    );
  }

  // Otherwise, default to regular employee dashboard
  return (
    <DashboardKaryawan 
      token={token} 
      user={user} 
      onLogout={handleLogout} 
    />
  );
}

