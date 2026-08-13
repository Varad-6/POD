/**
 * Ikwezi Portal — Database Initializer v2
 * Runs schema_v2.sql then seed_v2.sql on first boot.
 */
import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = join(__dirname, 'ikwezi_portal.db');
const SCHEMA_PATH = join(__dirname, 'schema_v2.sql');
const SEED_PATH   = join(__dirname, 'seed_v2.sql');

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
  // Split on GO-style separators or run as a single exec
  instance.exec(schema);
  console.log('[DB] Schema applied.');

  // Check if already seeded
  const userCount = (instance.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount === 0) {
    const seed = readFileSync(SEED_PATH, 'utf8');
    instance.exec(seed);

    // Hash passwords properly (seed uses placeholder hashes)
    const DEMO_PASSWORD = 'Demo@1234';
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    instance.prepare('UPDATE users SET password_hash = ?').run(hash);
    console.log('[DB] Seed data applied. All users set to password: Demo@1234');
  } else {
    console.log(`[DB] Database already has ${userCount} users, skipping seed.`);
  }

  return instance;
}

export default getDb;
