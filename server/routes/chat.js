const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const { SYSTEM_PROMPT, buildUserPrompt } = require('../prompts/templates');
const { STADIUM_DATA } = require('../data/stadium');
const { getLiveState } = require('../data/liveState');

const router = express.Router();

const getClient = () => {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

router.post('/', async (req, res) => {
  try {
    const { message, profile = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userProfile = {
      accessibility: profile.accessibility || 'none',
      dietary: profile.dietary || [],
      location: profile.location || 'unknown',
    };

    const liveState = getLiveState();
    const userPrompt = buildUserPrompt({
      message: message.trim(),
      profile: userProfile,
      liveState,
      stadiumData: STADIUM_DATA,
    });

    if (!process.env.ANTHROPIC_API_KEY) {
      const mockResponse = generateMockResponse(message.trim(), userProfile, liveState);
      return res.json({ ...mockResponse, liveState });
    }

    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text;
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { answer: text, reasoning: 'N/A' };
    } catch {
      parsed = { answer: text, reasoning: 'Response generated', alert_level: 'normal', route: [], clarifying_question: null, language_detected: 'unknown' };
    }

    res.json({ ...parsed, liveState });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message', detail: err.message });
  }
});

function generateMockResponse(message, profile, liveState) {
  const lower = message.toLowerCase();

  const emergencyKeywords = ['dizzy', 'chest pain', 'help', 'emergency', 'fallen', 'unconscious', 'breathing', 'heart attack', 'seizure'];
  if (emergencyKeywords.some(kw => lower.includes(kw))) {
    return {
      language_detected: 'en',
      answer: 'This is an emergency situation. Please proceed immediately to First Aid Station North (nearest medical point). Security has been notified. Stay calm and follow the route shown on the map.',
      reasoning: 'The fan reported a medical concern. Per safety protocol, normal navigation is overridden and the nearest medical facility is the priority. First Aid Station North at coordinates (45,10) is closest to the current zone.',
      route: ['Current Location', 'First Aid Station North'],
      alert_level: 'emergency',
      clarifying_question: null,
    };
  }

  if (lower.includes('wheelchair') || profile.accessibility === 'wheelchair') {
    const accessibleAmenities = STADIUM_DATA.amenities.filter(a => a.accessible);
    return {
      language_detected: 'en',
      answer: 'I found several accessible routes for you. The nearest accessible restroom is Restroom Block A at (20,25). All pathways to this point use ramps — no stairs required.',
      reasoning: 'Wheelchair accessibility is a hard constraint. I filtered out all stairs-only paths (Sections 114 and 214 corridors) and selected routes with confirmed ramp access. Restroom Block A is the closest accessible facility.',
      route: ['Current Location', 'West Corridor (accessible)', 'Restroom Block A'],
      alert_level: 'normal',
      clarifying_question: null,
    };
  }

  if (lower.includes('bathroom') || lower.includes('restroom') || lower.includes('toilet')) {
    return {
      language_detected: 'en',
      answer: 'The nearest restroom is Restroom Block A at coordinates (20,25). It is wheelchair accessible and currently has low crowd density. Head towards the West corridor.',
      reasoning: 'Restroom Block A is closest to the average fan position and has accessible facilities. The West zone currently has medium crowd density, so the path should be relatively clear.',
      route: ['Current Location', 'West Corridor', 'Restroom Block A'],
      alert_level: 'normal',
      clarifying_question: null,
    };
  }

  if (lower.includes('food') || lower.includes('eat') || lower.includes('hungry') || lower.includes('snack')) {
    const dietary = profile.dietary || [];
    let venueName = 'Burger Palace';
    let tags = ['burgers', 'american'];

    if (dietary.includes('vegan') || dietary.includes('vegetarian')) {
      venueName = 'Green Bowl';
      tags = ['vegan', 'vegetarian', 'healthy'];
    } else if (dietary.includes('nut-free') || dietary.includes('nut allergy')) {
      venueName = 'Nut-Free Kitchen';
      tags = ['nut-free', 'allergy-friendly'];
    } else if (dietary.includes('halal')) {
      venueName = 'Halal Grill';
      tags = ['halal', 'middle-eastern'];
    } else if (dietary.includes('gluten-free')) {
      venueName = 'Green Bowl';
      tags = ['gluten-free', 'healthy'];
    }

    const zoneDensities = liveState.crowdDensity;
    return {
      language_detected: 'en',
      answer: `I recommend ${venueName} — it matches your dietary needs (${tags.join(', ')}). It's located in the central area. Current crowd density is ${zoneDensities['north'] || 'medium'}.`,
      reasoning: `Selected ${venueName} based on dietary profile match. Considered crowd density across zones to suggest the least crowded route. The venue is wheelchair accessible.`,
      route: ['Current Location', venueName],
      alert_level: 'normal',
      clarifying_question: null,
    };
  }

  if (lower.includes('section') || lower.includes('seat') || lower.includes('gate')) {
    const gateStatuses = liveState.gateStatus;
    const openGates = Object.entries(gateStatuses).filter(([_, s]) => s === 'open');
    const recommendedGate = openGates.length > 0 ? openGates[0][0] : 'G1';
    const gateInfo = STADIUM_DATA.gates.find(g => g.id === recommendedGate);

    return {
      language_detected: 'en',
      answer: `To reach your section, I recommend using ${gateInfo?.name || 'North Gate'}. It is currently open with good flow. Head through the main concourse to your section.`,
      reasoning: `Analyzed gate statuses: ${Object.entries(gateStatuses).map(([k, v]) => `${k}:${v}`).join(', ')}. ${gateInfo?.name} is open and has the best flow for reaching your section.`,
      route: [gateInfo?.name || 'North Gate', 'Main Concourse', 'Your Section'],
      alert_level: 'normal',
      clarifying_question: null,
    };
  }

  return {
    language_detected: 'en',
    answer: 'I can help you navigate the stadium! You can ask me about finding your seat, nearest restrooms, food options, or any accessibility needs. What would you like to know?',
    reasoning: 'The query was too vague to provide a specific navigation answer. Offering general guidance to help the fan clarify their needs.',
    route: [],
    alert_level: 'normal',
    clarifying_question: 'Could you tell me what specifically you need help with? For example: finding your seat, nearest restroom, food options, or getting to a medical point?',
  };
}

module.exports = router;
