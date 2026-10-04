// Local persistence for accounts, sessions and private saved items (Node's built-in
// SQLite). Every private query takes a userId that callers must derive from the
// server-side session (see auth.ts) — never from client input.
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function openDb(file = path.join(process.cwd(), "data", "local", "ruletwin.db")) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      pw_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS saved_properties (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, property_id TEXT NOT NULL,
      created_at TEXT NOT NULL, PRIMARY KEY (user_id, property_id));
    CREATE TABLE IF NOT EXISTS saved_reports (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, as_of_date TEXT NOT NULL,
      result_json TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, detail TEXT, at TEXT NOT NULL);
  `);
  return db;
}
export type Db = ReturnType<typeof openDb>;

const now = () => new Date().toISOString();
const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");
const scrypt = (pw: string, salt: string) => crypto.scryptSync(pw, salt, 64).toString("hex");

export function createUser(db: Db, email: string, password: string): { id: number } | { error: string } {
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: "Enter a valid email address." };
  if (password.length < 8 || password.length > 200) return { error: "Password must be at least 8 characters." };
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return { error: "An account with that email already exists. Sign in instead." };
  const salt = crypto.randomBytes(16).toString("hex");
  const r = db.prepare("INSERT INTO users (email, pw_hash, salt, created_at) VALUES (?, ?, ?, ?)").run(email, scrypt(password, salt), salt, now());
  audit(db, Number(r.lastInsertRowid), "account_created");
  return { id: Number(r.lastInsertRowid) };
}

export function verifyUser(db: Db, email: string, password: string): number | null {
  const u = db.prepare("SELECT id, pw_hash, salt FROM users WHERE email = ?").get(email.trim().toLowerCase()) as
    { id: number; pw_hash: string; salt: string } | undefined;
  if (!u) { scrypt(password, "timing-equalizer"); return null; }
  const ok = crypto.timingSafeEqual(Buffer.from(scrypt(password, u.salt), "hex"), Buffer.from(u.pw_hash, "hex"));
  return ok ? u.id : null;
}

export function createSession(db: Db, userId: number, days = 14): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + days * 864e5);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), userId, expires.toISOString());
  audit(db, userId, "signed_in");
  return { token, expires };
}

export function sessionUser(db: Db, token: string | undefined): { id: number; email: string } | null {
  if (!token || token.length > 100) return null;
  const row = db.prepare(`SELECT u.id, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`)
    .get(hashToken(token)) as { id: number; email: string; expires_at: string } | undefined;
  if (!row || row.expires_at < now()) return null;
  return { id: row.id, email: row.email };
}

export function deleteSession(db: Db, token: string) {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

export function audit(db: Db, userId: number | null, action: string, detail?: unknown) {
  db.prepare("INSERT INTO audit_events (user_id, action, detail, at) VALUES (?, ?, ?, ?)")
    .run(userId, action, detail === undefined ? null : JSON.stringify(detail), now());
}

// ---- private, user-scoped data ----
export function saveProperty(db: Db, userId: number, propertyId: string) {
  db.prepare("INSERT OR IGNORE INTO saved_properties (user_id, property_id, created_at) VALUES (?, ?, ?)").run(userId, propertyId, now());
}
export function unsaveProperty(db: Db, userId: number, propertyId: string) {
  db.prepare("DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?").run(userId, propertyId);
}
export function listSavedProperties(db: Db, userId: number): { property_id: string; created_at: string }[] {
  return db.prepare("SELECT property_id, created_at FROM saved_properties WHERE user_id = ? ORDER BY created_at DESC").all(userId) as never;
}
export function isSaved(db: Db, userId: number, propertyId: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM saved_properties WHERE user_id = ? AND property_id = ?").get(userId, propertyId));
}
export function saveReport(db: Db, userId: number, propertyId: string, snapshotId: string, asOf: string, result: unknown): number {
  const r = db.prepare("INSERT INTO saved_reports (user_id, property_id, snapshot_id, as_of_date, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, propertyId, snapshotId, asOf, JSON.stringify(result), now());
  audit(db, userId, "report_saved", { propertyId, snapshotId, asOf });
  return Number(r.lastInsertRowid);
}
export function listReports(db: Db, userId: number): { id: number; property_id: string; snapshot_id: string; as_of_date: string; created_at: string }[] {
  return db.prepare("SELECT id, property_id, snapshot_id, as_of_date, created_at FROM saved_reports WHERE user_id = ? ORDER BY id DESC").all(userId) as never;
}
export function getReport(db: Db, userId: number, id: number): { property_id: string; snapshot_id: string; as_of_date: string; result_json: string; created_at: string } | null {
  return (db.prepare("SELECT property_id, snapshot_id, as_of_date, result_json, created_at FROM saved_reports WHERE id = ? AND user_id = ?").get(id, userId) as never) ?? null;
}
export function deleteReport(db: Db, userId: number, id: number) {
  db.prepare("DELETE FROM saved_reports WHERE id = ? AND user_id = ?").run(id, userId);
}
