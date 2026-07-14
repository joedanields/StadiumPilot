// API-free endpoint tests — exercise the real Express app on an ephemeral port.
// Input validation and stadium endpoints never reach Gemini, so no key or quota is
// needed. The one Gemini-adjacent test asserts the 503 guard when the key is absent.
// Run: node --test tests/api.test.js
const { test, before, after } = require('node:test');
const assert = require('node:assert');

delete process.env.GEMINI_API_KEY; // must be gone before the app is required
const { createApp } = require('../server/app');

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const postChat = (body) => fetch(`${baseUrl}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

test('GET /api/health responds ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

test('GET /api/stadium returns stadium data and live state', async () => {
  const res = await fetch(`${baseUrl}/api/stadium`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.stadium.gates) && data.stadium.gates.length > 0);
  assert.ok(Array.isArray(data.stadium.amenities) && data.stadium.amenities.length > 0);
  assert.ok(data.liveState.crowdDensity && data.liveState.gateStatus);
});

test('GET /api/stadium/live returns valid live state', async () => {
  const res = await fetch(`${baseUrl}/api/stadium/live`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.crowdDensity && data.gateStatus && data.timestamp);
});

test('POST /api/chat rejects a missing message with 400', async () => {
  const res = await postChat({ profile: {} });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /required/i);
});

test('POST /api/chat rejects a whitespace-only message with 400', async () => {
  const res = await postChat({ message: '   ' });
  assert.strictEqual(res.status, 400);
});

test('POST /api/chat rejects an over-length message with 400', async () => {
  const res = await postChat({ message: 'a'.repeat(1500) });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /too long/i);
});

test('POST /api/chat returns 503 (never a fake answer) when no API key is configured', async () => {
  const res = await postChat({ message: 'Where is the nearest bathroom?' });
  assert.strictEqual(res.status, 503);
  const data = await res.json();
  assert.ok(data.error, 'should explain the missing configuration');
  assert.strictEqual(data.answer, undefined, 'must not fabricate an AI answer');
});
