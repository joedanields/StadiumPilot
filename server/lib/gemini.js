/**
 * Gemini API client — the only module that talks to the model provider.
 *
 * Swapping providers (e.g. to Claude) means changing this file only: the system
 * prompt, user prompt, and the JSON contract in RESPONSE_SCHEMA are provider-agnostic
 * (see PROMPT_DESIGN.md §0). The API key stays server-side, read from the environment.
 */

// gemini-2.5-flash (the original target) is rejected for new API keys ("no longer
// available to new users"), so default to a current model; override via GEMINI_MODEL.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Mirrors the JSON contract in PROMPT_DESIGN.md section 2 — if one changes, change both.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    language_detected: { type: 'string' },
    answer: { type: 'string' },
    reasoning: { type: 'string' },
    route: { type: 'array', items: { type: 'string' } },
    alert_level: { type: 'string', enum: ['normal', 'caution', 'emergency'] },
    clarifying_question: { type: 'string', nullable: true },
  },
  required: ['language_detected', 'answer', 'reasoning', 'route', 'alert_level'],
};

/** Error carrying enough context for the route handler to map to an HTTP status. */
class GeminiError extends Error {
  /**
   * @param {string} message
   * @param {number} [status] upstream HTTP status, if the API responded
   */
  constructor(message, status) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

/**
 * Ask the concierge agent one question and return the parsed, schema-shaped reply.
 *
 * @param {string} systemPrompt agent instructions (PROMPT_DESIGN.md §2)
 * @param {string} userPrompt   per-query prompt with fan profile + live stadium state
 * @returns {Promise<{language_detected: string, answer: string, reasoning: string,
 *                    route: string[], alert_level: string, clarifying_question: string|null}>}
 * @throws {GeminiError} when the API fails, returns nothing, or returns malformed JSON
 */
async function askConcierge(systemPrompt, userPrompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new GeminiError('GEMINI_API_KEY is not configured', 503);
  }

  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema: RESPONSE_SCHEMA,
    // Thinking tokens count against maxOutputTokens and can truncate longer
    // (e.g. French) JSON responses — keep the cap high, thinking off.
    maxOutputTokens: 8192,
  };
  // Only thinking-capable models (2.5+/3.x) accept thinkingConfig; 2.0 rejects it.
  if (!GEMINI_MODEL.includes('gemini-2.0')) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  // Free-tier Gemini intermittently returns 429/503 under load — retry briefly.
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig,
      }),
    });
    if (res.status !== 429 && res.status !== 503) break;
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`Gemini API error ${res.status}:`, body);
    throw new GeminiError('AI service request failed', res.status);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Gemini returned no text:', JSON.stringify(data).slice(0, 500));
    throw new GeminiError('AI service returned an empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error('Failed to parse Gemini JSON:', text.slice(0, 500));
    throw new GeminiError('AI service returned malformed JSON');
  }

  // Normalize so the frontend can rely on every contract field being present
  return {
    language_detected: parsed.language_detected || 'unknown',
    answer: parsed.answer,
    reasoning: parsed.reasoning,
    route: Array.isArray(parsed.route) ? parsed.route : [],
    alert_level: parsed.alert_level || 'normal',
    clarifying_question: parsed.clarifying_question ?? null,
  };
}

module.exports = { askConcierge, GeminiError, RESPONSE_SCHEMA };
