/**
 * User store — uses MongoDB when MONGODB_URI is set,
 * falls back to data/users.json for local demo usage.
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// ─── File-based fallback ────────────────────────────────────────────────────

function readUsersFile(): User[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as User[];
  } catch {
    return [];
  }
}

function writeUsersFile(users: User[]): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

// ─── MongoDB helpers ────────────────────────────────────────────────────────

async function getUsersCollection() {
  const { getDb } = await import('./mongodb');
  const db = await getDb();
  const col = db.collection<User>('users');
  // Ensure unique index on email (no-op if already exists)
  await col.createIndex({ email: 1 }, { unique: true });
  return col;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<User | undefined> {
  if (!process.env.MONGODB_URI) {
    return readUsersFile().find((u) => u.email === email);
  }
  try {
    const col = await getUsersCollection();
    const doc = await col.findOne({ email });
    return doc ?? undefined;
  } catch (err) {
    console.error('[users] MongoDB findUserByEmail error:', err);
    throw err;
  }
}

export async function createUser(email: string, passwordHash: string, name: string): Promise<User> {
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (!process.env.MONGODB_URI) {
    const users = readUsersFile();
    users.push(user);
    writeUsersFile(users);
    return user;
  }

  try {
    const col = await getUsersCollection();
    await col.insertOne(user);
    return user;
  } catch (err) {
    console.error('[users] MongoDB createUser error:', err);
    throw err;
  }
}
