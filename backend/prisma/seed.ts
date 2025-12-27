
import { PrismaClient, UnitMode, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
// Explicitly import process to fix type error on process.exit()
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('1234', 10);
  
  console.log('🌱 Seeding users...');
  const users = [
    { name: 'Admin Bar', username: 'admin', role: Role.ADMIN },
    { name: 'Cajero Turno', username: 'cajero', role: Role.CASHIER },
    { name: 'Mesero Barra', username: 'waiter', role: Role.WAITER }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash }
    });
  }

  console.log('💳 Seeding payment methods...');
  const methods = ['Efectivo', 'Nequi', 'Daviplata', 'Tarjeta Crédito', 'Transferencia'];
  for (const name of methods) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('📦 Seeding products...');
  const products = [
    { name: 'Club Colombia Rubia 330ml', category: 'Cervezas', unitMode: UnitMode.UNIT, costUnit: 3500, priceUnit: 6500, stockUnits: 48, minStockUnits: 12 },
    { name: 'Cerveza Águila 330ml', category: 'Cervezas', unitMode: UnitMode.UNIT, costUnit: 3000, priceUnit: 5500, stockUnits: 72, minStockUnits: 24 },
    { name: 'Aguardiente Antioqueño (Botella)', category: 'Licores', unitMode: UnitMode.BOTH, costUnit: 45000, priceUnit: 85000, costPerMl: 120, pricePerMl: 400, stockUnits: 12, stockMl: 9000, minStockUnits: 2, minStockMl: 750 },
    { name: 'Ron Viejo de Caldas (Shot)', category: 'Licores', unitMode: UnitMode.ML, costPerMl: 150, pricePerMl: 500, stockMl: 2250, minStockMl: 750 },
    { name: 'Papas Margarita Pollo', category: 'Snacks', unitMode: UnitMode.UNIT, costUnit: 1400, priceUnit: 3500, stockUnits: 24, minStockUnits: 6 },
    { name: 'Maní Salado', category: 'Snacks', unitMode: UnitMode.UNIT, costUnit: 800, priceUnit: 2500, stockUnits: 30, minStockUnits: 5 }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('🪑 Seeding tables...');
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({ data: { number: i.toString(), capacity: 4 } });
  }

  console.log('✅ Seed completado con éxito.');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // Fix: process.exit is now correctly typed after importing 'process'
    process.exit(1);
  });
