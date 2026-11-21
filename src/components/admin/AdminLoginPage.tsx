import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { adminProfile, loading, authError, signInWithCredentials, clearAuthError } =
    useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (!loading && adminProfile && !loginSuccess) {
      onNavigate('/admin/dashboard');
    }
  }, [loading, adminProfile, loginSuccess, onNavigate]);

  const validate = (): boolean => {
    const nextErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      nextErrors.username = 'Please enter your administrator username.';
    }
    if (!password) {
      nextErrors.password = 'Please enter your administrator password.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    if (!validate()) return;

    setSubmitting(true);
    const result = await signInWithCredentials(username, password);
    setSubmitting(false);

    if (result.ok) {
      setLoginSuccess(true);
      setTimeout(() => {
        onNavigate('/admin/dashboard');
      }, 450);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Subtle Ambient Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(139,92,246,0.1),transparent_45%)]"
      />

      <div className="relative z-10">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#111827] px-3.5 py-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Portfolio</span>
        </button>
      </div>

      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-2xl border border-slate-800 bg-[#111827]/95 backdrop-blur-xl p-7 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#3B82F6]">
                Administrator Login
              </p>
              <h1 className="text-lg font-semibold text-[#F8FAFC]">Portfolio Admin System</h1>
            </div>
          </div>

          <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
            Sign in with your administrator credentials to manage portfolio content, active PDF
            resumes, enquiries, and visitor analytics.
          </p>

          {authError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-xs text-red-200"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-200">{authError}</p>
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="mt-1 text-[11px] underline text-red-300 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {loginSuccess && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center gap-2.5 text-xs text-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">
                Authentication successful. Redirecting to dashboard...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-[#94A3B8] mb-1.5"
              >
                Username
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                disabled={submitting || loginSuccess}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                  if (authError) clearAuthError();
                }}
                placeholder="Enter your username"
                aria-invalid={Boolean(fieldErrors.username)}
                className={`w-full rounded-xl border bg-[#080B14] px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none transition-colors ${
                  fieldErrors.username
                    ? 'border-red-500/70 focus:border-red-400'
                    : 'border-slate-800 focus:border-[#3B82F6]'
                }`}
              />
              {fieldErrors.username && (
                <p className="mt-1.5 text-xs text-red-400">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#94A3B8] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={submitting || loginSuccess}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (authError) clearAuthError();
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={`w-full rounded-xl border bg-[#080B14] pl-3.5 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none transition-colors ${
                    fieldErrors.password
                      ? 'border-red-500/70 focus:border-red-400'
                      : 'border-slate-800 focus:border-[#3B82F6]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-[#F8FAFC] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || loading || loginSuccess}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:brightness-110 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Signed In</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-[#94A3B8]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Protected by backend credential verification &amp; encrypted sessions.</span>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-slate-500">
        Abhinav P — Portfolio Management &amp; Analytics Platform
      </footer>
    </div>
  );
};
