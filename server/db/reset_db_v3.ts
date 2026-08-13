import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './database_v3.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SCHEMA_PATH = join(__dirname, 'schema_v3.sql');
const SEED_PATH   = join(__dirname, 'seed_v3.sql');

export function resetDbV3() {
  console.log('[DB V3] Performing robust SQL database reset...');
  const db = getDb();
  
  db.pragma('foreign_keys = OFF');
  
  // Get all table names
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  
  for (const t of tables) {
    db.prepare(`DROP TABLE IF EXISTS ${t.name}`).run();
  }
  
  db.pragma('foreign_keys = ON');
  
  // Re-run schema
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  
  // Run seed
  const seed = readFileSync(SEED_PATH, 'utf8');
  db.exec(seed);

  // Hash passwords properly
  const DEMO_PASSWORD = 'Demo@1234';
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  db.prepare('UPDATE users SET password_hash = ?').run(hash);
  
  console.log('[DB V3] Robust SQL reset and seeding complete.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reset_db_v3.ts')) {
  resetDbV3();
}
