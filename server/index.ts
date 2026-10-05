/**
 * PODZO Transporter Portal — Express Server v3
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
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(__dirname, '../uploads')));
app.use('/uploads', express.static(join(__dirname, '../public/uploads')));

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

// Root & API status endpoints
app.get('/', (_req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 40px; line-height: 1.6; color: #0A192F;">
      <h2>🚀 PODZO Backend API Server (v3) is Running</h2>
      <p>This is the backend API service running on port <code>3001</code>.</p>
      <p>To view the web application, visit the Vite Frontend at: <a href="http://localhost:5173" style="color: #FF5B00; font-weight: bold;">http://localhost:5173</a></p>
      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
      <h3>Available API Status Endpoints:</h3>
      <ul>
        <li><a href="/api/v3/health">/api/v3/health</a> — Health Status Check</li>
        <li><a href="/api/v2/health">/api/v2/health</a> — Legacy Health Check</li>
      </ul>
    </div>
  `);
});

app.get('/api/v3', (_req, res) => {
  res.json({
    name: 'PODZO Backend API',
    version: '3.0.0',
    status: 'ONLINE',
    endpoints: {
      health: '/api/v3/health',
      auth: '/api/v3/auth',
      contracts: '/api/v3/contracts',
      purchaseOrders: '/api/v3/pos',
      dispatches: '/api/v3/assignments',
    }
  });
});

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
  console.log(`\n🚀 PODZO Portal Server v3 running on http://localhost:${PORT}`);
  console.log(`📋 API Base: http://localhost:${PORT}/api/v3`);
  console.log(`\n📌 V3 Login credentials (Demo@1234):`);
  console.log(`   Role: CA (Company Admin)      → ca_thandiwe`);
  console.log(`   Role: TA (Transporter Admin)  → ta_sipho`);
  console.log(`   Role: DR (Driver)             → dr_zweli`);
  console.log(`   Role: CR (Customer)           → cr_mining`);
  console.log(`   Role: SR (Supervisor)         → sr_gate01\n`);
});

export default app;

