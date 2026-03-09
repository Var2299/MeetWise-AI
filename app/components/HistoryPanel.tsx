'use client';

import { useEffect, useState } from 'react';
import type { SummaryRecord } from '@/lib/summaries';

interface Props {
  token: string;
  onSelect: (record: SummaryRecord) => void;
}

export default function HistoryPanel({ token, onSelect }: Props) {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/summaries', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRecords(d.summaries ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [open, token]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
        aria-label="View summary history"
      >
        ◴ History
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-700">
        <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
          ◴ Summary History
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 text-lg leading-none transition-colors"
          aria-label="Close history"
        >
          ×
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="loading-dot w-2 h-2 rounded-full bg-amber-warm inline-block" />
            ))}
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 text-ink-400 dark:text-ink-500 text-sm">
          {process.env.NEXT_PUBLIC_HAS_MONGO === 'false'
            ? 'MongoDB not configured — history requires MONGODB_URI.'
            : 'No summaries yet. Summarize a transcript to get started.'}
        </div>
      ) : (
        <ul className="divide-y divide-ink-50 dark:divide-ink-700/50 max-h-96 overflow-y-auto">
          {records.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => { onSelect(r); setOpen(false); }}
                className="w-full text-left px-5 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors duration-100 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate group-hover:text-amber-warm transition-colors">
                      {r.summary.title}
                    </p>
                    <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5 truncate">{r.summary.tldr}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-ink-400 dark:text-ink-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-ink-300 dark:text-ink-600">
                      {r.perf.latencyMs.toFixed(0)}ms
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
