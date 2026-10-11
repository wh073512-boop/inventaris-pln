import React, { FormEvent, useEffect, useState } from 'react';
import { LoaderCircle, Plus, Shield, Trash2, UserCog, X } from 'lucide-react';
import { AuthUser, UserRole, useAuth } from '../../context/AuthContext';

interface ManagedUser extends AuthUser {
  isActive: boolean;
  createdAt: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin / IT Admin',
  IT_SUPPORT: 'IT Support / Teknisi',
  VIEWER: 'Viewer / Auditor',
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { request } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadUsers = async () => {
    const result = await request<{ users: ManagedUser[] }>('auth.php?action=users');
    setUsers(result.users);
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    void loadUsers().catch(cause => {
      setError(cause instanceof Error ? cause.message : 'Gagal memuat akun.');
    });
  }, [isOpen]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await request('auth.php?action=users', {
        method: 'POST',
        body: JSON.stringify({ username, displayName, password, role }),
      });
      setUsername('');
      setDisplayName('');
      setPassword('');
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal membuat akun.');
    } finally {
      setBusy(false);
    }
  };

  const updateUser = async (user: ManagedUser, values: Partial<Pick<ManagedUser, 'role' | 'isActive'>>) => {
    setBusy(true);
    setError(null);
    try {
      await request(`auth.php?action=users&id=${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      });
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui akun.');
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    if (!window.confirm(`Hapus akun ${user.displayName} (${user.username})?`)) return;
    setBusy(true);
    setError(null);
    try {
      await request(`auth.php?action=users&id=${user.id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menghapus akun.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="users-title">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><UserCog className="h-5 w-5" /></div>
            <div>
              <h2 id="users-title" className="font-bold text-slate-900">Pengelolaan Pengguna & Hak Akses</h2>
              <p className="text-xs text-slate-500">Buat akun, atur role, atau nonaktifkan akses.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.25fr]">
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Plus className="h-4 w-4" />Tambah akun</h3>
            {[
              { label: 'Nama', value: displayName, set: setDisplayName, autoComplete: 'name' },
              { label: 'Username', value: username, set: setUsername, autoComplete: 'username' },
            ].map(field => (
              <label key={field.label} className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">{field.label}</span>
                <input required maxLength={field.label === 'Nama' ? 160 : 80} value={field.value} autoComplete={field.autoComplete} onChange={event => field.set(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </label>
            ))}
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Kata sandi sementara (min. 12 karakter)</span>
              <input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Role</span>
              <select value={role} onChange={event => setRole(event.target.value as UserRole)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}Buat akun
            </button>
          </form>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Shield className="h-4 w-4" />Daftar akun</h3>
            {users.map(account => (
              <div key={account.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{account.displayName}</p>
                    <p className="text-xs text-slate-500">@{account.username}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${account.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {account.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select disabled={busy} value={account.role} onChange={event => void updateUser(account, { role: event.target.value as UserRole })} className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                    {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <button disabled={busy} onClick={() => void updateUser(account, { isActive: !account.isActive })} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">
                    {account.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button disabled={busy} onClick={() => void deleteUser(account)} aria-label={`Hapus akun ${account.username}`} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="mx-5 mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      </section>
    </div>
  );
};
