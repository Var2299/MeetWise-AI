# MeetWise AI ✦

> Transform raw meeting transcripts into structured, actionable summaries — powered by Google Gemini AI.

MeetWise AI takes any meeting transcript (paste or upload), runs it through Gemini, and returns a clean breakdown of decisions, action items, key takeaways, and follow-ups. Summaries are saved to MongoDB, can be emailed to recipients, and exported as JSON.

---

## Features

- **AI Summarization** — Extracts title, TL;DR, key takeaways, decisions, action items, and suggested follow-ups using Gemini 2.5 Flash
- **Email Delivery** — Send any summary to one or more recipients with a chip-based email input, HTML email body, and JSON attachment
- **Authentication** — Register with name/email/password, login with JWT — passwords hashed with bcrypt
- **MongoDB Storage** — Users and all generated summaries persisted in MongoDB Atlas (falls back to a local JSON file for demo use)
- **Summary History** — Browse and reload any past summary from the sidebar
- **Dark / Light Mode** — Toggle persisted in `localStorage`
- **Performance Metrics** — LLM latency, total latency, prompt length, and token count returned with every summary

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Google Gemini 1.5 Flash (via REST API) |
| Database | MongoDB (via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Fonts | Playfair Display + DM Sans |

---

## Preview

### User Authentication
<img width="1917" height="980" alt="image" src="https://github.com/user-attachments/assets/ad8eb552-ff6c-48bf-8c15-437993ed9d94" />

---

### User Authentication - Dark Themed
<img width="1917" height="990" alt="image" src="https://github.com/user-attachments/assets/e7964200-1c07-4133-93f5-66b9a2cfb144" />

--- 

### Home Page
<img width="1902" height="981" alt="image" src="https://github.com/user-attachments/assets/cb5bbaa4-c2e7-4c94-a10d-f510ddac41ff" />

---

### AI-Generated Summary
<img width="1898" height="913" alt="image" src="https://github.com/user-attachments/assets/fae9eb14-9647-4a1b-a53e-d99c5f2a0b11" />

---

<img width="1896" height="825" alt="image" src="https://github.com/user-attachments/assets/97652ad6-08f2-483b-9648-c8c9f40ed324" />

---

### Email Delivery
<img width="1087" height="365" alt="image" src="https://github.com/user-attachments/assets/b732e53d-cc16-4c18-9c88-f31b59486b93" />

---

<img width="1736" height="97" alt="image" src="https://github.com/user-attachments/assets/a52dc244-7666-4e4d-8ce0-36e5d5d1fba0" />

---

<img width="1837" height="890" alt="image" src="https://github.com/user-attachments/assets/e815e59a-3de6-450d-81ed-90ed3a1768b9" />

---

### History
<img width="1117" height="380" alt="image" src="https://github.com/user-attachments/assets/bf41c8f4-01d0-4497-9c93-f0310dec910c" />

---

### User Info(MONGO_DB)
<img width="782" height="167" alt="image" src="https://github.com/user-attachments/assets/2fed24bd-95be-4de3-a44d-a7fa3cd77c1e" />

---

### Summaries(MONGO_DB)
<img width="982" height="447" alt="image" src="https://github.com/user-attachments/assets/4bc8b3b0-cf60-4d74-a7d8-139d196a0e9b" />

---

<img width="727" height="470" alt="image" src="https://github.com/user-attachments/assets/693e0e99-5d34-4710-9101-bbd0f6c055cb" />

---

<img width="688" height="312" alt="image" src="https://github.com/user-attachments/assets/40d0ace7-d3ad-488d-a18a-c5e7ebd22e55" />

---

### Performance & Latency (Avg. 5.5s)
<img width="1783" height="462" alt="image" src="https://github.com/user-attachments/assets/056cdd2a-27d5-4cef-8bdb-61abb1b06052" />

---

## Project Structure

```
meetwise-ai/
├── app/
│   ├── page.tsx                    # Main UI — transcript input, summary display
│   ├── layout.tsx
│   ├── globals.css
│   ├── components/
│   │   ├── AuthPanel.tsx           # Login / register form
│   │   ├── SummaryCard.tsx         # Structured summary display + JSON export
│   │   ├── EmailPanel.tsx          # Chip-based recipient input + send button
│   │   ├── HistoryPanel.tsx        # Past summaries from MongoDB
│   │   ├── ThemeToggle.tsx         # Dark/light toggle
│   │   └── LoadingSpinner.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts   # POST — create account
│       │   └── login/route.ts      # POST — sign in
│       ├── summarize/route.ts      # POST — generate summary
│       ├── summaries/route.ts      # GET  — fetch user history
│       └── email/route.ts          # POST — send summary email
├── lib/
│   ├── llm.ts                      # Gemini API call + stub fallback
│   ├── auth.ts                     # JWT + bcrypt helpers
│   ├── email.ts                    # Nodemailer + HTML/text email builders
│   ├── users.ts                    # User store (MongoDB or JSON file)
│   ├── summaries.ts                # Summary store (MongoDB)
│   └── mongodb.ts                  # MongoDB connection singleton
├── data/
│   └── users.json                  # Fallback user store (auto-created)
└── sample/
    ├── transcript.txt              # Example meeting transcript
    └── expected-summary.json       # Expected JSON output
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster (or local MongoDB)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key for real summaries
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for email sending

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/meetwise-ai.git
cd meetwise-ai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in your keys (see below)

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB — recommended for full functionality
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=meetwise

# Google Gemini — required for real AI summaries
GEMINI_API_KEY=your_gemini_api_key_here

# JWT — required, use a long random string
JWT_SECRET=change-this-to-a-long-random-secret

# Gmail SMTP — required for email sending
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

NODE_ENV=development
```
---

## API Reference

### Auth

```
POST /api/auth/register
Body: { name, email, password }
→    { token, email, name }

POST /api/auth/login
Body: { email, password }
→    { token, email, name }
```

### Summarize

```
POST /api/summarize
Headers: Authorization: Bearer <token>
Body: { transcript }          # max 50,000 characters
→    { summary, perf }
```

Returns `413` if the transcript exceeds 50,000 characters.

### Email

```
POST /api/email
Headers: Authorization: Bearer <token>
Body: { recipients: string[], summary }
→    { ok, recipients, subject }
```

### History

```
GET /api/summaries
Headers: Authorization: Bearer <token>
→    { summaries }            # 30 most recent, newest first
```

---

## Summary Output Shape

Every summary follows this JSON structure:

```json
{
  "title": "Q3 Planning Meeting",
  "tldr": "One-sentence summary of the meeting.",
  "key_takeaways": ["...", "..."],
  "decisions": [
    { "decision": "Proceed with Vendor A", "rationale": "Better pricing and SLA" }
  ],
  "action_items": [
    { "task": "Draft vendor contract", "owner": "Jane", "due": "2025-07-23", "note": "Legal must approve" }
  ],
  "suggested_followups": ["...", "..."],
  "confidence": 0.92
}
```

---

## Database

When `MONGODB_URI` is configured, two collections are created automatically:

- **`users`** — name, email, bcrypt-hashed password. Unique index on `email`.
- **`summaries`** — full summary JSON, user reference, recipients, perf metrics, timestamp. Indexed on `userId + createdAt`.

Without `MONGODB_URI`, user accounts are stored in `data/users.json` (single-process, dev only).

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, random `JWT_SECRET` — never commit it
- [ ] Connect a real MongoDB instance (Atlas or self-hosted)
- [ ] Enable HTTPS
- [ ] Use a Gmail App Password, not your account password
- [ ] Replace `data/users.json` with MongoDB before scaling
