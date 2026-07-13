// StadiumPilot edge-case tests (task.md Phase 5 — every case hits the real AI backend).
// Run with the server up: node tests/edge-case-tests.js
// Results are logged in TESTING.md — update it when behavior changes.

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const FOOD_VENDORS = [
  'Burger Palace', 'Taco Fiesta', 'Green Bowl', 'Nut-Free Kitchen', 'Pizza Corner', 'Halal Grill',
];

// A closed North Gate with everything else calm, for the deterministic reroute test
const NORTH_GATE_CLOSED = {
  crowdDensity: { north: 'low', south: 'low', east: 'low', west: 'low' },
  gateStatus: { G1: 'closed', G2: 'open', G3: 'open', G4: 'open', G5: 'open' },
  timestamp: new Date().toISOString(),
};

const TEST_CASES = [
  {
    name: 'Normal Navigation',
    message: "Where's the nearest bathroom to Section 114?",
    profile: { accessibility: 'none', dietary: [], location: 'Section 114' },
    expect: { alert: ['normal'], hasRoute: true },
  },
  {
    name: 'French Multilingual Query',
    message: 'Je suis en fauteuil roulant, comment aller au stand de nourriture ?',
    profile: { accessibility: 'wheelchair', dietary: [], location: 'Section 101' },
    // A route OR one clarifying question are both correct (several vendors qualify)
    expect: { alert: ['normal', 'caution'], routeOrClarify: true, language: ['fr', 'french'] },
  },
  {
    name: 'Emergency - Dizziness',
    message: "I feel really dizzy and can't breathe well",
    profile: { accessibility: 'none', dietary: [], location: 'Section 201' },
    expect: { alert: ['emergency'], hasRoute: true },
  },
  {
    name: 'Gibberish Input',
    message: 'asdkfj gate??',
    profile: { accessibility: 'none', dietary: [], location: 'Section 101' },
    expect: { alert: ['normal'], hasClarifyingQuestion: true },
  },
  {
    name: 'Wheelchair vs Stairs-Only Section',
    message: 'How do I get to Section 214?',
    profile: { accessibility: 'wheelchair', dietary: [], location: 'Section 101' },
    // Correct behavior per PROMPT_DESIGN.md: flag the conflict — never route through
    // stairs. Accept an alternate route or a clarifying question, but not silence.
    expect: { alert: ['normal', 'caution'], routeOrClarify: true, routeExcludes: ['Section 214'] },
  },
  {
    name: 'Dietary - Nut-Free Match',
    message: 'I need nut-free food options nearby',
    profile: { accessibility: 'none', dietary: ['nut-free'], location: 'Section 101' },
    expect: { alert: ['normal'], hasRoute: true },
  },
  {
    name: 'Dietary - No Match (kosher)',
    message: 'Where can I get kosher food?',
    profile: { accessibility: 'none', dietary: ['kosher'], location: 'Section 101' },
    // No vendor is kosher: the honest answer routes to no food vendor and never invents one
    expect: { alert: ['normal'], routeExcludes: FOOD_VENDORS },
  },
  {
    name: 'Open-Ended Food Query',
    message: "I'm hungry, what food is available?",
    profile: { accessibility: 'none', dietary: [], location: 'Section 102' },
    // Listing real vendors, routing to one, or asking a preference are all valid —
    // what matters is the answer stays grounded in vendors that actually exist
    expect: { alert: ['normal'], answerMentionsAny: FOOD_VENDORS },
  },
  {
    name: 'Gate Status Check',
    message: 'Is the East Gate open?',
    profile: { accessibility: 'none', dietary: [], location: 'Section 114' },
    expect: { alert: ['normal'] },
  },
  {
    name: 'Gate Closes Mid-Session (reroute)',
    message: 'I need to exit through the North Gate',
    profile: { accessibility: 'none', dietary: [], location: 'Section 101' },
    liveStateOverride: NORTH_GATE_CLOSED,
    // North Gate is closed: any route offered must avoid it
    expect: { alert: ['normal', 'caution'], routeExcludes: ['North Gate', 'G1'] },
  },
  {
    name: 'Rare Language Fallback (Welsh)',
    message: "Ble mae'r toiled agosaf?",
    profile: { accessibility: 'none', dietary: [], location: 'Section 101' },
    // Graceful handling: a valid contract response, no crash, no emergency
    expect: { alert: ['normal', 'caution'] },
  },
];

