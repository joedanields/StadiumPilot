const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const TEST_CASES = [
  {
    name: 'Normal Navigation',
    message: "Where's the nearest bathroom to Section 114?",
    profile: { accessibility: 'none', dietary: [], location: 'Section 114' },
    expected: { alert_level: 'normal', hasRoute: true },
  },
  {
    name: 'French Multilingual Query',
    message: "Je suis en fauteuil roulant, comment aller au stand de nourriture ?",
    profile: { accessibility: 'wheelchair', dietary: [], location: 'Section 101' },
    expected: { alert_level: 'normal', hasRoute: true },
  },
  {
    name: 'Emergency - Dizziness',
    message: "I feel really dizzy and can't breathe well",
    profile: { accessibility: 'none', dietary: [], location: 'Section 201' },
    expected: { alert_level: 'emergency', hasRoute: true },
  },
  {
    name: 'Gibberish Input',
    message: "asdkfj gate??",
    profile: { accessibility: 'none', dietary: [], location: 'Section 101' },
    expected: { alert_level: 'normal', hasClarifyingQuestion: true },
  },
  {
    name: 'Wheelchair Accessibility',
    message: "How do I get to Section 214?",
    profile: { accessibility: 'wheelchair', dietary: [], location: 'Section 101' },
    expected: { alert_level: 'normal', hasRoute: true },
  },
  {
    name: 'Dietary - Nut-Free',
    message: "I need nut-free food options nearby",
    profile: { accessibility: 'none', dietary: ['nut-free'], location: 'Section 101' },
    expected: { alert_level: 'normal', hasRoute: true },
  },
  {
    name: 'Food Query',
    message: "I'm hungry, what food is available?",
    profile: { accessibility: 'none', dietary: [], location: 'Section 102' },
    expected: { alert_level: 'normal', hasRoute: true },
  },
  {
    name: 'Gate Status Check',
    message: "Is the East Gate open?",
    profile: { accessibility: 'none', dietary: [], location: 'Section 114' },
    expected: { alert_level: 'normal' },
  },
];

async function runTests() {
  console.log('=== StadiumPilot Edge Case Tests ===\n');
  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    process.stdout.write(`[${tc.name}] `);
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tc.message, profile: tc.profile }),
      });
      const data = await res.json();

      let testPassed = true;
      const issues = [];

      if (tc.expected.alert_level && data.alert_level !== tc.expected.alert_level) {
        testPassed = false;
        issues.push(`alert_level expected=${tc.expected.alert_level} got=${data.alert_level}`);
      }
      if (tc.expected.hasRoute && (!data.route || data.route.length === 0)) {
        testPassed = false;
        issues.push('expected route but got empty');
      }
      if (tc.expected.hasClarifyingQuestion && !data.clarifying_question) {
        testPassed = false;
        issues.push('expected clarifying_question but got null');
      }
      if (!data.answer) {
        testPassed = false;
        issues.push('no answer returned');
      }

      if (testPassed) {
        console.log(`PASS`);
        passed++;
      } else {
        console.log(`FAIL: ${issues.join(', ')}`);
        failed++;
      }

      console.log(`  Answer: ${data.answer?.substring(0, 80)}...`);
      console.log(`  Route: ${JSON.stringify(data.route)}`);
      console.log(`  Alert: ${data.alert_level}`);
      if (data.reasoning) console.log(`  Reasoning: ${data.reasoning.substring(0, 100)}...`);
      console.log('');
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failed++;
      console.log('');
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length} ===`);
}

runTests();
