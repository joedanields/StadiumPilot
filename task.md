# StadiumPilot — Task Plan (v2, tightened)

**Challenge:** Smart Stadiums and Tournament Operations (2026 FIFA World Cup context)
**Persona:** Fan
**Verticals:** Navigation + Multilingual Assistance + Accessibility
**Rule:** Don't start the next phase until the current one is checked off. No skipping ahead, no scope creep.

---

## Current status
> Last audited: 2026-07-11. Model provider is **Google Gemini** (see PROMPT_DESIGN.md §0), not Claude — same prompt + JSON contract.
- [x] Phase 1 done? — Yes. Scaffold (React+Vite client, Express server), stadium data model, live-data generator (5s refresh), CLAUDE.md all present and working.
- [x] Phase 2 done? — Yes. `server/routes/chat.js` calls Gemini with the PROMPT_DESIGN.md §2 system prompt + enforced JSON response schema. Model is set via `GEMINI_MODEL` env var: currently `gemini-3.1-flash-lite`, because `gemini-2.5-flash` is rejected outright for new API keys and `gemini-3.5-flash` (the code default) is capped at 20 requests/day on the free tier — too low for testing/judging. Verified via curl: valid structured JSON returned. Key is server-side env var only; `.env` git-ignored; DeepSeek client and the old mock-response generator fully removed.
- [x] Phase 3 done? — Yes. Frontend calls the real `/api/chat` (no mock AI responses anywhere; hard-coded fallback stadium data also removed from App.jsx). Route renders on map, reasoning panel populated from real responses.
- [ ] Phase 4 done? — Mostly. Screenshot-audited at Section 101: viewBox padding fixed gate/label edge clipping, You marker always visible and correctly placed (was landing on the destination), duplicate route labels removed, dietary chips in place. Remaining: audit label overlap at other fan positions (e.g. Section 214, south sections) before checking this off.
- [x] Phase 5 done? — Yes. 11 edge cases (all six required by this phase plus contract validation on every response) pass 11/11 against the real Gemini backend; 6 API-free unit tests cover prompt construction and the live-state generator. Results logged in `TESTING.md`. The stairs-conflict case drove a prompt improvement (rule 3 tightened to always offer a next step).
- [ ] Phase 6 done? — No. Not deployed.
- [~] Phase 7 done? — README.md for judges written (live link, screenshot, stack, prompt design, testing). Remaining: LinkedIn post publication + final submission.

---

## Phase 1 — Foundation
- [x] Repo scaffolded: frontend + backend/serverless proxy
- [x] Stadium data model: gates, sections, seats, crowd density per zone, amenities, accessibility features
- [x] Synthetic live-data generator (crowd density + gate status update every few seconds)
- [x] `CLAUDE.md` (or `AGENTS.md`) present in repo root with project conventions
✅ **Exit condition:** app runs locally, shows a stadium map with fake live data. No AI yet.

## Phase 2 — Core AI reasoning engine
- [x] Backend endpoint calls the model API (Google Gemini — see PROMPT_DESIGN.md §0) with the system prompt + JSON schema from `PROMPT_DESIGN.md`
- [x] Returns `{answer, reasoning, route, language_detected, alert_level, clarifying_question}`
- [x] API key server-side only, confirmed never exposed to client
✅ **Exit condition:** you can send one test query via curl/Postman and get a valid structured JSON response back.

## Phase 3 — Frontend integration
- [x] Chat concierge UI wired to the real backend (no mock responses)
- [x] Route renders on the map
- [x] "Why This Route" reasoning panel populated from the real API response
✅ **Exit condition:** typing a question in the UI produces a real AI-generated answer + route + reasoning, end to end.

## Phase 4 — UI polish
- [ ] Map labels/icons don't overlap at any fan position
- [ ] Dietary selector uses chips, not a native multi-select
- [ ] Clear visual hierarchy: current location + active route dominate; other map elements are quiet
- [ ] Consistent spacing in header controls, clear type scale
✅ **Exit condition:** screenshot the full app — nothing overlaps, hierarchy is obvious at a glance.

## Phase 5 — Edge cases (scored explicitly — do not skip)
- [x] Gate closes mid-session → reroute + explanation
- [x] Medical/distress keywords → escalation, not normal chat
- [x] Wheelchair + stairs-only route → conflict flagged, alternate offered
- [x] Gibberish/ambiguous input → clarifying question, not a guess
- [x] Dietary restriction with no match → honest "not available," never invented
- [x] Unsupported/rare language → graceful fallback
✅ **Exit condition:** each case tested once, result logged (screenshot or short note) in `/tests` or `TESTING.md`.

## Phase 6 — Deploy
- [ ] Deployed to Vercel / Netlify / Google Cloud Run (not GitHub Pages)
- [ ] Live link tested end-to-end, no hard-coded/static responses anywhere
✅ **Exit condition:** live URL works exactly like local version.

## Phase 7 — Submission
- [x] `README.md` written for judges (what it does, persona/vertical, stack, how to run, live link, screenshot)
- [ ] LinkedIn post: tools used, prompt design decisions, AI vs. manual coding split
- [ ] Final rubric self-check (below)
- [ ] Submit — only your last submission counts, so don't submit until Phase 5 is solid

---

## Rubric self-check before submitting
| Dimension | Covered by |
|---|---|
| Genuine GenAI use | Phase 2/3 — every answer is a real model call, not templated |
| Code quality/efficiency | Phase 1/2 — clean data model, one model call per query |
| Security | Phase 2 — API key server-side only |
| Testing incl. edge cases | Phase 5 |
| Accessibility | Phase 2/4 — baked into reasoning + UI, not bolted on |
| Alignment to problem statement | Stays Fan + Navigation/Multilingual/Accessibility throughout |
| Explainability (XAI) | Phase 3 — reasoning panel always populated |