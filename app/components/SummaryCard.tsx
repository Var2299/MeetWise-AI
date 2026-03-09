'use client';

import { useState } from 'react';
import EmailPanel from './EmailPanel';

interface ActionItem {
  task: string;
  owner: string;
  due: string;
  note?: string;
}

interface Decision {
  decision: string;
  rationale?: string;
}

interface Summary {
  title: string;
  tldr: string;
  key_takeaways: string[];
  decisions: Decision[];
  action_items: ActionItem[];
  suggested_followups: string[];
  confidence: number;
}

interface PerfInfo {
  latencyMs: number;
  llmMs: number;
  promptLength: number;
  responseTokens: number;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'text-sage-600 bg-sage-50 dark:text-sage-300 dark:bg-sage-900/30' :
                pct >= 40 ? 'text-amber-warm bg-amber-pale dark:text-amber-light dark:bg-amber-warm/20' :
                            'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/20';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {pct}% confidence
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-ink-400 dark:text-ink-500 uppercase mb-3">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

export default function SummaryCard({ summary, perf, token }: { summary: Summary; perf: PerfInfo | null; token: string }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meetwise-summary.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 stagger-children">
      {/* Header card */}
      <div className="bg-ink-900 dark:bg-ink-950 rounded-2xl p-6 text-ink-50">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-medium tracking-widest text-ink-400 uppercase mb-1">Summary</p>
            <h2 className="font-display text-xl md:text-2xl">{summary.title}</h2>
          </div>
          <ConfidenceBadge value={summary.confidence} />
        </div>
        <p className="text-ink-300 text-sm leading-relaxed">{summary.tldr}</p>
        {perf && (
          <p className="text-ink-500 text-xs font-mono mt-3">
            Generated in {perf.latencyMs.toFixed(0)}ms · {perf.responseTokens} tokens · {perf.promptLength.toLocaleString()} chars
          </p>
        )}
      </div>

      {/* Key Takeaways */}
      <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-6">
        <Section title="Key Takeaways" icon="◈">
          <ul className="space-y-2">
            {summary.key_takeaways.map((k, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink-700 dark:text-ink-200">
                <span className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 text-xs flex items-center justify-center font-mono">
                  {i + 1}
                </span>
                {k}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Decisions */}
      {summary.decisions.length > 0 && (
        <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-6">
          <Section title="Decisions" icon="✓">
            <div className="space-y-3">
              {summary.decisions.map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-sage-50 dark:bg-sage-900/20 border border-sage-100 dark:border-sage-800">
                  <span className="text-sage-600 dark:text-sage-400 mt-0.5 flex-shrink-0">✓</span>
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{d.decision}</p>
                    {d.rationale && (
                      <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{d.rationale}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Action Items */}
      {summary.action_items.length > 0 && (
        <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-6">
          <Section title="Action Items" icon="◎">
            <div className="space-y-3">
              {summary.action_items.map((a, i) => (
                <div key={i} className="p-3 rounded-xl border border-ink-100 dark:border-ink-700 hover:border-amber-warm/40 transition-colors duration-150">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">📌 {a.task}</p>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-medium text-amber-warm">{a.owner}</p>
                      <p className="text-xs text-ink-400 dark:text-ink-500 font-mono">{a.due}</p>
                    </div>
                  </div>
                  {a.note && (
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1.5 pl-1 border-l-2 border-ink-200 dark:border-ink-600">{a.note}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Follow-ups */}
      {summary.suggested_followups.length > 0 && (
        <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-6">
          <Section title="Suggested Follow-Ups" icon="→">
            <ul className="space-y-2">
              {summary.suggested_followups.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-amber-warm mt-0.5 flex-shrink-0">→</span>
                  {f}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}

      {/* ── Email this summary ── */}
      <EmailPanel summary={summary} token={token} />

      {/* JSON export */}
      <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowJson(!showJson)}
            className="text-sm text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors font-mono"
            aria-expanded={showJson}
          >
            {showJson ? '▾' : '▸'} {showJson ? 'Hide' : 'View'} raw JSON
          </button>
          <div className="flex items-center gap-2">
            <button onClick={copyJson} className="btn-secondary text-xs py-1.5 px-3">
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
            <button onClick={downloadJson} className="btn-secondary text-xs py-1.5 px-3">
              ↓ Download
            </button>
          </div>
        </div>
        {showJson && (
          <pre className="mt-4 p-4 bg-ink-50 dark:bg-ink-900 rounded-xl text-xs font-mono text-ink-700 dark:text-ink-300 overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
            {JSON.stringify(summary, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
