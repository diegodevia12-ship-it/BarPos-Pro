
import React from 'react';
import { User, UserRole } from '../types';
import { IS_DEMO } from '../lib/api';

interface LayoutProps {
  user: User;
  currentView: string;
  setView: (v: string) => void;
  onLogout: () => void;
  serverOnline?: boolean;
  trialDaysLeft?: number | null;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  currentView, 
  setView, 
  onLogout, 
  serverOnline = true, 
  trialDaysLeft,
  children 
}) => {
  const isOnline = IS_DEMO || serverOnline;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-amber-500">BarPOS<span className="text-white">Pro</span></h1>
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`}></div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user.role}</p>
            {IS_DEMO && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 font-black">DEMO</span>}
          </div>
        </div>

        {/* Banner de Prueba Gratuita */}
        {trialDaysLeft !== null && trialDaysLeft !== undefined && (
          <div className="mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-clock text-amber-500 text-[10px]"></i>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Periodo de Prueba</p>
            </div>
            <p className="text-[11px] font-bold text-white leading-tight">
              Te quedan <span className="text-amber-500 font-black">{trialDaysLeft} días</span> de prueba.
            </p>
          </div>
        )}

        <nav className="mt-2 px-4 space-y-1 flex-1">
          <NavItem active={currentView === 'dashboard'} onClick={() => setView('dashboard')} icon="fa-chart-line" label="Dashboard" />
          <NavItem active={currentView === 'tables'} onClick={() => setView('tables')} icon="fa-th-large" label="Mesas" />
          <NavItem active={currentView === 'pos'} onClick={() => setView('pos')} icon="fa-cash-register" label="Punto de Venta" />
          {(user.role === UserRole.ADMIN || user.role === UserRole.CASHIER) && <NavItem active={currentView === 'cash'} onClick={() => setView('cash')} icon="fa-vault" label="Caja" />}
          {user.role === UserRole.ADMIN && (
            <>
              {/* Fix: Added missing closing parenthesis in onClick arrow function */}
              <NavItem active={currentView === 'supplier-invoices'} onClick={() => setView('supplier-invoices')} icon="fa-file-invoice" label="Compras / Proveedores" />
              <NavItem active={currentView === 'inventory'} onClick={() => setView('inventory')} icon="fa-boxes-stacked" label="Inventario" />
              <NavItem active={currentView === 'reports'} onClick={() => setView('reports')} icon="fa-file-invoice-dollar" label="Reportes" />
              <NavItem active={currentView === 'admin'} onClick={() => setView('admin')} icon="fa-users-cog" label="Configuración" />
            </>
          )}
        </nav>

        <div className="mt-auto p-6 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-amber-500/20">{user.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate leading-none mb-1">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase">@{user.username}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-3 px-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white transition-all rounded-xl flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-widest">
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Salir</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 h-screen p-4 md:p-8">{children}</main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all uppercase text-[11px] tracking-tight ${active ? 'bg-amber-500 text-slate-900 font-black shadow-lg shadow-amber-500/20 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white font-bold'}`}>
    <i className={`fa-solid ${icon} w-5 text-sm`}></i>
    <span>{label}</span>
  </button>
);

export default Layout;