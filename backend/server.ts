
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient, Role, CashStatus, SaleStatus, CashMovementType, MovementType, TableStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'barpos_secret_key_2025';

app.use(cors());
app.use(express.json());

// Middlewares
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Sesión expirada' }); }
};

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
  const { username, pin } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(pin, user.passwordHash))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ user, token });
});

// --- PRODUCTOS ---
app.get('/api/products', authenticate, async (req, res) => {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  res.json(products);
});

// --- CAJA ---
app.get('/api/cash/status', authenticate, async (req, res) => {
  const session = await prisma.cashSession.findFirst({ 
    where: { status: CashStatus.OPEN },
    include: { openedBy: true }
  });
  if (!session) return res.status(404).json({ error: 'No hay caja abierta' });
  res.json(session);
});

app.post('/api/cash/open', authenticate, async (req: any, res) => {
  const { openingAmount } = req.body;
  const existing = await prisma.cashSession.findFirst({ where: { status: CashStatus.OPEN } });
  if (existing) return res.status(400).json({ error: 'Ya existe una sesión abierta' });

  const session = await prisma.cashSession.create({
    data: {
      openingAmount,
      closingExpected: openingAmount,
      openedByUserId: req.user.id
    }
  });

  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'OPEN_CASH', entity: 'CashSession', entityId: session.id }
  });

  io.emit('cashSessionUpdated', session);
  res.json(session);
});

app.post('/api/cash/movement', authenticate, async (req: any, res) => {
  const { type, amount, note, paymentMethodId } = req.body;
  const session = await prisma.cashSession.findFirst({ where: { status: CashStatus.OPEN } });
  if (!session) return res.status(400).json({ error: 'Caja cerrada' });

  const movement = await prisma.cashMovement.create({
    data: {
      cashSessionId: session.id,
      type,
      amount,
      note,
      paymentMethodId,
      userId: req.user.id
    }
  });

  const adjustment = type === 'INCOME' ? amount : -amount;
  await prisma.cashSession.update({
    where: { id: session.id },
    data: { closingExpected: { increment: adjustment } }
  });

  io.emit('cashSessionUpdated');
  res.json(movement);
});

app.post('/api/cash/close', authenticate, async (req: any, res) => {
  const { closingReal } = req.body;
  const session = await prisma.cashSession.findFirst({ where: { status: CashStatus.OPEN } });
  if (!session) return res.status(400).json({ error: 'No hay caja abierta' });

  const difference = closingReal - session.closingExpected;
  const closed = await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      status: CashStatus.CLOSED,
      closedAt: new Date(),
      closingReal,
      difference,
      closedByUserId: req.user.id
    }
  });

  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'CLOSE_CASH', entity: 'CashSession', entityId: session.id, metaJson: JSON.stringify({ difference }) }
  });

  io.emit('cashSessionUpdated', null);
  res.json(closed);
});

// --- VENTAS ---
app.post('/api/sales', authenticate, async (req: any, res) => {
  const { items, paymentMethodId, tableId, orderId } = req.body;
  const activeSession = await prisma.cashSession.findFirst({ where: { status: CashStatus.OPEN } });
  if (!activeSession) return res.status(400).json({ error: 'Debes abrir caja primero' });

  try {
    const sale = await prisma.$transaction(async (tx) => {
      let total = 0;
      const saleItemsData = [];

      for (const item of items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) throw new Error(`Producto ${item.productId} no encontrado`);

        total += item.subtotal;
        saleItemsData.push({
          productId: prod.id,
          qtyUnits: item.qtyUnits || 0,
          qtyMl: item.qtyMl || 0,
          unitPriceSnapshot: prod.priceUnit,
          mlPriceSnapshot: prod.pricePerMl,
          unitCostSnapshot: prod.costUnit,
          mlCostSnapshot: prod.costPerMl,
          subtotal: item.subtotal
        });

        // Descontar Stock
        await tx.product.update({
          where: { id: prod.id },
          data: {
            stockUnits: { decrement: item.qtyUnits || 0 },
            stockMl: { decrement: item.qtyMl || 0 }
          }
        });

        // Registrar movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            productId: prod.id,
            type: MovementType.OUT,
            qtyUnits: item.qtyUnits || 0,
            qtyMl: item.qtyMl || 0,
            userId: req.user.id,
            note: 'Venta Directa/Mesa'
          }
        });
      }

      const s = await tx.sale.create({
        data: {
          total,
          userId: req.user.id,
          cashSessionId: activeSession.id,
          paymentMethodId,
          items: { create: saleItemsData }
        }
      });

      await tx.cashSession.update({
        where: { id: activeSession.id },
        data: { closingExpected: { increment: total } }
      });

      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: TableStatus.AVAILABLE, currentOrderId: null }
        });
        if (orderId) await tx.tableOrder.delete({ where: { id: orderId } });
      }

      return s;
    });

    io.emit('saleCreated');
    io.emit('inventoryUpdated');
    io.emit('tablesUpdated');
    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sales/:id/void', authenticate, async (req: any, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Solo Admin puede anular' });
  const { reason } = req.body;

  const sale = await prisma.sale.findUnique({ 
    where: { id: req.params.id }, 
    include: { items: true, cashSession: true } 
  });
  if (!sale || sale.status === 'VOID') return res.status(404).json({ error: 'Venta no encontrada o ya anulada' });

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.VOID } });
    
    // Devolver stock
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockUnits: { increment: item.qtyUnits },
          stockMl: { increment: item.qtyMl }
        }
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: MovementType.IN,
          qtyUnits: item.qtyUnits,
          qtyMl: item.qtyMl,
          userId: req.user.id,
          note: `Anulación Venta ${sale.id}: ${reason}`
        }
      });
    }

    // Ajustar caja
    if (sale.cashSession.status === CashStatus.OPEN) {
      await tx.cashSession.update({
        where: { id: sale.cashSessionId },
        data: { closingExpected: { decrement: sale.total } }
      });
    }

    await tx.auditLog.create({
      data: { userId: req.user.id, action: 'VOID_SALE', entity: 'Sale', entityId: sale.id, metaJson: JSON.stringify({ reason }) }
    });
  });

  io.emit('saleCreated');
  io.emit('inventoryUpdated');
  res.json({ success: true });
});

// --- REPORTES ---
app.get('/api/reports/sales-summary', authenticate, async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: today }, status: SaleStatus.PAID },
    include: { items: true }
  });

  let totalVentas = 0;
  let totalCosto = 0;
  sales.forEach(s => {
    totalVentas += s.total;
    s.items.forEach(i => {
      totalCosto += (i.qtyUnits * i.unitCostSnapshot) + (i.qtyMl * i.mlCostSnapshot);
    });
  });

  res.json({ totalVentas, totalCosto, count: sales.length });
});

// --- SALUD ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 BarPOS API ONLINE en puerto ${PORT}`));
