const { STADIUM_DATA } = require('./stadium');

const DENSITY_LEVELS = ['low', 'medium', 'high', 'very_high'];

function generateLiveCrowdDensity() {
  const density = {};
  for (const zone of STADIUM_DATA.zones) {
    const variance = Math.random();
    let currentDensity;
    if (variance < 0.15) currentDensity = 'low';
    else if (variance < 0.50) currentDensity = 'medium';
    else if (variance < 0.85) currentDensity = 'high';
    else currentDensity = 'very_high';
    density[zone.id] = currentDensity;
  }
  return density;
}

function generateGateStatus() {
  const status = {};
  for (const gate of STADIUM_DATA.gates) {
    if (gate.status === 'closed') {
      status[gate.id] = Math.random() < 0.3 ? 'open' : 'closed';
    } else {
      const roll = Math.random();
      if (roll < 0.05) status[gate.id] = 'closed';
      else if (roll < 0.25) status[gate.id] = 'crowded';
      else status[gate.id] = 'open';
    }
  }
  return status;
}

let cachedState = null;
let lastRefresh = 0;

function getLiveState() {
  const now = Date.now();
  if (!cachedState || now - lastRefresh > 5000) {
    cachedState = {
      crowdDensity: generateLiveCrowdDensity(),
      gateStatus: generateGateStatus(),
      timestamp: new Date().toISOString(),
    };
    lastRefresh = now;
  }
  return cachedState;
}

function forceRefresh() {
  cachedState = null;
  return getLiveState();
}

module.exports = { getLiveState, forceRefresh };
