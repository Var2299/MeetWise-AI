# MeetWise AI

Transform meeting transcripts into structured, actionable summaries using Google Gemini AI.

## Features

- **AI Summaries** — Extracts title, TL;DR, key takeaways, decisions, action items, and follow-ups
- **Email Delivery** — Sends structured HTML + JSON summary to recipients via Gmail
- **JWT Auth** — Register/login with bcrypt-hashed passwords
- **Dark/Light Mode** — Persisted in localStorage
- **Performance Metrics** — LLM latency and token counts returned with every summary
- **Stub Mode** — Runs fully without an API key (returns example summary)

## Quick Start

```bash
git clone <repo>
cd meetwise-ai
npm install

# Copy env file and fill in your keys
cp .env.local.example .env.local

npm run dev
# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Recommended | MongoDB connection string. Without it, falls back to `data/users.json`. Get a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |
| `MONGODB_DB` | No | Database name (default: `meetwise`) |
| `GEMINI_API_KEY` | No* | Google Gemini API key. Without it, stub summaries are returned. Get one at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `JWT_SECRET` | Yes | Long random string for signing JWTs. Use `openssl rand -hex 32` |
| `EMAIL_USER` | No* | Gmail address for sending summaries |
| `EMAIL_PASS` | No* | Gmail [App Password](https://support.google.com/accounts/answer/185833) (not your real password) |

*Optional: app runs without these but with reduced functionality.

## MongoDB Collections

When `MONGODB_URI` is set, two collections are created automatically:

- **`users`** — Registered accounts (email + bcrypt hash). Unique index on `email`.
- **`summaries`** — Every generated summary, linked to the user who created it. Indexed by `userId + createdAt` for fast history queries.

The app falls back to `data/users.json` when `MONGODB_URI` is absent (demo/dev only — not safe for multi-process deployments).

## API Routes

### `POST /api/auth/register`
```json
{ "email": "you@example.com", "password": "secure123" }
→ { "token": "...", "email": "..." }
```

### `POST /api/auth/login`
```json
{ "email": "you@example.com", "password": "secure123" }
→ { "token": "...", "email": "..." }
```

### `POST /api/summarize`
Headers: `Authorization: Bearer <token>`
```json
{
  "transcript": "...up to 50,000 chars...",
  "recipients": ["alice@example.com"]
}
→ { "summary": {...}, "perf": { "latencyMs": 1230, "llmMs": 1200, "promptLength": 3200, "responseTokens": 420 } }
```

Returns `413` if transcript exceeds 50,000 characters.

## Sample Data

- `sample/transcript.txt` — Example Q3 planning meeting transcript
- `sample/expected-summary.json` — Expected JSON output from that transcript

## Project Structure

```
meetwise-ai/
├── app/
│   ├── page.tsx                 # Main UI
│   ├── layout.tsx
│   ├── globals.css
│   ├── components/
│   │   ├── AuthPanel.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── LoadingSpinner.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── login/route.ts
│       └── summarize/route.ts
├── lib/
│   ├── llm.ts                   # Gemini API helper + stub
│   ├── auth.ts                  # JWT + bcrypt helpers
│   ├── email.ts                 # Nodemailer + email builders
│   └── users.ts                 # File-based user store
├── data/
│   └── users.json               # Demo user store (auto-created)
└── sample/
    ├── transcript.txt
    └── expected-summary.json
```

## Production Notes

- **Replace `data/users.json`** with a real database (PostgreSQL, MongoDB, etc.) before deploying.
- **Use HTTPS** in production. Set `NODE_ENV=production`.
- **JWT_SECRET** must be a long, random, secret string — never commit it.
- **Gmail SMTP** requires an App Password (2FA enabled on account).
- The file-based user store is single-process only; it won't work correctly if you scale to multiple instances.
