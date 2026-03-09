/**
 * Summary store — persists generated summaries to MongoDB.
 * Silently skips if MONGODB_URI is not set.
 */

import type { MeetingSummary } from './llm';

export interface SummaryRecord {
  id: string;
  userId: string;
  userEmail: string;
  summary: MeetingSummary;
  recipients: string[];
  perf: {
    latencyMs: number;
    llmMs: number;
    promptLength: number;
    responseTokens: number;
  };
  createdAt: string;
}

async function getSummariesCollection() {
  const { getDb } = await import('./mongodb');
  const db = await getDb();
  const col = db.collection<SummaryRecord>('summaries');
  // Index for fast per-user lookups, sorted by newest first
  await col.createIndex({ userId: 1, createdAt: -1 });
  return col;
}

/** Save a summary record. Non-throwing — logs on error. */
export async function saveSummary(record: Omit<SummaryRecord, 'id' | 'createdAt'>): Promise<SummaryRecord | null> {
  if (!process.env.MONGODB_URI) return null;
  try {
    const col = await getSummariesCollection();
    const full: SummaryRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(full);
    console.log(`[summaries] Saved summary ${full.id} for ${full.userEmail}`);
    return full;
  } catch (err) {
    console.error('[summaries] Failed to save summary:', err);
    return null;
  }
}

/** Fetch the N most recent summaries for a user. */
export async function getUserSummaries(userId: string, limit = 20): Promise<SummaryRecord[]> {
  if (!process.env.MONGODB_URI) return [];
  try {
    const col = await getSummariesCollection();
    return await col
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (err) {
    console.error('[summaries] Failed to fetch summaries:', err);
    return [];
  }
}
