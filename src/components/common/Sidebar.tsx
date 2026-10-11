import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Laptop, 
  Users, 
  ClipboardCheck,
  Building2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, itAssets, opnameSessions, user } = useInventory();

  // Count rental assets with upcoming expiration (within current year)
  const rentalAssets = itAssets.filter(a => a.ownershipType === 'SEWA');
  const brokenCount = itAssets.filter(a => a.condition === 'Rusak').length;
  
  // Count active opname discrepancies
  const activeSession = opnameSessions.find(s => s.status === 'IN_PROGRESS');
  const discrepanciesCount = activeSession 
    ? activeSession.items.filter(i => i.difference !== 0 && !i.reconciled).length 
    : 0;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Ringkasan Aset IT',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'it-assets',
      label: 'Inventaris Laptop & Hardware',
      icon: Laptop,
      badge: brokenCount > 0 ? `${brokenCount} Rusak` : `${rentalAssets.length} Sewa`,
      badgeTone: brokenCount > 0 ? 'rose' : 'blue'
    },
    {
      id: 'custody',
      label: 'Inventaris Pegawai & BAST',
      icon: Users,
      badge: null
    },
    {
      id: 'opname',
      label: 'Audit Stock Opname IT',
      icon: ClipboardCheck,
      badge: discrepanciesCount > 0 ? `${discrepanciesCount} Selisih` : null,
      badgeTone: 'rose'
    }
  ].filter(item => {
    if (user.role === 'VIEWER') return ['dashboard', 'custody'].includes(item.id);
    if (user.role === 'IT_SUPPORT') return ['dashboard', 'it-assets', 'custody'].includes(item.id);
    return true;
  });

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand title lockup in sidebar header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-amber-300 flex items-center justify-center font-black text-xs shadow-inner tracking-tight">
            PLN
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-wide uppercase">PLN NUSANTARA POWER</h1>
            <p className="text-[11px] font-semibold text-sky-400">UP SENGKANG • Aset IT</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Operasional IT
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium whitespace-nowrap leading-tight ${
                  item.badgeTone === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : item.badgeTone === 'rose'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                    : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick operational info */}
      <div className="p-4 m-3 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Fokus Operasional IT</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Mayoritas laptop berstatus sewa (rental vendor) dengan tanggal jatuh tempo terpantau. Serah terima pegawai terlacak via BAST & QR code.
        </p>
      </div>

      {/* Footer quiet information */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Sistem Aset IT Aktif</span>
        <span className="font-mono text-slate-400">v2.5</span>
      </div>
    </aside>
  );
};
