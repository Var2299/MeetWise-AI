import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { sendSummaryEmail, buildEmailHtml, buildEmailText } from '@/lib/email';
import type { MeetingSummary } from '@/lib/llm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  let recipients: string[];
  let summary: MeetingSummary;

  try {
    const body = await req.json();
    recipients = body.recipients;
    summary = body.summary;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
  }

  const invalid = recipients.filter((e) => !EMAIL_RE.test(e));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}` },
      { status: 400 }
    );
  }

  if (!summary?.title || !summary?.tldr) {
    return NextResponse.json({ error: 'Invalid summary payload' }, { status: 400 });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json(
      { error: 'Email is not configured on this server. Set EMAIL_USER and EMAIL_PASS in .env.local.' },
      { status: 503 }
    );
  }

  const subject = `MeetWise AI summary — ${summary.tldr.slice(0, 80)}`;
  const html = buildEmailHtml(summary);
  const text = buildEmailText(summary);

  try {
    await sendSummaryEmail(recipients, subject, html, text, summary);
    console.log(`[email] Sent summary "${summary.title}" to ${recipients.join(', ')} by ${auth.email}`);
    return NextResponse.json({ ok: true, recipients, subject });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email] Send failed:', msg);
    return NextResponse.json(
      { error: `Failed to send email: ${msg}` },
      { status: 502 }
    );
  }
}
