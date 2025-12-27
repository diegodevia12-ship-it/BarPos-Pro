
import React, { useState, useEffect } from 'react';
import { User, CashSession, Table, TableOrder } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import CashManager from './components/CashManager';
import Reports from './components/Reports';
import AdminPanel from './components/AdminPanel';
import TablesManager from './components/TablesManager';
import SupplierInvoices from './components/SupplierInvoices';
import LicenseActivation from './components/LicenseActivation';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { demoStore } from './lib/demoStore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [appReady, setAppReady] = useState(false);
  
  const [hasAccess, setHasAccess] = useState(true);
  const [licenseReason, setLicenseReason] = useState<'TRIAL_ENDED' | 'LICENSE_EXPIRED' | 'NONE'>('NONE');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(5);
  
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrder] = useState<TableOrder | null>(null);
  
  useEffect(() => {
    // Función de arranque único, sin loops de reintento
    const startApp = () => {
      try {
        // Inicialización síncrona de datos demo
        demoStore.init();

        // Recuperación de sesión
        const sessionStr = localStorage.getItem('barpos_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (session && session.user) {
              setUser(session.user);
            }
          } catch (e) {
            console.warn("Sesión inválida en storage, limpiando...");
            localStorage.removeItem('barpos_session');
          }
        }

        // Estado inicial de caja
        setCashSession(demoStore.getCashSession());
      } catch (err) {
        // Los errores aquí serán capturados por el ErrorBoundary si fallan en render
        console.error("Fallo durante la inicialización de la App:", err);
      } finally {
        // Pequeño retardo artificial para asegurar que el navegador ha procesado el storage
        setTimeout(() => setAppReady(true), 300);
      }
    };
    
    startApp();
  }, []);

  const handleLogin = (u: User, token: string) => {
    // Actualizamos estado local inmediatamente, sin recargar la página
    setUser(u);
    localStorage.setItem('barpos_session', JSON.stringify({ user: u, token }));
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('barpos_session');
    setView('login');
  };

  const handleSelectTable = (table: Table, order?: TableOrder) => {
    setActiveTable(table);
    setActiveOrder(order || null);
    setView('pos');
  };

  const handleBackFromPOS = () => {
    setActiveTable(null);
    setActiveOrder(null);
    if (view === 'pos' && activeTable) setView('tables');
    else setView('dashboard');
  };

  // Pantalla de carga simple y estable
  if (!appReady) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Cargando BarPOS Pro...</p>
      </div>
    </div>
  );

  if (!hasAccess) return <LicenseActivation reason={licenseReason} onActivate={() => setHasAccess(true)} />;
  if (!user) return <Login onLogin={handleLogin} />;

  const renderView = () => {
    try {
      switch (view) {
        case 'dashboard': return <Dashboard user={user} setView={setView} cashSession={cashSession} />;
        case 'tables': return <TablesManager user={user} setView={setView} onSelectTableForOrder={handleSelectTable} onBack={() => setView('dashboard')} />;
        case 'pos': return <POS user={user} cashSession={cashSession} activeTable={activeTable} activeOrder={activeOrder} onBack={handleBackFromPOS} setView={setView} />;
        case 'inventory': return <Inventory user={user} onBack={() => setView('dashboard')} />;
        case 'supplier-invoices': return <SupplierInvoices user={user} onBack={() => setView('dashboard')} />;
        case 'cash': return <CashManager user={user} cashSession={cashSession} onOpen={(s)=>setCashSession(s)} onClose={()=>setCashSession(null)} onBack={() => setView('dashboard')} />;
        case 'reports': return <Reports user={user} onBack={() => setView('dashboard')} />;
        case 'admin': return <AdminPanel user={user} onBack={() => setView('dashboard')} />;
        default: return <Dashboard user={user} setView={setView} cashSession={cashSession} />;
      }
    } catch (e) {
      console.error("Error al renderizar vista:", view, e);
      return <Dashboard user={user} setView={setView} cashSession={cashSession} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout 
        user={user} 
        currentView={view} 
        setView={setView} 
        onLogout={handleLogout} 
        serverOnline={true}
        trialDaysLeft={trialDaysLeft}
      >
        {renderView()}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
