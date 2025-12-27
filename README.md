
# BarPOS Pro - MVP Potente

Sistema profesional para gestión de bares con manejo de inventario mixto (Unidades y Mililitros), gestión de caja y reportes en tiempo real.

## 1. Resumen MVP
- **POS Ultra-Rápido**: Interfaz optimizada para pantallas táctiles y móviles.
- **Inventario Dual**: Gestión por unidad (cervezas) y por volumen (shots/licores).
- **Gestión de Caja**: Control total de apertura, egresos y arqueo de cierre.
- **Roles y Permisos**: ADMIN (Total), CAJERO (POS + Caja), MESERO (POS).
- **Tiempo Real**: Sincronización automática vía WebSockets.
- **Snapshot de Costos**: Registro histórico de utilidad basado en costos al momento de la venta.
- **Filtros por Categoría**: Navegación rápida en el catálogo de productos.
- **Reportes Financieros**: KPI de ventas, utilidad y stock crítico.

## 2. Arquitectura Final
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS.
- **Backend**: Node.js + Express + Socket.io.
- **DB & ORM**: PostgreSQL + Prisma.
- **Auth**: JWT + Middleware de roles.

## 3. Modelo de Datos
- `User`: Gestión de empleados y credenciales.
- `Product`: Catálogo con modos `UNIT`, `ML` o `BOTH`.
- `Sale` / `SaleItem`: Registro de transacciones con snapshots de precios y costos.
- `InventoryMovement`: Trazabilidad de entradas, salidas y merma.
- `CashSession`: Sesiones de caja con control de diferencias.
- `PaymentMethod`: Canales de recaudo (Efectivo, Nequi, Tarjeta).

## 4. Endpoints API (Resumen)
- `POST /auth/login`: Autenticación.
- `GET /products`: Listado y búsqueda.
- `POST /sales`: Registrar venta y descontar stock.
- `POST /cash/open`: Iniciar turno de caja.
- `POST /cash/close`: Cerrar turno y calcular arqueo.
- `GET /reports/sales-summary`: Dashboard de rentabilidad.

## 5. Pasos de Instalación
1. Clonar el repositorio.
2. Configurar el archivo `.env`:
   ```env
   DATABASE_URL="postgresql://user_bar:password_bar@localhost:5432/bar_pos_db"
   JWT_SECRET="mi_secreto_super_seguro"
   PORT=3000
   ```
3. Levantar la base de datos: `docker-compose up -d`.
4. Instalar dependencias: `npm install`.
5. Aplicar migraciones: `npx prisma migrate dev`.
6. Ejecutar seed: `npx prisma db seed`.
7. Iniciar desarrollo: `npm run dev`.

## 6. Credenciales de Prueba
- **Admin**: `admin` / `1234`
- **Cajero**: `cajero` / `1234`
- **Mesero**: `mesero` / `1234`

## 7. Mejoras Fase 2
- Integración con impresoras térmicas (Tickets).
- Módulo de Combos (Cubetazos, Combos snacks).
- Gestión de Mesas y cuentas abiertas (Propinas).
- Notificaciones PUSH para stock crítico.
- Reporte detallado de merma.
