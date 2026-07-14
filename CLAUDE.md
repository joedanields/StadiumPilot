# AGENTS.md — Instructions for OpenCode

This file is read automatically by OpenCode. It tells the coding agent how to work in this repo. (For the design of the app's own AI concierge, see `PROMPT_DESIGN.md` instead — that's a different thing.)

---

## Project
**StadiumPilot** — an AI concierge web app for stadium fans (navigation + multilingual + accessibility). Built for the Promptwars "Smart Stadiums" GenAI hackathon challenge. Full scope and milestones live in `task.md`.

## Tech stack
- Frontend: React + Vite (`/client`, dev server on :3000, proxies `/api` to :5000)
- Backend/API proxy: Node + Express (`/server`, port 5000; MongoDB optional — runs in-memory without it)
- AI: Google Gemini API (`generateContent` REST endpoint; model set by `GEMINI_MODEL` env var — currently `gemini-3.1-flash-lite` since `gemini-3.5-flash` is capped at 20 free requests/day), called server-side only via `GEMINI_API_KEY` env var — never expose the API key to the client. See PROMPT_DESIGN.md §0 for why Gemini instead of Claude; prompt + JSON contract are provider-agnostic.
- Deployment target: Vercel / Netlify / Google Cloud Run (NOT GitHub Pages — disallowed by challenge rules)

## Repo structure (keep this accurate as it evolves)
```
/client            — React + Vite frontend (map, chat, reasoning panel)
/server            — Express backend: /api/chat (Gemini call), /api/stadium (data + live state)
/tests             — edge case + functional tests (see task.md M4/M5)
task.md            — build plan and milestones
PROMPT_DESIGN.md    — in-app AI agent system prompt, JSON contract, edge case behavior
README.md          — public-facing overview for judges
```

## Rules for the coding agent
1. **Never hard-code AI responses.** Every "smart" feature must actually call the model API — static/templated fallback responses risk disqualification per the challenge rules.
2. **API key handling**: read from environment variable only, call the model API from a backend/serverless function, never from client-side code.
3. **Follow the JSON contract in `PROMPT_DESIGN.md` exactly** — the frontend expects `{answer, reasoning, route, language_detected, alert_level, clarifying_question}`. If you change the schema, update `PROMPT_DESIGN.md` in the same commit.
4. **Don't add personas or verticals beyond Fan + Navigation/Multilingual/Accessibility** without checking `task.md` scope guardrails first — this is a deliberate scope limit, not an oversight.
5. When adding a feature, add or update its corresponding edge case test in `/tests` — testing edge cases is explicitly part of the scoring rubric.
6. Prefer simple, efficient implementations over clever ones (e.g. don't reach for a vector DB or multi-agent chain when a single well-structured prompt does the job) — engineering efficiency is scored.
7. Keep this file and `task.md` up to date as milestones complete — don't let docs drift from actual repo state.

## How to run
```
# server (needs server/.env with GEMINI_API_KEY)
cd server && npm install && npm run dev   # :5000

# client (separate terminal)
cd client && npm install && npm run dev   # :3000

# or both at once from repo root:
node dev.js
```

## How to test
```
# unit + endpoint tests (no API key/quota needed):
npm test

# edge-case tests (real Gemini calls; needs the server running):
npm run test:edge
```
Results are logged in `TESTING.md` — update it when behavior changes.
