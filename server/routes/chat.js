const express = require('express');
const { SYSTEM_PROMPT, buildUserPrompt } = require('../prompts/templates');
const { STADIUM_DATA } = require('../data/stadium');
const { getLiveState } = require('../data/liveState');

const router = express.Router();

// gemini-2.5-flash (the original target) is rejected for new API keys ("no longer
// available to new users"), so default to its successor; override via GEMINI_MODEL.
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

router.post('/', async (req, res) => {
  try {
    const { message, profile = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured: GEMINI_API_KEY is missing' });
    }

    const userProfile = {
      accessibility: profile.accessibility || 'none',
      dietary: profile.dietary || [],
      location: profile.location || 'unknown',
    };

    // Test injection only: lets the edge-case suite pin live state (e.g. a closed
    // gate) so tests are deterministic. Never active in production.
    const liveState = (process.env.NODE_ENV !== 'production' && req.body.liveStateOverride)
      ? req.body.liveStateOverride
      : getLiveState();
    const userPrompt = buildUserPrompt({
      message: message.trim(),
      profile: userProfile,
      liveState,
      stadiumData: STADIUM_DATA,
    });

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
    let geminiRes;
    for (let attempt = 0; attempt < 3; attempt++) {
      geminiRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig,
        }),
      });
      if (geminiRes.status !== 429 && geminiRes.status !== 503) break;
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error(`Gemini API error ${geminiRes.status}:`, errBody);
      return res.status(502).json({ error: 'AI service request failed', status: geminiRes.status });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Gemini returned no text:', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'AI service returned an empty response' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON:', text.slice(0, 500));
      return res.status(502).json({ error: 'AI service returned malformed JSON' });
    }

    res.json({
      language_detected: parsed.language_detected || 'unknown',
      answer: parsed.answer,
      reasoning: parsed.reasoning,
      route: Array.isArray(parsed.route) ? parsed.route : [],
      alert_level: parsed.alert_level || 'normal',
      clarifying_question: parsed.clarifying_question ?? null,
      liveState,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message', detail: err.message });
  }
});

module.exports = router;
