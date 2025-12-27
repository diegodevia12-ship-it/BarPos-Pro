
import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, UnitMode, CartItem, CashSession, PaymentMethod, Table, TableOrder } from '../types';
import { demoStore } from '../lib/demoStore';

interface POSProps {
  user: User;
  cashSession: CashSession | null;
  onBack: () => void;
  setView: (v: string) => void;
  activeTable?: Table | null;
  activeOrder?: TableOrder | null;
}

const POS: React.FC<POSProps> = ({ user, cashSession, onBack, setView, activeTable, activeOrder }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCashClosedModal, setShowCashClosedModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Estado para edición rápida de precios
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPriceForm, setEditPriceForm] = useState({ priceUnit: 0, pricePerMl: 0 });

  const paymentMethods: PaymentMethod[] = [
    { id: '1', name: 'Efectivo', active: true },
    { id: '2', name: 'Nequi', active: true },
    { id: '3', name: 'Daviplata', active: true },
    { id: '4', name: 'Tarjeta', active: true }
  ];
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('1');

  // Inicializar carrito si viene de una orden activa
  useEffect(() => {
    if (activeOrder && Array.isArray(activeOrder.items)) {
      setCart(activeOrder.items);
    }
  }, [activeOrder]);

  // Cargamos productos con manejo de errores
  useEffect(() => {
    try {
      const data = demoStore.getProducts();
      setProducts(Array.isArray(data) ? data.filter(p => p && p.active) : []);
    } catch (err) {
      console.error("Critical error loading POS products:", err);
      setHasError(true);
    }
  }, []);

  const productsSafe = useMemo(() => Array.isArray(products) ? products.filter(p => p !== null) : [], [products]);
  const cartSafe = useMemo(() => Array.isArray(cart) ? cart.filter(c => c !== null) : [], [cart]);

  const categories = useMemo(() => {
    try {
      const cats = productsSafe.map(p => p.category).filter(Boolean);
      return ['Todas', ...new Set(cats)];
    } catch (e) {
      return ['Todas'];
    }
  }, [productsSafe]);

  const filteredProducts = useMemo(() => {
    try {
      const search = (searchTerm || '').toLowerCase();
      return productsSafe.filter(p => 
        (selectedCategory === 'Todas' || p.category === selectedCategory) && 
        (p.name || '').toLowerCase().includes(search)
      );
    } catch (e) {
      console.error("Error filtering products:", e);
      return [];
    }
  }, [productsSafe, selectedCategory, searchTerm]);

  const total = useMemo(() => {
    try {
      return cartSafe.reduce((acc, item) => acc + (item?.subtotal || 0), 0);
    } catch (e) {
      return 0;
    }
  }, [cartSafe]);

  const formatCurrency = (val: number) => {
    try {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
      }).format(val || 0);
    } catch (e) {
      return `$ ${val || 0}`;
    }
  };

  const addToCart = (product: Product, mode: 'UNIT' | 'ML') => {
    if (!product) return;
    try {
      const price = mode === 'UNIT' ? (product.priceUnit || 0) : (product.pricePerMl || 0);
      
      if (price <= 0) {
        alert(`Este producto no tiene precio de venta configurado para ${mode === 'UNIT' ? 'UNIDADES' : 'ML'}.`);
        return;
      }

      const existingIndex = cartSafe.findIndex(item => item && item.productId === product.id && item.unitMode === mode);
      
      if (existingIndex > -1) {
        const newCart = [...cartSafe];
        const item = newCart[existingIndex];
        if (mode === 'UNIT') item.qtyUnits += 1;
        else item.qtyMl += 30; 
        item.subtotal = (item.qtyUnits * (product.priceUnit || 0)) + (item.qtyMl * (product.pricePerMl || 0));
        setCart(newCart);
      } else {
        setCart([...cartSafe, {
          productId: product.id,
          name: product.name,
          unitMode: mode as any,
          qtyUnits: mode === 'UNIT' ? 1 : 0,
          qtyMl: mode === 'ML' ? 30 : 0,
          price: price,
          subtotal: mode === 'UNIT' ? price : (price * 30)
        }]);
      }
    } catch (e) {
      console.error("Error adding to cart:", e);
      alert("No se pudo agregar el producto.");
    }
  };

  const handleOpenEditPrice = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!product) return;
    setEditingProduct(product);
    setEditPriceForm({
      priceUnit: product.priceUnit || 0,
      pricePerMl: product.pricePerMl || 0
    });
  };

  const handleSavePrice = () => {
    if (!editingProduct) return;
    if (editPriceForm.priceUnit < 0 || editPriceForm.pricePerMl < 0) {
      alert("Los precios no pueden ser negativos");
      return;
    }
    try {
      const allProducts = demoStore.getProducts();
      const updatedProducts = allProducts.map(p => {
        if (p && p.id === editingProduct.id) {
          return { ...p, priceUnit: editPriceForm.priceUnit, pricePerMl: editPriceForm.pricePerMl };
        }
        return p;
      });
      demoStore.saveProducts(updatedProducts);
      setProducts(updatedProducts.filter(p => p && p.active));
      setEditingProduct(null);
      alert("Precios actualizados");
    } catch (err) {
      console.error("Error saving price from POS:", err);
    }
  };

  const handleSaveOrderOnly = () => {
    if (!activeOrder) return;
    setIsSubmitting(true);
    try {
      demoStore.saveOrderItems(activeOrder.id, cartSafe);
      alert('Pedido actualizado en la mesa');
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSale = () => {
    if (!cashSession) {
      setShowCashClosedModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      demoStore.createSale(cartSafe, selectedPaymentMethod, user.id, activeTable?.id);
      alert('Venta procesada con éxito');
      setCart([]);
      setShowCheckout(false);
      onBack();
    } catch (err: any) {
      console.error("Error finishing sale:", err);
      alert(err.message || "No se pudo procesar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = () => {
    if (confirm("Se borrarán todos los datos locales y se reiniciará la aplicación. ¿Continuar?")) {
      demoStore.reset();
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 text-center p-12 bg-white rounded-[3rem] border-2 border-rose-100 shadow-2xl">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl shadow-inner"><i className="fa-solid fa-bug"></i></div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Error en POS</h2>
        <div className="flex gap-4">
          <button onClick={handleResetDemo} className="px-8 py-5 bg-rose-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Reiniciar Demo</button>
          <button onClick={onBack} className="px-8 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><i className="fa-solid fa-arrow-left"></i></button>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{activeTable ? `Mesa ${activeTable.number}` : 'Venta Barra'}</h2>
           </div>
           <input 
             type="text" 
             placeholder="Buscar producto..." 
             className="px-4 py-2 bg-white border rounded-xl text-xs font-bold w-48 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm" 
             value={searchTerm} 
             onChange={(e)=>setSearchTerm(e.target.value)} 
           />
        </div>

        <div className="p-2 flex gap-2 overflow-x-auto bg-white border-b no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={()=>setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{cat}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/30">
          {filteredProducts.map(p => (
            <div key={p.id} className="relative bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-300 transition-all hover:shadow-md">
              <button onClick={(e) => handleOpenEditPrice(e, p)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all z-10"><span className="text-[10px] font-black uppercase tracking-tighter bg-white/80 px-2 py-1 rounded-lg border">Editar</span></button>
              <div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1 group-hover:text-amber-600">{p.name}</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{p.category}</p>
              </div>
              <div className="mt-4 space-y-2">
                {p.unitMode !== UnitMode.ML && (
                  <button onClick={()=>addToCart(p, 'UNIT')} className="w-full py-2 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all shadow-sm">Unidad - {formatCurrency(p.priceUnit || 0)}</button>
                )}
                {p.unitMode !== UnitMode.UNIT && (
                  <button onClick={()=>addToCart(p, 'ML')} className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all shadow-sm">Copa (30ml) - {formatCurrency((p.pricePerMl || 0) * 30)}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-slate-900 text-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/30">
           <h2 className="text-xs font-black uppercase text-amber-500 tracking-widest">Carrito de Orden</h2>
           <button onClick={()=>setCart([])} className="text-[9px] font-black text-rose-500 uppercase hover:bg-rose-500/10 px-2 py-1 rounded-md transition-all">Limpiar</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {cartSafe.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-3">
               <i className="fa-solid fa-shopping-basket text-4xl"></i>
               <p className="text-[10px] font-black uppercase">Carrito Vacío</p>
             </div>
           ) : (
             cartSafe.map((item, idx) => (
               <div key={`${item.productId}-${idx}`} className="flex justify-between items-center border-b border-white/5 pb-3 animate-in fade-in">
                 <div>
                    <p className="text-[10px] font-black uppercase">{item.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      {item.unitMode === UnitMode.UNIT ? `${item.qtyUnits} unid.` : `${item.qtyMl} ml`} 
                      <span className="ml-1 text-slate-700">@ {formatCurrency(item.price)}</span>
                    </p>
                 </div>
                 <div className="flex flex-col items-end">
                    <p className="text-[11px] font-black text-amber-500">{formatCurrency(item.subtotal)}</p>
                    <button onClick={() => setCart(cartSafe.filter((_, i) => i !== idx))} className="text-[8px] text-rose-500/50 hover:text-rose-500 transition-colors">Remover</button>
                 </div>
               </div>
             ))
           )}
        </div>
        <div className="p-8 bg-slate-950 border-t border-white/5">
           <div className="flex justify-between mb-6">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Acumulado</span>
              <span className="text-2xl font-black text-amber-500 tracking-tighter">{formatCurrency(total)}</span>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
             {activeTable && (
               <button 
                onClick={handleSaveOrderOnly} 
                disabled={isSubmitting} 
                className="w-full py-4 bg-indigo-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all disabled:opacity-20"
               >
                Guardar en Comanda
               </button>
             )}
             <button 
              onClick={()=>setShowCheckout(true)} 
              disabled={cartSafe.length === 0 || isSubmitting} 
              className="w-full py-5 bg-amber-500 text-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-20"
             >
              {activeTable ? 'Cobrar Cuenta Mesa' : 'Pagar Factura Directa'}
             </button>
           </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in-95">
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total a Recaudar</p>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(total)}</h2>
             </div>
             <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest text-center">Método de Pago</p>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(pm => (
                    <button key={pm.id} onClick={()=>setSelectedPaymentMethod(pm.id)} className={`py-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${selectedPaymentMethod === pm.id ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{pm.name}</button>
                  ))}
                </div>
             </div>
             <div className="space-y-3 pt-4">
               <button onClick={handleFinishSale} disabled={isSubmitting} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2.5rem] uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-all">
                  {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : <i className="fa-solid fa-check-circle mr-2"></i>}
                  Finalizar Venta
               </button>
               <button onClick={()=>setShowCheckout(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2">Volver al carrito</button>
             </div>
          </div>
        </div>
      )}

      {showCashClosedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-12 text-center shadow-2xl space-y-8">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner"><i className="fa-solid fa-vault"></i></div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Caja cerrada</h2>
            <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">Debes abrir caja antes de vender.</p>
            <div className="space-y-4">
              <button onClick={() => setView('cash')} className="w-full py-5 bg-amber-500 text-slate-900 font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Abrir caja ahora</button>
              <button onClick={() => setShowCashClosedModal(false)} className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setEditingProduct(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-times text-xl"></i></button>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Editar Precio</h2>
            <div className="space-y-6">
              {editingProduct.unitMode !== UnitMode.ML && (
                <input type="number" value={editPriceForm.priceUnit} onChange={(e) => setEditPriceForm({...editPriceForm, priceUnit: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl font-black text-center text-xl" />
              )}
              {editingProduct.unitMode !== UnitMode.UNIT && (
                <input type="number" value={editPriceForm.pricePerMl} onChange={(e) => setEditPriceForm({...editPriceForm, pricePerMl: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl font-black text-center text-xl" />
              )}
              <div className="pt-4 flex gap-4">
                 <button onClick={handleSavePrice} className="flex-1 py-5 bg-indigo-500 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Guardar</button>
                 <button onClick={() => setEditingProduct(null)} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
