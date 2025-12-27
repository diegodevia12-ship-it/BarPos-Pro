
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  // Marking children as optional to satisfy JSX attribute validation in consumers like App.tsx
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Explicitly extending React.Component with Props and State to ensure this.state and this.props are recognized
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Initializing state in constructor to satisfy base class expectations
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por Boundary:', error, errorInfo);
  }

  private handleReset = () => {
    if (confirm("¿Estás seguro? Esto borrará todos los datos locales para solucionar el error.")) {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("barpos_")) localStorage.removeItem(k);
      });
      window.location.reload();
    }
  };

  private handleRetry = () => {
    window.location.reload();
  };

  public render() {
    // Accessing hasError and error from this.state which is now correctly inherited
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="bg-white max-w-lg w-full rounded-[3rem] p-12 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner">
              <i className="fa-solid fa-bug"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Se detectó un error al cargar BarPOS
            </h1>
            <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
              <p className="text-slate-500 text-xs font-mono break-words leading-relaxed">
                {this.state.error?.message || "Error de renderizado desconocido"}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={this.handleReset}
                className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
              >
                Restablecer DEMO (Borrar Datos)
              </button>
              <button 
                onClick={this.handleRetry}
                className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all"
              >
                Reintentar Carga
              </button>
            </div>
            <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
              BARPOS PRO SYSTEMS • CRITICAL PROTECTION
            </p>
          </div>
        </div>
      );
    }

    // Correctly accessing children from this.props inherited from React.Component
    return this.props.children;
  }
}

export default ErrorBoundary;
