
import React, { useState, useEffect } from 'react';
import { User, Product, MovementType, UnitMode } from '../types';
import { demoStore } from '../lib/demoStore';

interface InventoryProps {
  user: User;
  onBack: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ user, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<MovementType>(MovementType.IN);
  const [unit, setUnit] = useState<'UNIT' | 'ML'>('UNIT');

  // Estado para el modal de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(demoStore.getProducts());
  };

  const handleAdjust = () => {
    if (!selectedProduct) return;
    const qty = parseFloat(amount);
    if (isNaN(qty) || qty <= 0) return alert("Cantidad inválida");

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        const newP = { ...p };
        if (unit === 'UNIT') {
          newP.stockUnits += (type === MovementType.IN ? qty : -qty);
        } else {
          newP.stockMl += (type === MovementType.IN ? qty : -qty);
        }
        return newP;
      }
      return p;
    });

    demoStore.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setAmount('');
    setSelectedProduct(null);
    alert("Inventario actualizado localmente");
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({ ...product });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Validaciones básicas
    if (!editForm.name?.trim()) return alert("El nombre es obligatorio");
    if ((editForm.costUnit || 0) < 0 || (editForm.priceUnit || 0) < 0 || (editForm.costPerMl || 0) < 0 || (editForm.pricePerMl || 0) < 0) {
      return alert("Los valores no pueden ser negativos");
    }

    const updatedProducts = products.map(p => {
      if (p.id === editingProduct.id) {
        return { ...p, ...editForm } as Product;
      }
      return p;
    });

    demoStore.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setEditingProduct(null);
    alert("Producto actualizado con éxito");
  };

  const categories = ['Cervezas', 'Licores', 'Bebidas', 'Snacks', 'Cocteles', 'Otros'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Inventario Demo</h1>
          <p className="text-slate-500 font-medium">Gestiona existencias y configura precios/costos.</p>
        </div>
        <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all text-slate-400">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">ML</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black uppercase text-slate-800">{p.name}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">{p.category} • {p.active ? 'Activo' : 'Inactivo'}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-slate-700">{p.unitMode === UnitMode.ML ? '-' : p.stockUnits}</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-slate-700">{p.unitMode === UnitMode.UNIT ? '-' : `${p.stockMl} ml`}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(p)} 
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Editar parámetros"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button 
                          onClick={() => setSelectedProduct(p)} 
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                          title="Ajustar stock"
                        >
                          <i className="fa-solid fa-plus-minus"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 tracking-widest text-slate-400">
            <i className="fa-solid fa-bolt text-amber-500"></i> Ajuste Rápido
          </h3>
          {selectedProduct ? (
            <div className="space-y-5 animate-in slide-in-from-right-2">
              <div className="p-4 bg-slate-900 text-white rounded-2xl">
                <p className="text-[8px] font-black uppercase text-amber-500 mb-1">Ajustando Stock de:</p>
                <p className="font-black text-xs uppercase tracking-tight truncate">{selectedProduct.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setType(MovementType.IN)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${type === MovementType.IN ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>Entrada</button>
                <button onClick={()=>setType(MovementType.OUT)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${type === MovementType.OUT ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>Salida</button>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Modo de ajuste</label>
                <select value={unit} onChange={(e)=>setUnit(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-transparent focus:border-amber-500 rounded-2xl font-black text-xs outline-none appearance-none">
                  {selectedProduct.unitMode !== UnitMode.ML && <option value="UNIT">UNIDADES</option>}
                  {selectedProduct.unitMode !== UnitMode.UNIT && <option value="ML">MILILITROS (ML)</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cantidad a {type === MovementType.IN ? 'Sumar' : 'Restar'}</label>
                <input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full p-5 bg-slate-50 border border-transparent focus:border-amber-500 rounded-2xl text-2xl font-black text-center outline-none" />
              </div>
              <button onClick={handleAdjust} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all">Aplicar Ajuste</button>
              <button onClick={()=>setSelectedProduct(null)} className="w-full text-[9px] font-black text-slate-400 uppercase hover:text-slate-600 transition-all">Cancelar</button>
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 opacity-30">
              <i className="fa-solid fa-hand-pointer text-4xl text-slate-200"></i>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona un producto<br/>para ajustar stock</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingProduct(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
              <i className="fa-solid fa-times text-xl"></i>
            </button>
            
            <div className="mb-10">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Editar Producto</h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Configuración de Catálogo y Precios</p>
            </div>

            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.name || ''} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                <select 
                  value={editForm.category || 'Otros'} 
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-xs outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Modo de Venta</label>
                <select 
                  value={editForm.unitMode || UnitMode.UNIT} 
                  onChange={(e) => setEditForm({...editForm, unitMode: e.target.value as UnitMode})}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-xs outline-none"
                >
                  <option value={UnitMode.UNIT}>Unidades</option>
                  <option value={UnitMode.ML}>Mililitros</option>
                  <option value={UnitMode.BOTH}>Ambos (Unid/ML)</option>
                </select>
              </div>

              {/* CAMPOS UNIDAD */}
              {editForm.unitMode !== UnitMode.ML && (
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="md:col-span-3 mb-2">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Parámetros por Unidad</p>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Costo Compra</label>
                    <input type="number" step="0.01" value={editForm.costUnit ?? 0} onChange={(e)=>setEditForm({...editForm, costUnit: parseFloat(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center text-xs outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Precio Venta</label>
                    <input type="number" step="0.01" value={editForm.priceUnit ?? 0} onChange={(e)=>setEditForm({...editForm, priceUnit: parseFloat(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-center text-xs text-emerald-600 outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Stock Mínimo</label>
                    <input type="number" value={editForm.minStockUnits ?? 5} onChange={(e)=>setEditForm({...editForm, minStockUnits: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center text-xs outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}

              {/* CAMPOS ML */}
              {editForm.unitMode !== UnitMode.UNIT && (
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="md:col-span-3 mb-2">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Parámetros por ML</p>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Costo por ML</label>
                    <input type="number" step="0.01" value={editForm.costPerMl ?? 0} onChange={(e)=>setEditForm({...editForm, costPerMl: parseFloat(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center text-xs outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Precio por ML</label>
                    <input type="number" step="0.01" value={editForm.pricePerMl ?? 0} onChange={(e)=>setEditForm({...editForm, pricePerMl: parseFloat(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-center text-xs text-emerald-600 outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Stock Mín. (ML)</label>
                    <input type="number" value={editForm.minStockMl ?? 750} onChange={(e)=>setEditForm({...editForm, minStockMl: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center text-xs outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editForm.active} 
                    onChange={(e) => setEditForm({...editForm, active: e.target.checked})}
                    className="w-5 h-5 accent-amber-500 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-600">Producto Habilitado / Activo</span>
                </label>
              </div>

              <div className="md:col-span-2 pt-6 flex gap-4">
                <button 
                  type="submit" 
                  className="flex-1 py-5 bg-slate-900 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-save mr-2"></i> Guardar Cambios
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-[2rem] uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
