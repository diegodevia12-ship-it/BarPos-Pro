
import React, { useState, useEffect } from 'react';
import { Table, TableOrder, User, TableStatus, OrderStatus } from '../types';
import { demoStore } from '../lib/demoStore';

interface TablesManagerProps {
  user: User;
  setView: (v: string) => void;
  onSelectTableForOrder: (table: Table, order?: TableOrder) => void;
  onBack: () => void;
}

const TablesManager: React.FC<TablesManagerProps> = ({ user, setView, onSelectTableForOrder, onBack }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<TableOrder | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = demoStore.getTables();
    setTables(Array.isArray(data) ? data : []);
  };

  const handleTableClick = (table: Table) => {
    if (!table) return;
    setSelectedTable(table);
    if (table.status === TableStatus.OCCUPIED) {
      const order = demoStore.getOpenOrderByTable(table.id);
      setCurrentOrder(order || null);
    } else {
      setCurrentOrder(null);
    }
  };

  const handleOpenTable = () => {
    if (!selectedTable) return;
    try {
      const order = demoStore.openTable(selectedTable.id);
      onSelectTableForOrder(selectedTable, order);
    } catch (e) {
      alert("Error al abrir mesa");
    }
  };

  const handleAddItems = () => {
    if (!selectedTable || !currentOrder) return;
    onSelectTableForOrder(selectedTable, currentOrder);
  };

  const handleCancelOrder = () => {
    if (!selectedTable) return;
    if (confirm("¿Estás seguro de cancelar todo el pedido de esta mesa?")) {
      demoStore.cancelTable(selectedTable.id);
      setSelectedTable(null);
      setCurrentOrder(null);
      loadData();
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      {/* Grid de Mesas */}
      <div className="flex-1 flex flex-col space-y-8 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Mapa de Mesas</h1>
            <p className="text-slate-500 font-medium">Gestión de comandas y cuentas abiertas.</p>
          </div>
          <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 content-start pb-8">
          {tables.map(table => {
            const isSelected = selectedTable?.id === table.id;
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`relative group aspect-square rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-xl active:scale-95 ${
                  isSelected ? 'ring-4 ring-amber-500/20 scale-105' : ''
                } ${
                  table.status === TableStatus.AVAILABLE 
                  ? 'bg-white border-slate-100 hover:border-emerald-300' 
                  : 'bg-rose-500 border-rose-600 shadow-rose-200'
                }`}
              >
                <div className={`absolute top-6 left-6 w-3 h-3 rounded-full border-2 border-white ${table.status === TableStatus.AVAILABLE ? 'bg-emerald-400' : 'bg-white animate-pulse'}`}></div>
                <span className={`text-4xl font-black mb-1 ${table.status === TableStatus.AVAILABLE ? 'text-slate-800' : 'text-white'}`}>{table.number}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${table.status === TableStatus.AVAILABLE ? 'text-slate-300' : 'text-white/70'}`}>
                  {table.status === TableStatus.AVAILABLE ? 'Libre' : 'En consumo'}
                </span>
                {table.status === TableStatus.OCCUPIED && (
                  <div className="mt-2 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black text-white uppercase tracking-tighter">
                    Ocupada
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle Comanda lateral */}
      <div className="w-96 bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {!selectedTable ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl">
              <i className="fa-solid fa-hand-pointer"></i>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona una mesa<br/>para gestionar</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-4">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mesa {selectedTable.number}</h2>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {selectedTable.status === TableStatus.AVAILABLE ? 'Mesa Disponible' : 'Mesa en Servicio'}
                </p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-slate-300 hover:text-slate-600">
                <i className="fa-solid fa-times-circle text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {selectedTable.status === TableStatus.AVAILABLE ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-slate-800 uppercase text-xs">Mesa Lista</h3>
                    <p className="text-[10px] text-slate-400 font-medium">No hay pedidos activos actualmente.</p>
                  </div>
                  <button 
                    onClick={handleOpenTable}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Abrir Comanda
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consumo Actual</h3>
                    <div className="space-y-3">
                      {currentOrder?.items.length === 0 ? (
                        <p className="text-center py-8 text-[10px] font-bold text-slate-300 italic">Mesa abierta sin productos</p>
                      ) : (
                        currentOrder?.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3">
                            <div>
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{item.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                {item.unitMode === 'UNIT' ? `${item.qtyUnits} unid.` : `${item.qtyMl} ml`} 
                                <span className="ml-1 text-slate-200">•</span>
                                <span className="ml-1">{formatCurrency(item.price)}</span>
                              </p>
                            </div>
                            <span className="text-xs font-black text-slate-900">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Parcial</span>
                    <span className="text-2xl font-black text-amber-500 tracking-tighter">{formatCurrency(currentOrder?.total || 0)}</span>
                  </div>

                  <div className="space-y-3 pt-6">
                    <button 
                      onClick={handleAddItems}
                      className="w-full py-5 bg-indigo-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/10 active:scale-95 transition-all"
                    >
                      Agregar Productos
                    </button>
                    <button 
                      onClick={() => onSelectTableForOrder(selectedTable, currentOrder!)}
                      className="w-full py-5 bg-amber-500 text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/10 active:scale-95 transition-all"
                    >
                      Pagar / Cerrar Cuenta
                    </button>
                    <button 
                      onClick={handleCancelOrder}
                      className="w-full py-3 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                    >
                      Cancelar Pedido
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TablesManager;
