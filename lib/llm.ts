import { GoogleGenAI } from '@google/genai';

export interface ActionItem {
  task: string;
  owner: string;
  due: string;
  note?: string;
}

export interface Decision {
  decision: string;
  rationale?: string;
}

export interface MeetingSummary {
  title: string;
  tldr: string;
  key_takeaways: string[];
  decisions: Decision[];
  action_items: ActionItem[];
  suggested_followups: string[];
  confidence: number;
}

const SYSTEM_PROMPT = `You are an expert meeting summarizer. Output a strict JSON object only with these keys:
- title: string
- tldr: string (one sentence)
- key_takeaways: string[] (each ≤ 30 words)
- decisions: {decision: string, rationale?: string}[]
- action_items: {task: string, owner: string, due: string, note?: string}[]
- suggested_followups: string[]
- confidence: number (0-1)

Rules: Keep text concise (≤ 30 words per bullet). If date strings appear, infer ISO dates or set "TBD". Output JSON only — no markdown, no explanation.`;

const USER_PROMPT = (transcript: string) =>
  `Here is a meeting transcript:\n\n${transcript}\n\nProduce JSON only. Prioritize decisions and action items. Minimize verbosity.`;

/** Stub used when GEMINI_API_KEY is absent */
function stubSummary(transcript: string): MeetingSummary {
  const wordCount = transcript.split(/\s+/).length;
  return {
    title: '[STUB] Q3 Planning Meeting',
    tldr: 'Team aligned on Q3 priorities, delegated key tasks, and scheduled follow-ups. (Stub — add GEMINI_API_KEY for real summary)',
    key_takeaways: [
      'Budget approved for new infrastructure upgrade project.',
      'Marketing campaign launch moved to first week of next month.',
      'Engineering team to complete API v2 migration by end of quarter.',
      `Transcript contained approximately ${wordCount} words.`,
    ],
    decisions: [
      { decision: 'Proceed with vendor A for cloud hosting', rationale: 'Better pricing and SLA terms' },
      { decision: 'Defer mobile app feature to Q4', rationale: 'Resource constraints and shifting priorities' },
    ],
    action_items: [
      { task: 'Draft vendor contract and send for review', owner: 'Sarah Chen', due: 'TBD', note: 'Legal team must approve first' },
      { task: 'Update project roadmap on Confluence', owner: 'James Park', due: 'TBD' },
      { task: 'Schedule follow-up sync with stakeholders', owner: 'All', due: 'TBD' },
    ],
    suggested_followups: [
      'Review vendor contract with legal before signing.',
      'Align on Q4 mobile app scope and timeline.',
      'Share updated roadmap with wider org.',
    ],
    confidence: 0.0,
  };
}

export async function summarizeWithGemini(transcript: string): Promise<MeetingSummary> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[MeetWise] GEMINI_API_KEY not set — returning stub summary.');
    return stubSummary(transcript);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${SYSTEM_PROMPT}\n\n${USER_PROMPT(transcript)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      maxOutputTokens: 2048,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }, // disable thinking to save tokens
    },
  });

  const raw: string = response.text ?? '{}';

  // Strip possible markdown fences just in case
  const clean = raw.replace(/```json|```/g, '').trim();

  const parsed = JSON.parse(clean) as MeetingSummary;
  return parsed;
}