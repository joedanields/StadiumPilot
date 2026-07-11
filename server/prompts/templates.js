const SYSTEM_PROMPT = `You are StadiumPilot, an AI concierge helping a fan navigate a stadium during a live event.

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
}`;

function buildUserPrompt({ message, profile, liveState, stadiumData }) {
  const amenities = stadiumData.amenities.map(a => ({
    type: a.type,
    name: a.name,
    location: `${a.location.x},${a.location.y}`,
    tags: a.tags,
    accessible: a.accessible,
  }));

  const medicalPoints = stadiumData.amenities
    .filter(a => a.type === 'medical' || a.type === 'security')
    .map(a => ({ name: a.name, type: a.type, location: `${a.location.x},${a.location.y}` }));

  return `Fan message: "${message}"

Fan profile:
- Accessibility needs: ${profile.accessibility || 'none'}
- Dietary restrictions: ${profile.dietary.length > 0 ? profile.dietary.join(', ') : 'none'}
- Current location: ${profile.location || 'unknown'}

Live stadium state:
- Gate status: ${JSON.stringify(liveState.gateStatus)}
- Crowd density by zone: ${JSON.stringify(liveState.crowdDensity)}
- Nearby amenities: ${JSON.stringify(amenities)}
- Nearest medical/security point: ${JSON.stringify(medicalPoints)}

Available sections: ${stadiumData.sections.map(s => `${s.name} (${s.id}, zone: ${s.zone}${s.hasStairsOnly ? ', STAIRS ONLY' : ''})`).join('; ')}
Available gates: ${stadiumData.gates.map(g => `${g.name} (${g.id}, status: ${liveState.gateStatus[g.id] || g.status}${g.accessible ? ', accessible' : ''})`).join('; ')}`;
}

module.exports = { SYSTEM_PROMPT, buildUserPrompt };
