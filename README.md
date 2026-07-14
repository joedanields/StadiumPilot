# StadiumPilot 🏟️

**An AI concierge for stadium fans — navigation, multilingual assistance, and accessibility, explained.**

Built for the Promptwars **Smart Stadiums & Tournament Operations** GenAI challenge (2026 FIFA World Cup context).
Persona: **Fan** · Verticals: **Navigation + Multilingual Assistance + Accessibility**

🔗 **Live demo:** https://stadiumpilot.onrender.com *(free tier — first load after idle takes ~50s to wake)*

![StadiumPilot screenshot](docs/screenshot.png)

---

## What it does

A fan at a live match asks anything — *"Where's the nearest bathroom?"*, *"Je suis en fauteuil roulant, comment aller au stand de nourriture ?"*, *"I feel dizzy"* — and StadiumPilot:

1. **Detects the language** and answers in it (French in, French out; Welsh in, Welsh out).
2. **Reasons over live stadium state** — gate status and per-zone crowd density shift every 5 seconds — plus the fan's profile (location, accessibility needs, dietary restrictions).
3. **Draws the route on a live map** from the fan's actual position to the destination.
4. **Explains itself** — every answer carries plain-language reasoning shown in the *"Why This Route?"* panel (explainability as a product feature, not an afterthought).
5. **Escalates emergencies** — medical/distress language overrides normal chat: `alert_level: emergency`, immediate route to first aid, and a visible alert state across the UI.
6. **Treats accessibility as a hard constraint** — a wheelchair user is never routed through a stairs-only section; if the destination itself is inaccessible, the agent says so and offers a next step.

## Architecture

```
client/   React + Vite — stadium map (SVG), concierge chat, XAI reasoning panel
server/   Node + Express — /api/chat (Gemini call), /api/stadium (data + live state)
tests/    unit tests (API-free) + 11 edge-case tests against the real model
```

One reasoning agent, one model call per query, structured output — deliberately **not** a multi-agent chain or vector DB. The system prompt plus an **enforced JSON response schema** (Gemini structured-output mode) returns:

```json
{ "answer": "...", "reasoning": "...", "route": ["..."], "language_detected": "fr",
  "alert_level": "normal | caution | emergency", "clarifying_question": null }
```

The schema is the contract between backend and frontend — no free-text parsing, and the reasoning field is first-class. Full prompt design rationale and edge-case behavior: [PROMPT_DESIGN.md](PROMPT_DESIGN.md).

**Model:** Google Gemini (`gemini-3.1-flash-lite`, configurable via `GEMINI_MODEL`). The prompt and contract are provider-agnostic — swapping providers changes one backend module ([server/lib/gemini.js](server/lib/gemini.js)).

## Security

- The Gemini API key lives **server-side only** (`GEMINI_API_KEY` env var); the browser never sees it — all model calls go through the Express backend.
- Input validation: empty and >1000-character messages are rejected before any model call.
- Only session-relevant data (location, accessibility flag, dietary flags) is sent to the model — no user identity.

## Run locally

```bash
# 1. server — create server/.env with GEMINI_API_KEY=<your key> (see .env.example)
cd server && npm install && npm run dev        # http://localhost:5000

# 2. client (separate terminal)
cd client && npm install && npm run dev        # http://localhost:3000

# or both at once from the repo root:
npm run dev
```

MongoDB is optional — without `MONGODB_URI` the app runs fully in-memory.

## Testing

```bash
npm test           # unit + endpoint tests — no API key or quota needed
npm run test:edge  # 11 edge cases against the real model (server must be running)
```

Edge cases are scored explicitly in this challenge, so they are tested explicitly — emergency escalation, gibberish input, wheelchair-vs-stairs conflict, dietary restriction with zero matching vendors (the agent says "not available" rather than inventing one), mid-session gate closure with reroute, and rare-language fallback. Latest results (11/11 + all unit tests passing) are logged in [TESTING.md](TESTING.md).

## Repo guide

| File | Purpose |
|---|---|
| [PROMPT_DESIGN.md](PROMPT_DESIGN.md) | The in-app agent: system prompt, JSON contract, edge-case behavior |
| [TESTING.md](TESTING.md) | How to run both test layers + latest logged results |
| [task.md](task.md) | Build plan, phase checklist, honest current status |
| [render.yaml](render.yaml) | One-service deployment blueprint (Render) |
