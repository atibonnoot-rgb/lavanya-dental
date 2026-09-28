import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Eye, EyeOff, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onAuthenticated: () => void;
}

const STORAGE_LOCKOUT_KEY = 'lavanya_admin_lockout_until';
const STORAGE_ATTEMPTS_KEY = 'lavanya_admin_failed_attempts';

// Cryptographic SHA-256 hash using native Web Crypto API
async function sha256Hex(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return parseInt(sessionStorage.getItem(STORAGE_ATTEMPTS_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    try {
      return parseInt(sessionStorage.getItem(STORAGE_LOCKOUT_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  // Clean memory on unmount
  useEffect(() => {
    return () => {
      setPassword('');
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check brute force lockout
    const now = Date.now();
    if (now < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - now) / 1000);
      setError(`Too many failed attempts. Security lockout active. Please wait ${remainingSecs}s.`);
      return;
    }

    setLoading(true);
    setError('');

    // 1. Sanitize & normalize inputs
    const sanitizedEmail = email.trim().toLowerCase().replace(/[<>'"]/g, '');
    const cleanPassword = password.trim();

    // Attack pattern / injection detector
    const attackPattern = /('|--|;|\/\*|\*\/|union\s+select|select\s+\*|drop\s+table|delete\s+from|<script>)/i;
    if (attackPattern.test(sanitizedEmail) || attackPattern.test(cleanPassword)) {
      setError('Security Alert: Malicious or illegal characters detected.');
      setPassword('');
      setLoading(false);
      return;
    }

    // Configured admin credentials with cryptographic SHA-256 hash comparison
    const TARGET_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'atibonnoot@gmail.com').toLowerCase();
    // SHA-256 hash of configured password (defaults to SHA-256 hash of '112233')
    const TARGET_ADMIN_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH || 'e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea').toLowerCase();

    let isAuthorized = false;

    // First: Verify against Supabase Auth backend if configured
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: cleanPassword,
        });
        if (!signInError && data?.session) {
          isAuthorized = true;
        }
      }
    } catch (err) {
      console.warn('Supabase auth session attempt:', err);
    }

    // Fallback: Cryptographic SHA-256 match against authorized admin email & hash
    if (!isAuthorized && sanitizedEmail === TARGET_ADMIN_EMAIL) {
      const inputHash = await sha256Hex(cleanPassword);
      if (inputHash === TARGET_ADMIN_HASH) {
        isAuthorized = true;
      }
    }

    if (isAuthorized) {
      setError('');
      setFailedAttempts(0);
      try {
        sessionStorage.removeItem(STORAGE_ATTEMPTS_KEY);
        sessionStorage.removeItem(STORAGE_LOCKOUT_KEY);
        // Set short-lived session token (expires on browser close)
        sessionStorage.setItem('lavanya_staff_session', Date.now().toString());
      } catch {}
      setPassword('');
      onAuthenticated();
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPassword('');
      try {
        sessionStorage.setItem(STORAGE_ATTEMPTS_KEY, nextAttempts.toString());
      } catch {}

      if (nextAttempts >= 5) {
        const lockTime = Date.now() + 60000;
        setLockoutUntil(lockTime);
        try {
          sessionStorage.setItem(STORAGE_LOCKOUT_KEY, lockTime.toString());
        } catch {}
        setError('Too many failed attempts. Temporary 60-second security lockout engaged.');
      } else {
        setError(`Access Denied: Invalid email or password. (${5 - nextAttempts} attempts remaining)`);
      }
    }

    setLoading(false);
  };

  const isLocked = Date.now() < lockoutUntil;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center p-4">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl shadow-black/40">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Doctor Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Encrypted clinic management access</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-rose-950/60 border border-rose-700/50 text-rose-300 rounded-xl p-3.5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  disabled={isLocked || loading}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLocked || loading}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
