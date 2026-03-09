'use client';

import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  onAuth: (token: string, email: string, name: string) => void;
}

export default function AuthPanel({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(m: 'login' | 'register') {
    setMode(m);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  }

  async function handleSubmit() {
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'register'
      ? { name: name.trim(), email, password }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      onAuth(data.token, data.email, data.name);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo mark */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-900 dark:bg-amber-warm text-white text-2xl mb-4">
          ✦
        </div>
        <h1 className="font-display text-2xl text-ink-900 dark:text-ink-50">MeetWise AI</h1>
        <p className="text-ink-400 dark:text-ink-500 text-sm mt-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>
      </div>

      <div className="bg-white dark:bg-ink-800 rounded-2xl card-shadow dark:card-shadow-dark p-6 space-y-4">
        {/* Mode tabs */}
        <div className="flex bg-ink-50 dark:bg-ink-900 rounded-xl p-1 gap-1" role="tablist">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                mode === m
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-ink-50 shadow-sm'
                  : 'text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Name — register only */}
        {mode === 'register' && (
          <div>
            <label htmlFor="auth-name" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Full Name
            </label>
            <input
              id="auth-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="input-field"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            className="input-field"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full justify-center"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} />
              {mode === 'login' ? 'Signing in…' : 'Creating account…'}
            </>
          ) : (
            mode === 'login' ? 'Sign in' : 'Create account'
          )}
        </button>
      </div>

      <p className="text-center text-xs text-ink-400 dark:text-ink-500 mt-4">
        Secure production build.
      </p>
    </div>
  );
}
