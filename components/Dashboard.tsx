
import React, { useEffect, useState } from 'react';
import { User, CashSession, CashStatus, Table } from '../types';
import { demoStore } from '../lib/demoStore';

interface DashboardProps {
  user: User;
  setView: (v: string) => void;
  cashSession: CashSession | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setView, cashSession }) => {
  const [stats, setStats] = useState({ totalVentas: 0, count: 0 });
  const [activeTablesCount, setActiveTablesCount] = useState(0);
  const [showWelcomeNotice, setShowWelcomeNotice] = useState(false);
  const isCashOpen = !!cashSession;

  useEffect(() => {
    const sales = demoStore.getSales();
    const tables = demoStore.getTables();
    
    setStats({
      totalVentas: sales.reduce((acc, s) => acc + s.total, 0),
      count: sales.length
    });
    
    setActiveTablesCount(tables.filter(t => t.status === 'OCCUPIED').length);

    // Verificar si se debe mostrar el aviso de bienvenida
    const welcomeDismissed = localStorage.getItem('barpos_welcome_dismissed');
    if (!welcomeDismissed && !isCashOpen) {
      setShowWelcomeNotice(true);
    }
  }, [cashSession]);

  const handleDismissWelcome = () => {
    localStorage.setItem('barpos_welcome_dismissed', 'true');
    setShowWelcomeNotice(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">¡Bienvenido, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Modo DEMO 100% Operativo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-[9px] font-black border transition-all ${isCashOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <span className={`w-2 h-2 rounded-full ${isCashOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            CAJA {isCashOpen ? 'ABIERTA' : 'CERRADA'}
          </div>
          <button onClick={() => setView('tables')} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 uppercase text-[10px] tracking-widest">
            Mesas
          </button>
        </div>
      </header>

      {/* Aviso de Bienvenida */}
      {showWelcomeNotice && (
        <div className="bg-amber-500 text-slate-900 p-6 rounded-[2rem] shadow-xl border border-amber-400 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-tight mb-1">Recordatorio de Operación</h3>
              <p className="text-xs font-bold leading-relaxed opacity-90">
                Antes de comenzar a vender, recuerda abrir la caja. Al finalizar el día, cierra la caja para cuadrar la jornada y asegurar el control de tus finanzas.
              </p>
            </div>
            <button onClick={handleDismissWelcome} className="px-4 py-2 bg-slate-900 text-white font-black rounded-xl text-[9px] uppercase tracking-widest active:scale-95 transition-all">
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Ventas Hoy" value={formatCurrency(stats.totalVentas)} icon="fa-sack-dollar" color="amber" />
        <StatCard title="Mesas Ocupadas" value={activeTablesCount.toString()} icon="fa-utensils" color="indigo" />
        <StatCard title="Pedidos" value={stats.count.toString()} icon="fa-receipt" color="emerald" />
        <StatCard title="Saldo Caja" value={formatCurrency(isCashOpen ? cashSession.closingExpected : 0)} icon="fa-vault" color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border">
          <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-widest">Accesos Rápidos</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            <QuickAction icon="fa-cash-register" label="POS" color="bg-amber-100 text-amber-600" onClick={() => setView('pos')} />
            <QuickAction icon="fa-th-large" label="Mesas" color="bg-indigo-100 text-indigo-600" onClick={() => setView('tables')} />
            <QuickAction icon="fa-boxes-stacked" label="Stock" color="bg-emerald-100 text-emerald-600" onClick={() => setView('inventory')} />
            <QuickAction icon="fa-vault" label="Caja" color="bg-slate-100 text-slate-600" onClick={() => setView('cash')} />
            <QuickAction icon="fa-chart-pie" label="Reportes" color="bg-rose-100 text-rose-600" onClick={() => setView('reports')} />
            <QuickAction icon="fa-rotate" label="Reset" color="bg-red-50 text-red-400" onClick={() => { if(confirm("¿Borrar todo?")) demoStore.reset() }} />
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
           <h3 className="text-[10px] font-black mb-8 uppercase text-amber-500">Resumen de Caja</h3>
           <div className="space-y-4">
              <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black uppercase text-slate-500">Saldo Real Estimado</span>
                <span className="font-bold">{formatCurrency(isCashOpen ? cashSession.closingExpected : 0)}</span>
              </div>
              <button onClick={() => setView('cash')} className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest">Abrir/Cerrar Caja</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${color === 'amber' ? 'bg-amber-50 text-amber-500' : color === 'indigo' ? 'bg-indigo-50 text-indigo-500' : color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-500'}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div>
      <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-lg font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

const QuickAction = ({ icon, label, color, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${color}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter text-center">{label}</span>
  </button>
);

export default Dashboard;
