
import React, { useState } from 'react';

interface LicenseActivationProps {
  reason?: 'TRIAL_ENDED' | 'LICENSE_EXPIRED' | 'NONE';
  onActivate: () => void;
}

const VALID_CODES = [
  'BARPOS-DEMO-001',
  'BARPOS-DEMO-012',
  'BARPOS-DEMO-023',
  'BARPOS-DEMO-2025-ABCD'
];

const LicenseActivation: React.FC<LicenseActivationProps> = ({ reason = 'NONE', onActivate }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    // Simulación de validación de servidor
    setTimeout(() => {
      const formattedCode = code.toUpperCase().trim();
      
      if (VALID_CODES.includes(formattedCode)) {
        const today = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(today.getDate() + 30); // 30 días calendario exactos

        const licenseData = {
          tipo: "MENSUAL",
          fechaInicio: today.toISOString(),
          fechaFin: expiryDate.toISOString(),
          estado: "ACTIVA",
          codigo: formattedCode
        };
        
        localStorage.setItem('barpos_licencia', JSON.stringify(licenseData));
        onActivate();
      } else {
        setError('Código inválido o ya utilizado.');
      }
      setIsValidating(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-3xl">
          <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl text-3xl mb-6 border ${
              reason === 'LICENSE_EXPIRED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              <i className={`fa-solid ${reason === 'LICENSE_EXPIRED' ? 'fa-calendar-xmark' : 'fa-lock'}`}></i>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight mb-3">
              {reason === 'LICENSE_EXPIRED' ? 'Licencia vencida' : 'Tu prueba ha finalizado'}
            </h1>
            
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              {reason === 'LICENSE_EXPIRED' 
                ? 'Licencia vencida, renueva para continuar.' 
                : 'Para seguir usando el sistema, activa tu licencia mensual.'}
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center">
                INGRESAR CÓDIGO DE ACTIVACIÓN
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if(error) setError('');
                  }}
                  className={`w-full px-6 py-5 bg-slate-950/50 border-2 rounded-2xl outline-none transition-all font-mono font-bold text-white tracking-widest text-center uppercase ${
                    error ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-white/5 focus:border-amber-500/50 focus:bg-slate-950'
                  }`}
                  placeholder="XXXX-XXXX"
                  required
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="flex items-center justify-center gap-2 text-rose-500 animate-in fade-in slide-in-from-top-2 mt-2">
                  <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isValidating || !code.trim()}
              className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/10 uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>VALIDANDO...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt-lightning"></i>
                  <span>ACTIVAR AHORA</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center mb-4">
              Demos Disponibles
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {VALID_CODES.map(c => (
                <button 
                  key={c}
                  type="button"
                  onClick={() => setCode(c)}
                  className="px-3 py-1.5 bg-slate-950/30 hover:bg-slate-950/80 text-slate-500 hover:text-amber-500 rounded-lg text-[9px] font-bold border border-white/5 transition-all"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-700 mt-8 text-[9px] font-black uppercase tracking-[0.3em]">
          &copy; 2025 BARPOS PRO SYSTEMS
        </p>
      </div>
    </div>
  );
};

export default LicenseActivation;
