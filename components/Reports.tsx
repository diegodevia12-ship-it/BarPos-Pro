
import React, { useState, useEffect } from 'react';
import { User, Product } from '../types';
import { demoStore } from '../lib/demoStore';

interface ReportsProps {
  user: User;
  onBack: () => void;
}

const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [activeView, setActiveView] = useState<'kpi' | 'margin'>('kpi');
  const [summary, setSummary] = useState({ totalVentas: 0, totalCosto: 0, count: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      try {
        const sales = demoStore.getSales();
        const prods = demoStore.getProducts();
        
        let totalV = 0;
        let totalC = 0;
        
        sales.forEach(s => {
          totalV += (s.total || 0);
          const items = Array.isArray(s.items) ? s.items : [];
          items.forEach((i: any) => {
            totalC += ((i.qtyUnits || 0) * (i.unitCostSnapshot || 0)) + ((i.qtyMl || 0) * (i.mlCostSnapshot || 0));
          });
        });

        setSummary({ totalVentas: totalV, totalCosto: totalC, count: sales.length });
        setProducts(Array.isArray(prods) ? prods : []);
      } catch (err) {
        console.error('Error calculando reportes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const productsSafe = Array.isArray(products) ? products : [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center h-full space-y-4">
         <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Generando reportes...</p>
       </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Reportes Financieros</h1>
          <p className="text-slate-500 font-medium">Análisis profundo de rentabilidad y costos.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl">
          <button 
            onClick={() => setActiveView('kpi')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'kpi' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Ventas
          </button>
          <button 
            onClick={() => setActiveView('margin')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'margin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Márgenes
          </button>
          <button onClick={onBack} className="ml-4 p-2 text-slate-400 hover:text-slate-600 transition-all">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </div>

      {activeView === 'kpi' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReportStat title="Ventas Totales" value={formatCurrency(summary.totalVentas)} growth="+12%" color="amber" />
            <ReportStat title="Costo Estimado" value={formatCurrency(summary.totalCosto)} growth="-5%" color="indigo" />
            <ReportStat title="Utilidad Bruta" value={formatCurrency(summary.totalVentas - summary.totalCosto)} growth="+18%" color="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">Resumen de Operación</h3>
              <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Transacciones</span>
                    <span className="text-lg font-black text-slate-800">{summary.count}</span>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Ticket Promedio</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(summary.count > 0 ? summary.totalVentas / summary.count : 0)}</span>
                 </div>
              </div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
               <h3 className="text-[10px] font-black mb-8 uppercase text-amber-500">Nota del Sistema</h3>
               <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                 "Los datos mostrados en este reporte corresponden únicamente a la sesión demo actual. Los snapshots de costo se capturan en el momento exacto de cada venta para asegurar la fidelidad de la utilidad bruta histórica."
               </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Análisis de Margen por Producto</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Producto</th>
                  <th className="px-6 py-4 text-right">Costo Promedio</th>
                  <th className="px-6 py-4 text-right">Precio Venta</th>
                  <th className="px-6 py-4 text-right">Utilidad</th>
                  <th className="px-8 py-4 text-center">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productsSafe.map(p => {
                  const cost = p.unitMode === 'ML' ? (p.costPerMl || 0) : (p.costUnit || 0);
                  const price = p.unitMode === 'ML' ? (p.pricePerMl || 0) : (p.priceUnit || 0);
                  const profit = price - cost;
                  const margin = price > 0 ? (profit / price) * 100 : 0;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{p.category}</p>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-slate-500 text-xs">{formatCurrency(cost)}</td>
                      <td className="px-6 py-5 text-right font-black text-slate-800 text-xs">{formatCurrency(price)}</td>
                      <td className="px-6 py-5 text-right font-black text-emerald-600 text-xs">{formatCurrency(profit)}</td>
                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${margin > 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {margin.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportStat = ({ title, value, growth, color }: any) => {
  const colors: any = {
    amber: 'text-amber-500',
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">{growth}</span>
      </div>
      <h3 className={`text-3xl font-black tracking-tighter ${colors[color]}`}>{value}</h3>
    </div>
  );
};

export default Reports;
