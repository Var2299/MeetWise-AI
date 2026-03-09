'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface Summary {
  title: string;
  tldr: string;
  key_takeaways: string[];
  decisions: { decision: string; rationale?: string }[];
  action_items: { task: string; owner: string; due: string; note?: string }[];
  suggested_followups: string[];
  confidence: number;
}

interface Props {
  summary: Summary;
  token: string;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailPanel({ summary, token }: Props) {
  const [chips, setChips] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<SendStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── chip helpers ───────────────────────────────────────────────────────────

  function tryAddChips(raw: string) {
    const entries = raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const invalid: string[] = [];
    const toAdd: string[] = [];

    for (const e of entries) {
      if (!EMAIL_RE.test(e)) {
        invalid.push(e);
      } else if (!chips.includes(e)) {
        toAdd.push(e);
      }
    }

    if (invalid.length > 0) {
      setInputError(`Invalid: ${invalid.join(', ')}`);
      return false;
    }

    setChips((prev) => [...prev, ...toAdd]);
    setInputVal('');
    setInputError(null);
    setStatus('idle');
    return true;
  }

  function removeChip(email: string) {
    setChips((prev) => prev.filter((c) => c !== email));
    setStatus('idle');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key)) {
      e.preventDefault();
      if (inputVal.trim()) tryAddChips(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',') || pasted.includes(';') || pasted.includes(' ')) {
      e.preventDefault();
      tryAddChips(pasted);
    }
  }

  function handleBlur() {
    if (inputVal.trim()) tryAddChips(inputVal);
  }

  // ── send ───────────────────────────────────────────────────────────────────

  async function handleSend() {
    // Commit any pending text in the input first
    if (inputVal.trim()) {
      const ok = tryAddChips(inputVal);
      if (!ok) return;
    }

    const allRecipients = [...chips];
    if (inputVal.trim() && EMAIL_RE.test(inputVal.trim())) {
      allRecipients.push(inputVal.trim().toLowerCase());
    }

    if (allRecipients.length === 0) {
      setInputError('Add at least one recipient email.');
      inputRef.current?.focus();
      return;
    }

    setStatus('sending');
    setStatusMsg('');

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipients: allRecipients, summary }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setStatusMsg(data.error || 'Failed to send email.');
        return;
      }

      setStatus('success');
      setStatusMsg(
        ` Email sent to ${allRecipients.length === 1 ? allRecipients[0] : `${allRecipients.length} recipients`}`
      );
    } catch {
      setStatus('error');
      setStatusMsg('Network error — check your connection and try again.');
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">✉</span>
        <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">Send Summary by Email</h3>
      </div>

      {/* Chip input */}
      <div>
        <label className="block text-xs font-medium text-ink-500 dark:text-ink-400 mb-1.5">
          Recipients — press <kbd className="px-1 py-0.5 rounded bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 text-xs font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 text-xs font-mono">,</kbd> to add
        </label>

        {/* Chip container — clicking anywhere focuses the input */}
        <div
          onClick={() => inputRef.current?.focus()}
          className={`
            min-h-[44px] w-full px-3 py-2 rounded-xl border bg-white dark:bg-ink-900
            flex flex-wrap gap-1.5 items-center cursor-text
            transition-all duration-150
            ${inputError
              ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-800'
              : 'border-ink-200 dark:border-ink-600 focus-within:ring-2 focus-within:ring-amber-warm/40 focus-within:border-amber-warm'
            }
          `}
        >
          {chips.map((email) => (
            <Chip key={email} email={email} onRemove={removeChip} />
          ))}
          <input
            ref={inputRef}
            type="email"
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setInputError(null); setStatus('idle'); }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={chips.length === 0 ? 'alice@example.com, bob@example.com' : ''}
            className="flex-1 min-w-[180px] bg-transparent outline-none text-sm text-ink-800 dark:text-ink-100 placeholder:text-ink-300 dark:placeholder:text-ink-600"
            aria-label="Add recipient email"
            aria-invalid={!!inputError}
          />
        </div>

        {inputError && (
          <p className="text-red-500 text-xs mt-1">{inputError}</p>
        )}

        {chips.length > 0 && (
          <p className="text-ink-400 dark:text-ink-500 text-xs mt-1.5">
            {chips.length} recipient{chips.length > 1 ? 's' : ''} added
            <button
              onClick={() => { setChips([]); setStatus('idle'); }}
              className="ml-2 text-ink-300 hover:text-red-400 dark:hover:text-red-400 transition-colors"
              aria-label="Clear all recipients"
            >
              Clear all
            </button>
          </p>
        )}
      </div>

      {/* Status banner */}
      {status === 'success' && (
        <div role="status" className="flex items-center gap-2.5 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-700 rounded-xl px-4 py-3">
          <span className="text-sage-600 dark:text-sage-400 text-base">✓</span>
          <p className="text-sage-700 dark:text-sage-300 text-sm font-medium">{statusMsg}</p>
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <span className="text-red-500 text-base mt-0.5">⚠</span>
          <p className="text-red-700 dark:text-red-300 text-sm">{statusMsg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-400 dark:text-ink-500 max-w-[55%]">
          Sends the full summary with JSON attachment
        </p>
        <button
          onClick={handleSend}
          disabled={status === 'sending' || (chips.length === 0 && !inputVal.trim())}
          className="btn-primary"
          aria-busy={status === 'sending'}
        >
          {status === 'sending' ? (
            <>
              <LoadingSpinner size={15} />
              Sending…
            </>
          ) : status === 'success' ? (
            <>✓ Sent — Send Again</>
          ) : (
            <>✉ Send Summary</>
          )}
        </button>
      </div>
    </div>
  );
}

function Chip({ email, onRemove }: { email: string; onRemove: (e: string) => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200 text-xs font-medium max-w-[220px]">
      <span className="truncate">{email}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(email); }}
        className="w-4 h-4 rounded flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
        aria-label={`Remove ${email}`}
      >
        ×
      </button>
    </span>
  );
}
