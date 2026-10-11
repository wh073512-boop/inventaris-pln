import React, { FormEvent, useState } from 'react';
import { KeyRound, LoaderCircle, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { setupRequired, error, refreshStatus, login, setupAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (setupRequired) {
        await setupAdmin(username, displayName, password);
      } else {
        await login(username, password);
      }
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Autentikasi gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xs font-black text-amber-300">PLN</div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-900">PLN Nusantara Power</p>
            <p className="text-xs font-semibold text-slate-500">UP Sengkang • Inventaris IT</p>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
            {setupRequired ? <ShieldCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {setupRequired ? 'Buat akun Super Admin' : 'Masuk ke Inventaris'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {setupRequired
                ? 'Akun pertama akan menjadi administrator utama aplikasi.'
                : 'Masuk menggunakan akun yang dibuat oleh administrator.'}
            </p>
          </div>
        </div>

        {(formError || error) && (
          <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {formError || error}
            {error && (
              <button onClick={() => void refreshStatus()} className="ml-2 font-semibold underline">
                Coba lagi
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {setupRequired && (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Nama administrator</span>
              <input
                required
                maxLength={160}
                autoComplete="name"
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Username</span>
            <input
              required
              minLength={3}
              maxLength={80}
              autoComplete="username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Kata sandi</span>
            <input
              required
              minLength={setupRequired ? 12 : undefined}
              type="password"
              autoComplete={setupRequired ? 'new-password' : 'current-password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {setupRequired && <span className="block text-xs text-slate-500">Minimal 12 karakter.</span>}
          </label>
          <button
            type="submit"
            disabled={submitting || Boolean(error)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {setupRequired ? 'Buat akun dan lanjutkan' : 'Masuk'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-slate-400">Sesi dilindungi dan aktivitas dibatasi berdasarkan role.</p>
      </section>
    </main>
  );
};
