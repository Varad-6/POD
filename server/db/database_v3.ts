/**
 * PODZO Portal — Database Initializer v3
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = join(__dirname, 'podzo_portal_v3.db');
const SCHEMA_PATH = join(__dirname, 'schema_v3.sql');
const SEED_PATH   = join(__dirname, 'seed_v3.sql');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb(): Database.Database {
  const instance = getDb();

  // Run schema
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  instance.exec(schema);
  console.log('[DB V3] Schema applied.');

  // Safe table migration checks
  const addColumnIfNotExists = (tableName: string, columnName: string, columnDef: string) => {
    try {
      const columns = instance.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
      const exists = columns.some(col => col.name === columnName);
      if (!exists) {
        instance.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`[DB V3] Added column ${columnName} to table ${tableName}.`);
      }
    } catch (err) {
      console.warn(`[DB V3] Alter table warning for ${tableName}.${columnName}:`, err);
    }
  };

  addColumnIfNotExists('transport_assignments', 'queue_entry_time', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'actual_arrival_time', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'loading_status', "TEXT DEFAULT 'PENDING'");
  addColumnIfNotExists('transport_assignments', 'journey_authorized', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('transport_assignments', 'queue_time_mins', 'INTEGER');
  addColumnIfNotExists('transport_assignments', 'penalty_amount', 'REAL');
  addColumnIfNotExists('transport_assignments', 'dispatch_ip', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'dispatch_user_agent', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'assigned_qty', 'REAL DEFAULT NULL');
  addColumnIfNotExists('purchase_orders', 'allowed_queue_time_mins', 'INTEGER DEFAULT 60');
  addColumnIfNotExists('purchase_orders', 'detention_rate_per_hour', 'REAL DEFAULT 150.00');
  addColumnIfNotExists('purchase_orders', 'po_item_no', 'INTEGER DEFAULT 10');
  addColumnIfNotExists('miro_invoices', 'paid_amount', 'REAL DEFAULT 0.0');

  // Ensure job_config_pos junction table exists
  instance.exec(`
    CREATE TABLE IF NOT EXISTS job_config_pos (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      job_config_id     INTEGER NOT NULL REFERENCES job_configs(id) ON DELETE CASCADE,
      po_id             INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      planned_qty       REAL NOT NULL,
      uom               TEXT NOT NULL DEFAULT 'TO',
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(job_config_id, po_id)
    );
  `);


  // Check if seeded (ensure all core personas exist)
  const userCount = (instance.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount < 12) {
    const seed = readFileSync(SEED_PATH, 'utf8');
    instance.exec(seed);

    // Hash passwords properly
    const DEMO_PASSWORD = 'Demo@1234';
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    instance.prepare('UPDATE users SET password_hash = ?').run(hash);
    console.log('[DB V3] Seed data synchronized. All users set to password: Demo@1234');
  } else {
    console.log(`[DB V3] Database already has ${userCount} users, skipping seed.`);
  }

  return instance;
}

export default getDb;
