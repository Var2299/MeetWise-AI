import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'meetwise';

if (!MONGODB_URI) {
  console.warn('[MeetWise] MONGODB_URI not set — MongoDB features will be unavailable.');
}

// Reuse connection across hot reloads in dev (Next.js global caching pattern)
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set.');

  // In development, reuse across module reloads
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(MONGODB_URI);
      await global._mongoClient.connect();
    }
    return global._mongoClient;
  }

  // In production, reuse within the same server instance
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function getDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(DB_NAME);
}
