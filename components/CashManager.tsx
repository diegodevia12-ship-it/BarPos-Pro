
import React, { useState, useEffect } from 'react';
import { User, CashSession } from '../types';
import { demoStore } from '../lib/demoStore';

interface CashManagerProps {
  user: User;
  cashSession: CashSession | null;
  onOpen: (s: CashSession) => void;
  onClose: () => void;
  onBack: () => void;
}

const CashManager: React.FC<CashManagerProps> = ({ user, cashSession, onOpen, onClose, onBack }) => {
  const [openingAmount, setOpeningAmount] = useState('50000');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [realAmount, setRealAmount] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const handleOpen = () => {
    const amt = parseFloat(openingAmount);
    if (isNaN(amt)) return alert("Monto base inválido");
    const session = demoStore.openCash(amt, user.id);
    onOpen(session);
    alert("Caja abierta localmente. ¡Turno iniciado!");
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) return alert("Monto inválido");
    demoStore.addCashMovement(amt, false);
    setExpenseAmount('');
    alert("Gasto registrado exitosamente.");
  };

  const handleClose = () => {
    const amt = parseFloat(realAmount);
    if (isNaN(amt)) return alert("Ingresa el monto real contado");
    const closed = demoStore.closeCash(amt, user.id);
    if (closed) {
      alert(`Cierre de jornada exitoso. Todas las ventas quedaron registradas correctamente. Diferencia: ${formatCurrency(closed.difference || 0)}`);
      onClose();
      onBack();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800">Caja</h1>
        <button onClick={onBack} className="p-3 bg-white border rounded-2xl"><i className="fa-solid fa-arrow-left"></i></button>
      </div>

      {!cashSession ? (
        <div className="bg-white p-10 rounded-3xl shadow-xl border text-center max-w-sm mx-auto">
          <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6"><i className="fa-solid fa-vault"></i></div>
          <h2 className="text-xl font-black mb-6 uppercase">Apertura de Turno</h2>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Base Inicial (COP)</label>
          <input type="number" value={openingAmount} onChange={(e)=>setOpeningAmount(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl text-2xl font-black text-center mb-6" />
          <button onClick={handleOpen} className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-2xl uppercase text-[10px]">Abrir Caja Ahora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Saldo Esperado</p>
                 <h2 className="text-4xl font-black mb-6 tracking-tighter">{formatCurrency(cashSession.closingExpected)}</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-slate-500 uppercase">Base</p>
                       <p className="font-bold text-xs">{formatCurrency(cashSession.openingAmount)}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-slate-500 uppercase">Ventas</p>
                       <p className="font-bold text-xs">{formatCurrency(cashSession.closingExpected - cashSession.openingAmount)}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border">
                 <h3 className="text-xs font-black uppercase mb-4">Gasto / Egreso</h3>
                 <div className="flex gap-2">
                    <input type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="0" className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold" />
                    <button onClick={handleAddExpense} className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-[10px] uppercase">Gastar</button>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><i className="fa-solid fa-lock text-rose-500"></i> Cierre de Turno</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Cuenta el dinero físico en el cajón e ingresa el total.</p>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Total Contado Real</label>
              <input type="number" value={realAmount} onChange={(e)=>setRealAmount(e.target.value)} placeholder="0" className="w-full p-4 bg-slate-50 border rounded-2xl text-2xl font-black text-center mb-6" />
              <button onClick={handleClose} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl">Cerrar Caja Definitivamente</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CashManager;
