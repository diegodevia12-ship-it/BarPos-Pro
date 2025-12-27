
export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER'
}

export enum UnitMode {
  UNIT = 'UNIT',
  ML = 'ML',
  BOTH = 'BOTH'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
  WASTE = 'WASTE'
}

export enum CashStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum CashMovementType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum SaleStatus {
  PAID = 'PAID',
  VOID = 'VOID'
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED'
}

export enum OrderStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitMode: UnitMode;
  costUnit: number;
  priceUnit: number;
  costPerMl: number;
  pricePerMl: number;
  stockUnits: number;
  stockMl: number;
  minStockUnits: number;
  minStockMl: number;
  active: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  unitMode: UnitMode;
  qtyUnits: number;
  qtyMl: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  status: SaleStatus;
  total: number;
  createdAt: string;
  userId: string;
  cashSessionId: string;
  paymentMethodId: string;
  note?: string;
  items?: CartItem[];
  tableId?: string;
}

export interface CashSession {
  id: string;
  status: CashStatus;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingExpected: number;
  closingReal?: number;
  difference?: number;
  openedByUserId: string;
  closedByUserId?: string;
}

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  currentOrderId?: string;
}

export interface TableOrder {
  id: string;
  tableId: string;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoice {
  id: string;
  supplierName: string;
  date: string;
  total: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}
