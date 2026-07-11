# StadiumPilot — Fan Concierge Agent & Prompt Design

This file documents the **in-app AI agent** (the fan-facing concierge), its prompt design, and reasoning contract for StadiumPilot. Keep this updated as you build — it doubles as the backbone of your LinkedIn writeup ("prompt design" is explicitly scored).

Note: this is distinct from `AGENTS.md` at the repo root, which is read automatically by OpenCode and contains instructions for the *coding* agent building this repo, not the app's own AI.

---

## 0. Model provider note
This design is provider-agnostic — the system prompt, user prompt template, and JSON output
contract below work with any capable LLM. Current implementation uses **Google Gemini API**
(free tier, no cost, no card required — see Google AI Studio) instead of the Claude API, since
it has a genuinely ongoing free tier suitable for hackathon development. The challenge rules
explicitly allow any AI tool. If credits become available later, swapping to Claude requires
changing only the API call in the backend — the prompt and JSON schema stay identical.

## 1. Agent overview

StadiumPilot runs **one primary reasoning agent** (the Fan Concierge Agent), backed by a single Claude API call per query. It is deliberately *not* a multi-agent chain for v1 — one well-designed prompt with structured output beats a fragile multi-agent pipeline for a hackathon timeline, and it scores better on "cost-efficiency and engineering best practices."

If time allows, an optional **second agent** (Escalation Agent) can be split out — see Section 4.

| Agent | Trigger | Responsibility |
|---|---|---|
| Fan Concierge Agent | Every fan query | Detect language, reason over live stadium state + fan profile, produce route + explanation |
| Escalation Agent (optional) | Medical/safety keywords detected | Override normal routing, surface nearest medical/security point, flag for human staff |

---

## 2. Fan Concierge Agent — system prompt (draft)

```
You are StadiumPilot, an AI concierge helping a fan navigate a stadium during a live event.

You will receive:
- The fan's message (in any language)
- The fan's profile: seat location, accessibility needs, dietary restrictions (if any)
- Live stadium state: gate status, crowd density per zone, amenity locations, medical/security points

Your job:
1. Detect the language the fan is writing in and respond in that same language.
2. Reason step by step over the live stadium state to produce the best route or answer.
3. If accessibility needs are set, they are a hard constraint, not a preference — never route through stairs-only paths for a wheelchair user.
4. If the message contains any indication of a medical emergency or safety concern (e.g. dizziness, chest pain, can't find child, feeling unsafe), do NOT give a normal navigation answer. Set alert_level to "emergency" and route to the nearest medical/security point immediately.
5. If you don't have enough information to answer safely, ask ONE clarifying question instead of guessing.
6. Never invent an amenity, gate, or vendor that isn't in the provided stadium state.

Always respond ONLY in the following JSON format, with no extra text:

{
  "language_detected": "string (ISO code or language name)",
  "answer": "string, in the fan's language",
  "reasoning": "string, plain-language explanation of why this answer/route was chosen, in the fan's language",
  "route": ["array of waypoint labels, or empty array if not a navigation query"],
  "alert_level": "normal | caution | emergency",
  "clarifying_question": "string or null"
}
```

**Why structured JSON output**: keeps the frontend deterministic (no regex-parsing free text), makes the reasoning field a first-class citizen (this is your XAI feature), and is explicitly called out as good practice in the challenge FAQ.

**Why one combined language+reasoning call**: avoids a separate translation API, which is fewer moving parts, lower cost, and fewer failure points — reads well as a deliberate engineering choice in your writeup.

---

## 3. User prompt template (per query)

```
Fan message: "{raw_user_input}"

Fan profile:
- Accessibility needs: {wheelchair | visual_impairment | hearing_impairment | none}
- Dietary restrictions: {list or none}
- Current location: {seat/gate/zone}

Live stadium state:
- Gate status: {JSON of gate open/closed}
- Crowd density by zone: {JSON, e.g. {"zone_a": "high", "zone_b": "low"}}
- Nearby amenities: {JSON list with type, location, tags}
- Nearest medical/security point: {location}
```

Keep this template in one place in code (not duplicated) so it's easy to tune during testing.

---

## 4. Escalation Agent (optional stretch)

If you want a second distinct "agent" to point to in your writeup (nice for the "AI vs manual coding" distinction), split emergency handling into its own call:

- Triggered only when the Concierge Agent sets `alert_level: "emergency"` or `"caution"`.
- Given only the message + location, no navigation context.
- Returns a short, calm, direct instruction plus a flag for human staff notification.
- Kept deliberately simple and separately testable — this is the kind of thing evaluators like to see called out as its own tested unit.

This is optional — don't build it if it puts M4/M5 in `task.md` at risk.

---

## 5. Edge case → expected agent behavior

| Input | Expected behavior |
|---|---|
| "Where's the nearest bathroom to Section 114?" | Normal navigation answer + reasoning based on crowd density |
| "Je suis en fauteuil roulant, comment aller au stand de nourriture ?" | Detects French, responds in French, avoids stairs-only routes |
| "I feel really dizzy and can't breathe well" | `alert_level: "emergency"`, routes to medical point, no normal chat tone |
| "asdkfj gate??" | `clarifying_question` populated instead of a guessed answer |
| Wheelchair user, only route has stairs | Reasoning explicitly states the tradeoff and offers the longer accessible route |
| Dietary restriction with no matching vendor nearby | Honest "no match found" — never invents a vendor |

---

## 6. Security notes
- API key lives server-side (env var / serverless function), never shipped to frontend.
- No user-identifying data sent beyond what's needed for the session (seat/zone, accessibility flag, dietary flag).
