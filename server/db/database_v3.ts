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

  // Check if seeded
  const userCount = (instance.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount === 0) {
    const seed = readFileSync(SEED_PATH, 'utf8');
    instance.exec(seed);

    // Hash passwords properly
    const DEMO_PASSWORD = 'Demo@1234';
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    instance.prepare('UPDATE users SET password_hash = ?').run(hash);
    console.log('[DB V3] Seed data applied. All users set to password: Demo@1234');
  } else {
    console.log(`[DB V3] Database already has ${userCount} users, skipping seed.`);
  }

  return instance;
}

export default getDb;