function validateContract(data) {
  const issues = [];
  if (typeof data.answer !== 'string' || !data.answer) issues.push('answer missing/empty');
  if (typeof data.reasoning !== 'string' || !data.reasoning) issues.push('reasoning missing/empty');
  if (!Array.isArray(data.route)) issues.push('route is not an array');
  if (!['normal', 'caution', 'emergency'].includes(data.alert_level)) issues.push(`alert_level invalid: ${data.alert_level}`);
  if (typeof data.language_detected !== 'string') issues.push('language_detected missing');
  if (!(data.clarifying_question === null || typeof data.clarifying_question === 'string')) issues.push('clarifying_question not string/null');
  return issues;
}

function checkExpectations(tc, data) {
  const issues = [];
  const e = tc.expect;
  if (e.alert && !e.alert.includes(data.alert_level)) {
    issues.push(`alert_level expected one of [${e.alert}] got=${data.alert_level}`);
  }
  if (e.hasRoute && (!data.route || data.route.length === 0)) {
    issues.push('expected a route but got empty');
  }
  if (e.hasClarifyingQuestion && !data.clarifying_question) {
    issues.push('expected clarifying_question but got null');
  }
  if (e.routeOrClarify && (!data.route || data.route.length === 0) && !data.clarifying_question) {
    issues.push('expected a route OR a clarifying question, got neither');
  }
  if (e.routeExcludes) {
    const routeText = (data.route || []).join(' | ').toLowerCase();
    for (const banned of e.routeExcludes) {
      if (routeText.includes(banned.toLowerCase())) issues.push(`route must not include "${banned}"`);
    }
  }
  if (e.answerMentionsAny) {
    const answer = (data.answer || '').toLowerCase();
    const clarify = (data.clarifying_question || '').toLowerCase();
    const grounded = e.answerMentionsAny.some(v => answer.includes(v.toLowerCase()));
    if (!grounded && !clarify && (!data.route || data.route.length === 0)) {
      issues.push('answer names no real vendor, offers no route, asks no clarifying question');
    }
  }
  if (e.language) {
    const lang = (data.language_detected || '').toLowerCase();
    if (!e.language.some(l => lang.includes(l))) {
      issues.push(`language_detected expected ~[${e.language}] got=${data.language_detected}`);
    }
  }
  return issues;
}

async function runTests() {
  console.log('=== StadiumPilot Edge Case Tests ===\n');
  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    // Space requests out: the Gemini free tier enforces a per-minute request cap
    if (passed + failed > 0) await new Promise(r => setTimeout(r, 6000));
    process.stdout.write(`[${tc.name}] `);
    try {
      const body = { message: tc.message, profile: tc.profile };
      if (tc.liveStateOverride) body.liveStateOverride = tc.liveStateOverride;

      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      const issues = res.ok
        ? [...validateContract(data), ...checkExpectations(tc, data)]
        : [`HTTP ${res.status}: ${data.error || 'unknown error'}`];

      if (issues.length === 0) {
        console.log('PASS');
        passed++;
      } else {
        console.log(`FAIL: ${issues.join(', ')}`);
        failed++;
      }

      console.log(`  Answer: ${data.answer?.substring(0, 80)}...`);
      console.log(`  Route: ${JSON.stringify(data.route)}`);
      console.log(`  Alert: ${data.alert_level} | Lang: ${data.language_detected} | Clarify: ${data.clarifying_question ? 'yes' : 'no'}`);
      console.log('');
    } catch (err) {
      console.log(`ERROR: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length} ===`);
  process.exitCode = failed > 0 ? 1 : 0;
}

runTests();
