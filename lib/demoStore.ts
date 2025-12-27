
import { Product, Table, CashSession, Sale, SupplierInvoice, UnitMode, CashStatus, TableStatus, SaleStatus, TableOrder, OrderStatus, CartItem } from '../types';

const KEYS = {
  PRODUCTS: 'barpos_products',
  TABLES: 'barpos_tables',
  CASH: 'barpos_cash_session',
  SALES: 'barpos_sales',
  ORDERS: 'barpos_orders',
  PURCHASES: 'barpos_purchases',
  INIT: 'barpos_initialized'
};

const get = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading from localStorage", key, e);
    return null;
  }
};

const save = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving to localStorage", key, e);
  }
};

export const demoStore = {
  init: () => {
    try {
      if (localStorage.getItem(KEYS.INIT)) return;

      const initialProducts: Product[] = [
        { id: '1', name: 'Club Colombia Rubia 330ml', category: 'Cervezas', unitMode: UnitMode.UNIT, costUnit: 3500, priceUnit: 6500, costPerMl: 0, pricePerMl: 0, stockUnits: 48, stockMl: 0, minStockUnits: 12, minStockMl: 0, active: true, createdAt: new Date().toISOString() },
        { id: '2', name: 'Corona Extra 355ml', category: 'Cervezas', unitMode: UnitMode.UNIT, costUnit: 5500, priceUnit: 9500, costPerMl: 0, pricePerMl: 0, stockUnits: 24, stockMl: 0, minStockUnits: 6, minStockMl: 0, active: true, createdAt: new Date().toISOString() },
        { id: '3', name: 'Aguardiente Antioqueño', category: 'Licores', unitMode: UnitMode.BOTH, costUnit: 45000, priceUnit: 85000, costPerMl: 120, pricePerMl: 400, stockUnits: 10, stockMl: 7500, minStockUnits: 2, minStockMl: 750, active: true, createdAt: new Date().toISOString() },
        { id: '4', name: 'Ron Viejo de Caldas', category: 'Licores', unitMode: UnitMode.BOTH, costUnit: 48000, priceUnit: 90000, costPerMl: 130, pricePerMl: 450, stockUnits: 8, stockMl: 6000, minStockUnits: 2, minStockMl: 750, active: true, createdAt: new Date().toISOString() },
        { id: '6', name: 'Papas Margarita Pollo', category: 'Snacks', unitMode: UnitMode.UNIT, costUnit: 1400, priceUnit: 3500, costPerMl: 0, pricePerMl: 0, stockUnits: 30, stockMl: 0, minStockUnits: 10, minStockMl: 0, active: true, createdAt: new Date().toISOString() },
        { id: '8', name: 'Coca-Cola 300ml', category: 'Bebidas', unitMode: UnitMode.UNIT, costUnit: 1800, priceUnit: 3500, costPerMl: 0, pricePerMl: 0, stockUnits: 48, stockMl: 0, minStockUnits: 12, minStockMl: 0, active: true, createdAt: new Date().toISOString() },
      ];

      const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
        id: (i + 1).toString(),
        number: (i + 1).toString(),
        status: TableStatus.AVAILABLE,
        capacity: 4
      })).concat([{ id: '13', number: 'Barra', status: TableStatus.AVAILABLE, capacity: 10 }]);

      save(KEYS.PRODUCTS, initialProducts);
      save(KEYS.TABLES, initialTables);
      save(KEYS.SALES, []);
      save(KEYS.ORDERS, []);
      save(KEYS.PURCHASES, []);
      save(KEYS.INIT, 'true');
    } catch (e) {
      console.error("Demo init failed", e);
    }
  },

  reset: () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("barpos_")) localStorage.removeItem(k);
    });
    window.location.reload();
  },

  // PRODUCTOS
  getProducts: (): Product[] => {
    const data = get(KEYS.PRODUCTS);
    return Array.isArray(data) ? data : [];
  },
  saveProducts: (products: Product[]) => save(KEYS.PRODUCTS, Array.isArray(products) ? products : []),
  addProduct: (product: Product) => {
    const products = demoStore.getProducts();
    const updated = [...products, product];
    save(KEYS.PRODUCTS, updated);
    return product;
  },

  // MESAS
  getTables: (): Table[] => {
    const data = get(KEYS.TABLES);
    return Array.isArray(data) ? data : [];
  },
  saveTables: (tables: Table[]) => save(KEYS.TABLES, Array.isArray(tables) ? tables : []),

  // PEDIDOS / COMANDAS
  getOrders: (): TableOrder[] => {
    const data = get(KEYS.ORDERS);
    return Array.isArray(data) ? data : [];
  },
  saveOrders: (orders: TableOrder[]) => save(KEYS.ORDERS, orders),

  getOpenOrderByTable: (tableId: string): TableOrder | undefined => {
    const orders = demoStore.getOrders();
    return orders.find(o => o.tableId === tableId && o.status === OrderStatus.OPEN);
  },

  openTable: (tableId: string): TableOrder => {
    const tables = demoStore.getTables();
    const table = tables.find(t => t.id === tableId);
    if (!table) throw new Error("Mesa no encontrada");

    // Si ya hay orden abierta, retornarla
    const existing = demoStore.getOpenOrderByTable(tableId);
    if (existing) return existing;

    // Crear nueva orden
    const newOrder: TableOrder = {
      id: 'ORD-' + Date.now(),
      tableId,
      status: OrderStatus.OPEN,
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orders = demoStore.getOrders();
    save(KEYS.ORDERS, [...orders, newOrder]);

    // Ocupar mesa
    table.status = TableStatus.OCCUPIED;
    table.currentOrderId = newOrder.id;
    save(KEYS.TABLES, tables);

    return newOrder;
  },

  saveOrderItems: (orderId: string, items: CartItem[]) => {
    const orders = demoStore.getOrders();
    const orderIdx = orders.findIndex(o => o.id === orderId);
    if (orderIdx === -1) return;

    const total = items.reduce((acc, i) => acc + i.subtotal, 0);
    orders[orderIdx].items = items;
    orders[orderIdx].total = total;
    orders[orderIdx].updatedAt = new Date().toISOString();

    save(KEYS.ORDERS, orders);
  },

  cancelTable: (tableId: string) => {
    const orders = demoStore.getOrders();
    const order = orders.find(o => o.tableId === tableId && o.status === OrderStatus.OPEN);
    if (order) {
      order.status = OrderStatus.CANCELLED;
      save(KEYS.ORDERS, orders);
    }

    const tables = demoStore.getTables();
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.status = TableStatus.AVAILABLE;
      table.currentOrderId = undefined;
      save(KEYS.TABLES, tables);
    }
  },

  // CAJA
  getCashSession: (): CashSession | null => get(KEYS.CASH),
  openCash: (amount: number, userId: string) => {
    const session: CashSession = {
      id: Date.now().toString(),
      status: CashStatus.OPEN,
      openedAt: new Date().toISOString(),
      openingAmount: amount,
      closingExpected: amount,
      openedByUserId: userId
    };
    save(KEYS.CASH, session);
    return session;
  },
  closeCash: (realAmount: number, userId: string) => {
    const session = get(KEYS.CASH) as CashSession;
    if (!session) return null;
    const closed: CashSession = {
      ...session,
      status: CashStatus.CLOSED,
      closedAt: new Date().toISOString(),
      closingReal: realAmount,
      difference: realAmount - session.closingExpected,
      closedByUserId: userId
    };
    save(KEYS.CASH, closed);
    localStorage.removeItem(KEYS.CASH);
    return closed;
  },
  addCashMovement: (amount: number, isIncome: boolean) => {
    const session = get(KEYS.CASH) as CashSession;
    if (!session) return;
    session.closingExpected += isIncome ? amount : -amount;
    save(KEYS.CASH, session);
  },

  // VENTAS
  getSales: (): Sale[] => {
    const data = get(KEYS.SALES);
    return Array.isArray(data) ? data : [];
  },

  createSale: (cart: CartItem[], paymentMethodId: string, userId: string, tableId?: string) => {
    const products = demoStore.getProducts();
    const session = get(KEYS.CASH) as CashSession;
    
    if (!session) throw new Error("Caja cerrada. Abra caja para vender.");

    let total = 0;
    const saleItems = (Array.isArray(cart) ? cart : []).map(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (item.unitMode === 'UNIT') prod.stockUnits -= (item.qtyUnits || 0);
        else prod.stockMl -= (item.qtyMl || 0);
      }
      total += (item.subtotal || 0);
      return { ...item };
    });

    const newSale: Sale = {
      id: 'V-' + Date.now(),
      status: SaleStatus.PAID,
      total,
      createdAt: new Date().toISOString(),
      userId,
      cashSessionId: session.id,
      paymentMethodId,
      items: saleItems,
      tableId
    };

    const sales = demoStore.getSales();
    save(KEYS.SALES, [newSale, ...sales]);
    save(KEYS.PRODUCTS, products);

    session.closingExpected += total;
    save(KEYS.CASH, session);

    // Si es venta de mesa, cerrar el pedido
    if (tableId) {
      const orders = demoStore.getOrders();
      const order = orders.find(o => o.tableId === tableId && o.status === OrderStatus.OPEN);
      if (order) {
        order.status = OrderStatus.PAID;
        order.updatedAt = new Date().toISOString();
        save(KEYS.ORDERS, orders);
      }

      const tables = demoStore.getTables();
      const table = tables.find(t => t.id === tableId);
      if (table) {
        table.status = TableStatus.AVAILABLE;
        table.currentOrderId = undefined;
        save(KEYS.TABLES, tables);
      }
    }

    return newSale;
  },

  // COMPRAS
  getPurchases: (): SupplierInvoice[] => {
    const data = get(KEYS.PURCHASES);
    return Array.isArray(data) ? data : [];
  },
  createPurchase: (invoice: any) => {
    const products = demoStore.getProducts();
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    items.forEach((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (item.unitMode === UnitMode.ML) {
          prod.stockMl += (item.qty || 0);
          prod.costPerMl = item.unitCost;
        } else {
          prod.stockUnits += (item.qty || 0);
          prod.costUnit = item.unitCost;
        }
      }
    });
    save(KEYS.PRODUCTS, products);
    const purchases = demoStore.getPurchases();
    const newInvoice = { ...invoice, createdAt: new Date().toISOString() };
    save(KEYS.PURCHASES, [newInvoice, ...purchases]);
    return newInvoice;
  }
};
