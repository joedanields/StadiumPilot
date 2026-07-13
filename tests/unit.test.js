// API-free unit tests for the server's pure logic — no Gemini key or quota needed.
// Run: node --test tests/
const { test } = require('node:test');
const assert = require('node:assert');

const { SYSTEM_PROMPT, buildUserPrompt } = require('../server/prompts/templates');
const { STADIUM_DATA } = require('../server/data/stadium');
const { getLiveState, forceRefresh } = require('../server/data/liveState');

const sampleProfile = { accessibility: 'wheelchair', dietary: ['halal', 'nut-free'], location: 'Section 101' };

test('system prompt pins the JSON contract fields', () => {
  for (const field of ['language_detected', 'answer', 'reasoning', 'route', 'alert_level', 'clarifying_question']) {
    assert.ok(SYSTEM_PROMPT.includes(`"${field}"`), `system prompt missing contract field ${field}`);
  }
  assert.match(SYSTEM_PROMPT, /never route through stairs-only/i);
});

test('user prompt carries profile constraints and live state', () => {
  const liveState = getLiveState();
  const prompt = buildUserPrompt({ message: 'test', profile: sampleProfile, liveState, stadiumData: STADIUM_DATA });

  assert.ok(prompt.includes('wheelchair'), 'accessibility missing');
  assert.ok(prompt.includes('halal, nut-free'), 'dietary list missing');
  assert.ok(prompt.includes('Section 101'), 'location missing');
  assert.ok(prompt.includes('STAIRS ONLY'), 'stairs-only sections not flagged');
  for (const gate of STADIUM_DATA.gates) {
    assert.ok(prompt.includes(gate.id), `gate ${gate.id} missing from prompt`);
  }
  assert.ok(prompt.includes(JSON.stringify(liveState.gateStatus)), 'gate status not injected');
});

test('user prompt only offers amenities that exist in stadium data', () => {
  const prompt = buildUserPrompt({ message: 'test', profile: sampleProfile, liveState: getLiveState(), stadiumData: STADIUM_DATA });
  for (const amenity of STADIUM_DATA.amenities) {
    assert.ok(prompt.includes(amenity.name), `amenity ${amenity.name} missing from prompt`);
  }
});

test('live state generator produces valid densities and gate statuses', () => {
  const state = forceRefresh();
  const zoneIds = STADIUM_DATA.zones.map(z => z.id);
  const gateIds = STADIUM_DATA.gates.map(g => g.id);

  assert.deepStrictEqual(Object.keys(state.crowdDensity).sort(), zoneIds.sort());
  assert.deepStrictEqual(Object.keys(state.gateStatus).sort(), gateIds.sort());
  for (const density of Object.values(state.crowdDensity)) {
    assert.ok(['low', 'medium', 'high', 'very_high'].includes(density), `invalid density ${density}`);
  }
  for (const status of Object.values(state.gateStatus)) {
    assert.ok(['open', 'closed', 'crowded'].includes(status), `invalid gate status ${status}`);
  }
});

test('live state is cached within the 5s window and replaced on refresh', () => {
  const a = getLiveState();
  const b = getLiveState();
  assert.strictEqual(a, b, 'expected cached object within refresh window');
  const c = forceRefresh();
  assert.notStrictEqual(a, c, 'forceRefresh should produce a new state');
});

test('stadium data has the accessibility and safety fixtures the prompt relies on', () => {
  assert.ok(STADIUM_DATA.sections.some(s => s.hasStairsOnly), 'need at least one stairs-only section');
  assert.ok(STADIUM_DATA.amenities.some(a => a.type === 'medical'), 'need a medical point');
  assert.ok(STADIUM_DATA.gates.some(g => g.accessible), 'need an accessible gate');
  // The dietary no-match edge case depends on kosher having zero matching vendors
  assert.ok(!STADIUM_DATA.amenities.some(a => (a.tags || []).includes('kosher')), 'kosher must have no match');
});
