
import React, { useState, useEffect, useMemo } from 'react';
import { Product, SupplierInvoice, User, UnitMode } from '../types';
import { demoStore } from '../lib/demoStore';

interface SupplierInvoicesProps {
  user: User;
  onBack: () => void;
}

interface ItemForm {
  productId: string;
  qty: number;
  unitCost: number;
  unitMode: UnitMode;
}

const SupplierInvoices: React.FC<SupplierInvoicesProps> = ({ user, onBack }) => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Form states Factura
  const [supplierName, setSupplierName] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateCostsOnSave, setUpdateCostsOnSave] = useState(true);

  // Form states Nuevo Producto
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('Cervezas');
  const [newProdMode, setNewProdMode] = useState<UnitMode>(UnitMode.UNIT);
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');

  useEffect(() => { loadLocalData(); }, []);

  const loadLocalData = () => {
    setLoading(true);
    try {
      setInvoices(demoStore.getPurchases());
      setProducts(demoStore.getProducts());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', qty: 0, unitCost: 0, unitMode: UnitMode.UNIT }]);
  };

  const updateItem = (index: number, field: keyof ItemForm, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Si cambia el producto, auto-detectar su modo de venta
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.unitMode = prod.unitMode === UnitMode.BOTH ? UnitMode.UNIT : prod.unitMode;
        item.unitCost = prod.unitMode === UnitMode.ML ? (prod.costPerMl || 0) : (prod.costUnit || 0);
      }
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateTotal = () => items.reduce((acc, item) => acc + (item.qty * item.unitCost), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Debe añadir al menos un producto a la factura');
    if (items.some(i => !i.productId)) return alert('Todos los items deben tener un producto seleccionado');
    
    setIsSubmitting(true);
    try {
      // Registrar la compra (actualiza stock)
      demoStore.createPurchase({ 
        id: invoiceId || 'F-' + Date.now(), 
        supplierName, 
        date: invoiceDate, 
        total: calculateTotal(), 
        items 
      });

      // Lógica de actualización de costos si está habilitado
      if (updateCostsOnSave) {
        const currentProducts = demoStore.getProducts();
        items.forEach(item => {
          const prodIdx = currentProducts.findIndex(p => p.id === item.productId);
          if (prodIdx > -1) {
            if (item.unitMode === UnitMode.UNIT) {
              currentProducts[prodIdx].costUnit = item.unitCost;
            } else {
              currentProducts[prodIdx].costPerMl = item.unitCost;
            }
          }
        });
        demoStore.saveProducts(currentProducts);
      }

      alert('¡Factura guardada! Stock ' + (updateCostsOnSave ? 'y costos actualizados' : 'actualizado') + '.');
      setShowForm(false);
      loadLocalData();
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const p: Product = {
      id: 'p_' + Date.now(),
      name: newProdName,
      category: newProdCat,
      unitMode: newProdMode,
      costUnit: newProdMode !== UnitMode.ML ? parseFloat(newProdCost) || 0 : 0,
      priceUnit: newProdMode !== UnitMode.ML ? parseFloat(newProdPrice) || 0 : 0,
      costPerMl: newProdMode === UnitMode.ML ? parseFloat(newProdCost) || 0 : 0,
      pricePerMl: newProdMode === UnitMode.ML ? parseFloat(newProdPrice) || 0 : 0,
      stockUnits: 0,
      stockMl: 0,
      minStockUnits: 5,
      minStockMl: 750,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    demoStore.addProduct(p);
    const updatedProducts = demoStore.getProducts();
    setProducts(updatedProducts);
    
    // Limpiar y cerrar modal
    setNewProdName('');
    setNewProdCost('');
    setNewProdPrice('');
    setShowProductModal(false);
    alert('Producto creado y disponible para la factura.');
  };

  const categories = useMemo(() => ['Cervezas', 'Licores', 'Bebidas', 'Snacks', 'Cocteles', 'Otros'], []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargando Compras...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Compras</h1>
          <p className="text-slate-500 font-medium">Registra facturas de proveedores para aumentar stock.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setShowForm(!showForm); if(!showForm) { setItems([]); handleAddItem(); } }} 
            className={`px-6 py-3 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-amber-500 text-slate-900 shadow-amber-500/20'}`}
          >
            {showForm ? 'Cancelar' : 'Nueva Factura'}
          </button>
          <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 shadow-sm transition-all"><i className="fa-solid fa-arrow-left"></i></button>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-12 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Proveedor / Distribuidor</label>
              <input type="text" required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold" placeholder="Ej: Bavaria S.A." />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1"># de Factura</label>
              <input type="text" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold" placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha de Compra</label>
              <input type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold" />
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Productos Recibidos</h3>
              <button type="button" onClick={() => setShowProductModal(true)} className="text-[10px] font-black text-indigo-500 uppercase hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all border border-indigo-100">
                <i className="fa-solid fa-plus-circle mr-1"></i> Crear Producto
              </button>
            </div>
            
            {items.map((item, idx) => {
              const selectedProd = products.find(p => p.id === item.productId);
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 border border-slate-100 p-5 rounded-3xl group transition-all hover:bg-white hover:shadow-md">
                  <div className="md:col-span-5">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Seleccionar Producto</label>
                    <select required value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-amber-500">
                      <option value="">-- Elige un producto --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Modo</label>
                    <select value={item.unitMode} onChange={(e) => updateItem(idx, 'unitMode', e.target.value as UnitMode)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-amber-500">
                      {(selectedProd?.unitMode !== UnitMode.ML) && <option value={UnitMode.UNIT}>Unidades</option>}
                      {(selectedProd?.unitMode !== UnitMode.UNIT) && <option value={UnitMode.ML}>Mililitros</option>}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Cantidad</label>
                    <input type="number" required step="0.01" value={item.qty || ''} onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value))} placeholder="0" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-center font-black text-xs outline-none focus:border-amber-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Costo Unit/ML</label>
                    <input type="number" required step="0.01" value={item.unitCost || ''} onChange={(e) => updateItem(idx, 'unitCost', parseFloat(e.target.value))} placeholder="0" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-center font-black text-xs outline-none focus:border-amber-500" />
                  </div>
                  <div className="md:col-span-1 text-center">
                    <button type="button" onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="p-3 text-rose-300 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={handleAddItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black uppercase text-slate-400 hover:border-amber-300 hover:text-amber-500 transition-all">
              <i className="fa-solid fa-plus mr-2"></i> Añadir otra línea
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-slate-100 gap-6">
             <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={updateCostsOnSave} 
                    onChange={(e) => setUpdateCostsOnSave(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded-lg"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-600 transition-colors">Actualizar costo del producto con esta compra</span>
                </label>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Factura</p>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(calculateTotal())}</div>
                </div>
             </div>
             <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : <i className="fa-solid fa-check-double mr-2"></i>}
                <span>Registrar Compra</span>
             </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-20 text-center space-y-4 opacity-30">
              <i className="fa-solid fa-file-invoice text-6xl text-slate-200"></i>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">No hay facturas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <th className="px-8 py-5">Factura</th>
                    <th className="px-6 py-5">Proveedor</th>
                    <th className="px-6 py-5">Fecha</th>
                    <th className="px-6 py-5 text-right">Total Neto</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6 font-black text-slate-800 text-xs">{inv.id}</td>
                      <td className="px-6 py-6 font-bold text-slate-600 text-xs">{inv.supplierName}</td>
                      <td className="px-6 py-6 text-xs text-slate-400 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-6 py-6 text-right font-black text-emerald-600 text-sm">{formatCurrency(inv.total)}</td>
                      <td className="px-8 py-6 text-right"><button className="text-slate-200 group-hover:text-slate-400"><i className="fa-solid fa-chevron-right"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear Producto */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setShowProductModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-times text-xl"></i></button>
            <div className="mb-8">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nuevo Producto</h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Crear ítem para el catálogo</p>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                <input type="text" required value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-700" placeholder="Ej: Cerveza Club Colombia 330ml" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                  <select value={newProdCat} onChange={(e) => setNewProdCat(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-xs outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Venta por...</label>
                  <select value={newProdMode} onChange={(e) => setNewProdMode(e.target.value as UnitMode)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-xs outline-none">
                    <option value={UnitMode.UNIT}>Unidades</option>
                    <option value={UnitMode.ML}>Mililitros</option>
                    <option value={UnitMode.BOTH}>Ambos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Costo Compra</label>
                  <input type="number" required step="0.01" value={newProdCost} onChange={(e) => setNewProdCost(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black text-slate-700 text-center" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Precio Venta</label>
                  <input type="number" step="0.01" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black text-slate-700 text-center" placeholder="0" />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                 <button type="submit" className="flex-1 py-5 bg-indigo-500 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Crear e Incluir</button>
                 <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierInvoices;
