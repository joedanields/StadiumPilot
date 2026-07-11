# StadiumPilot — Task Plan

**Challenge:** Smart Stadiums and Tournament Operations (2026 FIFA World Cup context)
**Persona:** Fan
**Verticals:** Navigation + Multilingual Assistance + Accessibility
**Format:** Fully functional AI-powered web app, GenAI-driven (no static/hard-coded pages), deployed live, with a LinkedIn writeup.

---

## 0. One-line pitch
StadiumPilot is an AI concierge for fans inside a stadium: ask it anything in any language — "where's my seat," "nearest gate that isn't crowded," "I'm in a wheelchair, how do I get to Section 214," "is there nut-free food near me" — and it reasons over live conditions (crowd density, gate status, fan profile) to give a route + a plain-language explanation of *why* it recommended that.

---

## 1. Scope guardrails (don't drift)
- One persona (Fan). Do not build organizer/volunteer dashboards.
- Three verticals max: Navigation, Multilingual, Accessibility. Sustainability/transportation are out of scope for v1.
- Every AI response must return a **reason**, not just an answer (this is the XAI requirement — non-negotiable for scoring).

---

## 2. Milestones

### M1 — Foundation
- [ ] Repo scaffold (frontend + serverless function or backend for API calls)
- [ ] Define stadium data model: gates, sections, seats, live crowd-density per zone, amenities (food, medical, restrooms), accessibility features (ramps, elevators)
- [ ] Generate synthetic "live" data feed (crowd density per zone, gate status) — refreshes every few seconds to simulate real-time
- [ ] Confirm structured JSON contract between app and Claude API (see `agents.md`)

### M2 — Core AI reasoning engine
- [ ] System prompt + user prompt template built (see `agents.md`)
- [ ] Claude API call wired up, returns structured JSON: `{answer, reasoning, route, language_detected, alert_level}`
- [ ] Language auto-detection working (no separate translation service — one model call does both)
- [ ] Accessibility flag support (wheelchair, visual/hearing impairment) changes routing logic and is reflected in `reasoning`

### M3 — Frontend
- [ ] Stadium map view (simple SVG/2D grid is fine — doesn't need to be a real venue)
- [ ] Chat concierge panel (text input, fan can also toggle "I use a wheelchair" / dietary filters)
- [ ] "Why this route" panel showing the AI's reasoning next to the answer (this is your XAI trust feature — make it visually prominent, judges will look for it)
- [ ] Route rendered on the map, updates when re-asked

### M4 — Edge cases (judges explicitly score this — don't skip)
- [ ] Gate closes mid-session → app reroutes and explains why
- [ ] Fan reports a symptom ("I feel dizzy," "chest pain") → app does NOT give a normal navigation answer; escalates to a medical-alert state and shows nearest medical point immediately
- [ ] Fan asks in an unsupported/rare language → graceful fallback, doesn't break
- [ ] Wheelchair user + only route has stairs → app flags conflict and offers alternate, explains tradeoff (extra time vs. accessibility)
- [ ] Ambiguous/gibberish input → app asks a clarifying question instead of hallucinating a route
- [ ] Dietary restriction + no matching vendor nearby → app says so honestly instead of inventing an option

### M5 — Testing
- [ ] Write test cases for each edge case above (manual test log is fine, screenshot/record outputs)
- [ ] Basic functional tests: normal navigation query, multilingual query, accessibility query
- [ ] Note test results in repo (`/tests` or a TESTING.md) — evaluators want to see this, not just working demo

### M6 — Deployment
- [ ] Deploy to Vercel, Netlify, or Google Cloud Run (NOT GitHub Pages — explicitly disallowed)
- [ ] Confirm live link works end-to-end with no hard-coded/static responses
- [ ] (Optional, for GCP scoring bonus) swap synthetic routing for Google Maps API indoor mapping if time allows

### M7 — Submission materials
- [ ] LinkedIn post: what tools used, prompt design decisions, AI vs. manual coding split (be specific — judges cross-check this against the app)
- [ ] Final review against rubric: code quality, security (no exposed keys), efficiency, edge-case testing, accessibility, alignment to problem statement
- [ ] Submit — remember only your **last** submission counts, so don't submit until M4 and M5 are solid

---

## 3. Rubric self-check before submitting
| Dimension | Where it's covered |
|---|---|
| Genuine GenAI use (not superficial) | M2 — reasoning + explanation on every call, not templated |
| Code quality / efficiency | Clean data model, no unnecessary model calls, structured JSON |
| Security | No API keys in frontend, use env vars / backend proxy |
| Testing incl. edge cases | M4 + M5 |
| Accessibility | Wheelchair/visual/hearing flags baked into core reasoning, not bolted on |
| Alignment to problem statement | Stays on Fan + Navigation/Multilingual/Accessibility, doesn't dilute |
| Explainability (XAI) | Reasoning panel in UI, always populated |