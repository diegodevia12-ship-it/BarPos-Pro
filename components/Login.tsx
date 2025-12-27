
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { apiRequest } from '../lib/api';

interface LoginProps {
  onLogin: (u: User, token: string) => void;
}

const DEMO_MODE = true;

const DEMO_USERS: Record<string, { pin: string; role: UserRole; name: string }> = {
  admin: { pin: "1234", role: UserRole.ADMIN, name: "Admin Bar" },
  cajero: { pin: "1234", role: UserRole.CASHIER, name: "Juan Cajero" },
  mesero: { pin: "1234", role: UserRole.WAITER, name: "Pedro Mesero" },
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const u = username.trim().toLowerCase();
      const p = pin.trim();

      if (DEMO_MODE) {
        const demoUser = DEMO_USERS[u];
        if (!demoUser || demoUser.pin !== p) {
          throw new Error("Usuario o PIN incorrectos");
        }

        const userData: User = {
          id: `demo-${u}`,
          name: demoUser.name,
          username: u,
          role: demoUser.role,
          active: true,
          createdAt: new Date().toISOString()
        };

        // En lugar de window.location.href, solo llamamos a onLogin
        // El componente App reaccionará al cambio de estado de 'user'
        onLogin(userData, "demo-token");
        return;
      }

      // Lógica real (usualmente no se llega aquí por DEMO_MODE = true)
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, pin: p })
      }) as { user: User; token: string };
      
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Visual Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500 text-slate-900 text-4xl mb-6 shadow-2xl shadow-amber-500/20">
            <i className="fa-solid fa-beer-mug-empty"></i>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">
            BarPOS <span className="text-amber-500">Pro</span>
          </h1>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[9px] tracking-[0.2em]">
            Terminal de Acceso Seguro
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ID de Usuario</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none transition-all font-bold text-slate-700"
                  placeholder="admin, cajero..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PIN Secreto</label>
              <div className="relative">
                <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none transition-all font-black text-center text-2xl tracking-[1rem]"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <i className="fa-solid fa-circle-exclamation text-rose-500 text-xs"></i>
                <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-right-to-bracket"></i>}
              <span>{loading ? 'VALIDANDO...' : 'ENTRAR AL SISTEMA'}</span>
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
           {Object.keys(DEMO_USERS).map(u => (
             <button 
               key={u}
               type="button" 
               onClick={() => { setUsername(u); setPin('1234'); }} 
               className="text-[9px] font-black text-slate-600 uppercase hover:text-amber-500 transition-all border border-slate-800 px-3 py-2 rounded-xl bg-slate-900/50"
             >
               {u} (1234)
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
