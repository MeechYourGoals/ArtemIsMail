# ArtemIsMail

AI-powered inbox inspired by AC at a16Z.

## Features

- **Google Sign-in** (Supabase Auth) – optional; app works without auth for local dev
- **AI Email Analysis** – draft replies, archive suggestions, priority scoring
- **Custom Instructions** – tell Artemis how to prioritize and respond
- **Knowledge Base** – upload context (company info, preferences) for smarter analysis
- **Demo / Live Mode** – toggle between demo data and live emails

## Setup

### 1. Server

```bash
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, optionally OPENAI_API_KEY
npm install
npx prisma generate
npm run dev
```

### 2. Client

```bash
cd client
cp .env.example .env
# Optional: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for Google auth
npm install
npm run dev
```

### 3. Google Sign-in (Optional)

1. Create a [Supabase](https://supabase.com) project
2. Enable Google in Authentication > Providers
3. Add your app URL to Redirect URLs (e.g. `http://localhost:5173`)
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `client/.env`

**Fixing "Connecting" freeze:** The app uses a 5s timeout and proper OAuth callback handling. Ensure your redirect URL in Supabase matches your app URL exactly.

### 4. AI Analysis

- **Lovable gateway** (recommended): Set `LOVABLE_AI_GATEWAY_URL` to your Lovable project's AI gateway URL (from project settings or deployment env). No API key needed when deployed via Lovable.
- **OpenAI**: Set `OPENAI_API_KEY` for direct OpenAI access (e.g. local dev without Lovable).
- **Fallback**: If neither is set, uses rule-based analysis (newsletter detection, question detection).

## API

- `GET /api/emails?mode=demo|live` – fetch emails
- `GET/PUT /api/settings` – custom instructions (requires `X-User-Id` when auth enabled)
- `GET/POST/DELETE /api/knowledge` – knowledge base
- `POST /api/ai/analyze` – analyze email with AI
