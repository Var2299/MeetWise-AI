'use client';

import { useState, useEffect, useRef } from 'react';
import AuthPanel from './components/AuthPanel';
import SummaryCard from './components/SummaryCard';
import ThemeToggle from './components/ThemeToggle';
import LoadingSpinner from './components/LoadingSpinner';
import HistoryPanel from './components/HistoryPanel';
import type { SummaryRecord } from '@/lib/summaries';

interface PerfInfo {
  latencyMs: number;
  llmMs: number;
  promptLength: number;
  responseTokens: number;
}

interface Summary {
  title: string;
  tldr: string;
  key_takeaways: string[];
  decisions: { decision: string; rationale?: string }[];
  action_items: { task: string; owner: string; due: string; note?: string }[];
  suggested_followups: string[];
  confidence: number;
}

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [perf, setPerf] = useState<PerfInfo | null>(null);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist auth across page refreshes via sessionStorage
  useEffect(() => {
    const t = sessionStorage.getItem('mw_token');
    const e = sessionStorage.getItem('mw_email');
    const n = sessionStorage.getItem('mw_name');
    if (t) setToken(t);
    if (e) setUserEmail(e);
    if (n) setUserName(n);
  }, []);

  function handleAuth(t: string, email: string, name: string) {
    setToken(t);
    setUserEmail(email);
    setUserName(name);
    sessionStorage.setItem('mw_token', t);
    sessionStorage.setItem('mw_email', email);
    sessionStorage.setItem('mw_name', name);
  }

  function handleLogout() {
    setToken(null);
    setUserEmail(null);
    setUserName(null);
    setSummary(null);
    sessionStorage.removeItem('mw_token');
    sessionStorage.removeItem('mw_email');
    sessionStorage.removeItem('mw_name');
  }

  function handleTranscriptChange(val: string) {
    setTranscript(val);
    setCharCount(val.length);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleTranscriptChange(text);
  }

  async function handleSummarize() {
    if (!transcript.trim()) {
      setError('Please paste or upload a meeting transcript.');
      return;
    }
    if (charCount > 50000) {
      setError('Transcript exceeds 50,000 characters. Please shorten it.');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSummary(data.summary);
      setPerf(data.perf);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const isOverLimit = charCount > 50000;

  if (!token) {
    return (
      <div className="min-h-screen bg-ink-50 dark:bg-ink-900 paper-texture flex flex-col">
        <Header showAuth={false} />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
        <AuthPanel onAuth={handleAuth} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 paper-texture flex flex-col">
      <Header userEmail={userEmail} userName={userName} onLogout={handleLogout} showAuth />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <p className="text-xs font-medium tracking-widest text-ink-400 dark:text-ink-500 uppercase">AI-Powered</p>
          <h1 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-ink-50">
            Summarize your meeting
          </h1>
          <p className="text-ink-500 dark:text-ink-400 text-sm max-w-md mx-auto">
            Paste or upload a transcript. Get structured decisions, action items, and follow-ups in seconds.
          </p>
        </div>

        {/* History panel (MongoDB) */}
        <HistoryPanel
          token={token}
          onSelect={(r: SummaryRecord) => {
            setSummary(r.summary);
            setPerf(r.perf);
          }}
        />

        {/* Input card */}
        <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-6 space-y-5">
          {/* Transcript area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="transcript" className="text-sm font-medium text-ink-700 dark:text-ink-200">
                Meeting Transcript
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono tabular-nums ${isOverLimit ? 'text-red-500' : 'text-ink-400 dark:text-ink-500'}`}>
                  {charCount.toLocaleString()} / 50,000
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs py-1.5 px-3"
                  aria-label="Upload transcript file"
                >
                  ↑ Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.vtt"
                  className="hidden"
                  onChange={handleFileUpload}
                  aria-label="Transcript file input"
                />
              </div>
            </div>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => handleTranscriptChange(e.target.value)}
              placeholder="Paste your meeting transcript here, or upload a .txt / .md / .vtt file…"
              rows={10}
              className={`input-field resize-y font-mono text-sm leading-relaxed ${isOverLimit ? 'border-red-400 focus:ring-red-300' : ''}`}
              aria-describedby={isOverLimit ? 'char-error' : undefined}
            />
            {isOverLimit && (
              <p id="char-error" className="text-red-500 text-xs mt-1">
                Transcript is {(charCount - 50000).toLocaleString()} characters over the limit.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between">
            {perf && (
              <p className="text-xs text-ink-400 dark:text-ink-500 font-mono">
                {perf.latencyMs.toFixed(0)}ms · {perf.responseTokens} tokens
              </p>
            )}
            <button
              onClick={handleSummarize}
              disabled={loading || isOverLimit || !transcript.trim()}
              className="btn-primary ml-auto"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size={16} />
                  Summarizing…
                </>
              ) : (
                <>✦ Summarize</>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 fade-in">
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="loading-dot w-2.5 h-2.5 rounded-full bg-amber-warm inline-block" />
              ))}
            </div>
            <p className="text-ink-500 dark:text-ink-400 text-sm">Analyzing transcript…</p>
          </div>
        )}

        {/* Result */}
        {summary && !loading && (
          <div className="fade-in">
            <SummaryCard summary={summary} perf={perf} token={token} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header({
  userEmail,
  userName,
  onLogout,
  showAuth,
}: {
  userEmail?: string | null;
  userName?: string | null;
  onLogout?: () => void;
  showAuth: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-ink-900/80 backdrop-blur-md border-b border-ink-100 dark:border-ink-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-warm text-lg">✦</span>
          <span className="font-display font-semibold text-ink-900 dark:text-ink-50 tracking-tight">MeetWise AI</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {showAuth && userEmail && (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-warm/20 dark:bg-amber-warm/30 text-amber-warm flex items-center justify-center text-xs font-bold uppercase">
                  {(userName || userEmail).charAt(0)}
                </span>
                <span className="text-sm font-medium text-ink-700 dark:text-ink-200 truncate max-w-[160px]">
                  {userName || userEmail}
                </span>
              </div>
              <button onClick={onLogout} className="btn-secondary text-xs py-1.5 px-3" aria-label="Sign out">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100 dark:border-ink-800 py-6 px-4 text-center">
      <p className="text-xs text-ink-300 dark:text-ink-600">
        MeetWise AI · Built with Next.js and MongoDB
      </p>
    </footer>
  );
}
