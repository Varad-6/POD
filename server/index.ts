/**
 * Ikwezi Transporter Portal — Express Server v3
 * Full-stack: SQLite DB + JWT Auth + Real REST APIs
 */
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDb as initDbV2 } from './db/database_v2.js';
import { initDb as initDbV3 } from './db/database_v3.js';

// V2 Routes (Compatibility)
import authRoutes        from './routes/auth.js';
import contractRoutes    from './routes/contracts.js';
import poRoutes          from './routes/purchaseOrders.js';
import dispatchRoutes    from './routes/dispatches.js';
import podRoutes         from './routes/pod.js';
import invoiceRoutes     from './routes/invoices.js';
import transporterRoutes from './routes/transporters.js';
import dashboardRoutes   from './routes/dashboard.js';

// V3 Routes
import authRoutesV3      from './routes/auth_v3.js';
import apiRoutesV3       from './routes/api_v3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Initialize databases
try {
  initDbV2();
  initDbV3();
  console.log('[Server] Databases v2 & v3 initialized successfully.');
} catch (err) {
  console.error('[Server] CRITICAL: Database init failed:', err);
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── V3 API Routes ─────────────────────────────────────────────
app.use('/api/v3/auth', authRoutesV3);
app.use('/api/v3',      apiRoutesV3);

// ── V2 API Routes (Compatibility) ─────────────────────────────
app.use('/api/v2/auth',         authRoutes);
app.use('/api/v2/contracts',    contractRoutes);
app.use('/api/v2/pos',          poRoutes);
app.use('/api/v2/dispatches',   dispatchRoutes);
app.use('/api/v2/pod',          podRoutes);
app.use('/api/v2/invoices',     invoiceRoutes);
app.use('/api/v2/transporters', transporterRoutes);
app.use('/api/v2/dashboard',    dashboardRoutes);

// Health check
app.get('/api/v3/health', (_req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString(), version: '3.0.0' });
});
app.get('/api/v2/health', (_req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString(), version: '2.0.0' });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Ikwezi Portal Server v3 running on http://localhost:${PORT}`);
  console.log(`📋 API Base: http://localhost:${PORT}/api/v3`);
  console.log(`\n📌 V3 Login credentials (Demo@1234):`);
  console.log(`   Role: CA (Company Admin)      → ca_thandiwe`);
  console.log(`   Role: TA (Transporter Admin)  → ta_sipho`);
  console.log(`   Role: DR (Driver)             → dr_zweli`);
  console.log(`   Role: CR (Customer)           → cr_mining`);
  console.log(`   Role: SR (Supervisor)         → sr_gate01\n`);
});

export default app;

