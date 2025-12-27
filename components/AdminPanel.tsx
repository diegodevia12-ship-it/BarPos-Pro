import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminPanelProps {
  user: User;
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Configuración</h1>
          <p className="text-slate-500 font-medium">Administración de sistema y usuarios.</p>
        </div>
        <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-200/50 w-fit rounded-2xl">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          Usuarios
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          Ajustes
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rol</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <UserRow name="Admin Principal" username="admin" role="ADMIN" />
                <UserRow name="Juan Cajero" username="cajero" role="CASHIER" />
                <UserRow name="Pedro Mesero" username="waiter" role="WAITER" />
              </tbody>
           </table>
           <div className="p-4 bg-slate-50 flex justify-center">
             <button className="text-amber-600 font-black text-sm flex items-center gap-2 hover:bg-amber-100 px-4 py-2 rounded-xl transition-all">
               <i className="fa-solid fa-plus-circle"></i>
               Crear Nuevo Usuario
             </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-lg font-black text-slate-800 mb-2">Preferencias Generales</h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <div>
                    <p className="font-bold text-slate-700">Permitir Stock Negativo</p>
                    <p className="text-xs text-slate-400">Solo recomendado para periodos de alta demanda.</p>
                 </div>
                 <div className="w-12 h-6 bg-slate-300 rounded-full p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <div>
                    <p className="font-bold text-slate-700">Modo Ciego (Ocultar Totales)</p>
                    <p className="text-xs text-slate-400">Meseros no podrán ver el acumulado de caja.</p>
                 </div>
                 <div className="w-12 h-6 bg-amber-500 rounded-full p-1 cursor-pointer flex justify-end">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const UserRow = ({ name, username, role }: any) => (
  <tr className="hover:bg-slate-50">
    <td className="px-6 py-4 font-bold text-slate-800">{name}</td>
    <td className="px-6 py-4 text-slate-500">@{username}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
        role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
      }`}>
        {role}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button className="text-slate-300 hover:text-slate-600"><i className="fa-solid fa-ellipsis-vertical"></i></button>
    </td>
  </tr>
);

export default AdminPanel;