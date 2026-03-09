import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { summarizeWithGemini } from '@/lib/llm';
import { sendSummaryEmail, buildEmailHtml, buildEmailText } from '@/lib/email';
import { saveSummary } from '@/lib/summaries';

const MAX_TRANSCRIPT_LENGTH = 50_000;

/** Strip ASCII control characters (except newlines/tabs) */
function sanitize(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function validateEmails(emails: string[]): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every((e) => re.test(e));
}

export async function POST(req: NextRequest) {
  // Auth guard
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  let transcript: string;
  let recipients: string[] = [];

  try {
    const body = await req.json();
    transcript = body.transcript;
    recipients = body.recipients ?? [];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'transcript field required' }, { status: 400 });
  }

  const clean = sanitize(transcript);

  if (clean.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      { error: `Transcript too long (${clean.length} chars). Maximum is ${MAX_TRANSCRIPT_LENGTH}.` },
      { status: 413 }
    );
  }

  if (recipients.length > 0 && !validateEmails(recipients)) {
    return NextResponse.json({ error: 'One or more recipient emails are invalid' }, { status: 400 });
  }

  const start = process.hrtime.bigint();

  const beforeLLM = process.hrtime.bigint();
  let summary;
  try {
    summary = await summarizeWithGemini(clean);
  } catch (err) {
    console.error('[summarize] LLM error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 502 });
  }
  const afterLLM = process.hrtime.bigint();

  const llmMs = Number(afterLLM - beforeLLM) / 1e6;
  const latencyMs = Number(afterLLM - start) / 1e6;
  const promptLength = clean.length;
  // Rough token estimate: 4 chars ≈ 1 token
  const responseTokens = Math.round(JSON.stringify(summary).length / 4);

  console.log(`[perf] latencyMs=${latencyMs.toFixed(1)} llmMs=${llmMs.toFixed(1)} promptLength=${promptLength} responseTokens=${responseTokens} user=${auth.email}`);

  const perf = { latencyMs, llmMs, promptLength, responseTokens };

  // Persist summary to MongoDB (non-blocking, non-fatal)
  saveSummary({
    userId: auth.userId,
    userEmail: auth.email,
    summary,
    recipients,
    perf,
  }).catch((err) => console.error('[summarize] Failed to persist summary:', err));

  // Send email(s) if recipients provided
  if (recipients.length > 0) {
    const subject = `MeetWise AI summary — ${summary.tldr.slice(0, 80)}`;
    const html = buildEmailHtml(summary);
    const text = buildEmailText(summary);
    try {
      await sendSummaryEmail(recipients, subject, html, text, summary);
    } catch (err) {
      console.error('[summarize] email error:', err);
      // Non-fatal: still return summary
    }
  }

  return NextResponse.json({ summary, perf });
}
