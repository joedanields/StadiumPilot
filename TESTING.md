# StadiumPilot — Testing Log

Two layers, per the challenge rubric ("testing incl. edge cases"):

1. **Unit tests** (no API key or quota needed) — pure server logic:
   ```
   node --test tests/unit.test.js
   ```
   Covers: system prompt pins every JSON-contract field; user prompt carries the fan's
   accessibility/dietary/location constraints, all gates, all amenities, stairs-only flags,
   and injected live state; live-state generator emits only valid densities/gate statuses
   and honors its 5s cache; stadium data contains the fixtures the edge cases rely on
   (a stairs-only section, a medical point, an accessible gate, zero kosher vendors).

2. **Edge-case tests** (real Gemini calls, server must be running):
   ```
   cd server && npm run dev     # terminal 1
   node tests/edge-case-tests.js  # terminal 2
   ```
   Every response is first validated against the full JSON contract
   `{answer, reasoning, route, language_detected, alert_level, clarifying_question}`,
   then against per-case behavior. Requests are spaced 6s apart because the Gemini
   free tier enforces a per-minute request cap.

   The gate-closure case uses a `liveStateOverride` request field (honored only when
   `NODE_ENV !== 'production'`) to pin the North Gate closed — deterministic test
   injection of *input data*, never of AI responses.

## Latest results — 2026-07-12, model `gemini-3.1-flash-lite`

Unit tests: **6/6 pass**. Edge cases: **11/11 pass**.

| # | Case (task.md Phase 5) | Observed behavior | Result |
|---|---|---|---|
| 1 | Normal navigation | Routed to nearest restroom with crowd-aware reasoning | PASS |
| 2 | French multilingual (wheelchair) | Detected `fr`, responded in French, asked one clarifying question among accessible vendors | PASS |
| 3 | Medical distress ("dizzy, can't breathe") | `alert_level: emergency`, routed to First Aid Station, calm non-chat tone | PASS |
| 4 | Gibberish ("asdkfj gate??") | Clarifying question, no guessed answer | PASS |
| 5 | Wheelchair → stairs-only Section 214 | Refused stairs route, stated the conflict explicitly, offered a next step | PASS |
| 6 | Dietary match (nut-free) | Routed to Nut-Free Kitchen | PASS |
| 7 | Dietary no-match (kosher — no vendor qualifies) | Honest "not available", routed to no vendor, invented nothing | PASS |
| 8 | Open-ended food query | Listed only real vendors from stadium state | PASS |
| 9 | Gate status question | Answer consistent with live gate state | PASS |
| 10 | Gate closes mid-session | Named the closure, rerouted via West Gate (route excludes North Gate) | PASS |
| 11 | Rare language fallback (Welsh) | Detected Welsh, answered in Welsh with a valid route | PASS |

Notes:
- Case 5 initially failed (model flagged the conflict but offered no alternative); fixed by
  tightening rule 3 of the system prompt (see PROMPT_DESIGN.md §2) — a prompt-design fix,
  not a hard-coded response.
- Free-tier flakiness (429/503 under burst load) is handled by server-side retry with
  backoff plus the 6s inter-test spacing.
