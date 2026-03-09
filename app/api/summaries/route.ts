import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { getUserSummaries } from '@/lib/summaries';

/** GET /api/summaries — returns the authenticated user's summary history */
export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ summaries: [], note: 'MongoDB not configured — history unavailable.' });
  }

  const summaries = await getUserSummaries(auth.userId, 30);
  return NextResponse.json({ summaries });
}
