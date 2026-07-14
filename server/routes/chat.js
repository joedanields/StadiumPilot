const express = require('express');
const { SYSTEM_PROMPT, buildUserPrompt } = require('../prompts/templates');
const { STADIUM_DATA } = require('../data/stadium');
const { getLiveState } = require('../data/liveState');
const { askConcierge, GeminiError } = require('../lib/gemini');

const router = express.Router();

const MAX_MESSAGE_LENGTH = 1000;

/**
 * POST /api/chat — one concierge query.
 * Body: { message: string, profile?: { accessibility, dietary, location } }
 * Responds with the PROMPT_DESIGN.md contract plus the live state used for the answer.
 */
router.post('/', async (req, res) => {
  try {
    const { message, profile = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
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

    const reply = await askConcierge(SYSTEM_PROMPT, userPrompt);
    res.json({ ...reply, liveState });
  } catch (err) {
    if (err instanceof GeminiError) {
      // 503 = key missing locally; anything upstream surfaces as a 502 to the client
      const status = err.status === 503 && !process.env.GEMINI_API_KEY ? 503 : 502;
      return res.status(status).json({ error: err.message, status: err.status });
    }
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message', detail: err.message });
  }
});

module.exports = router;
