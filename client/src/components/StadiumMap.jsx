import { useMemo } from 'react';

const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;
const SCALE = 5;

const DENSITY_COLORS = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  very_high: '#ef4444',
};

const AMENITY_ICONS = {
  food: { emoji: '🍔', color: '#f97316' },
  restroom: { emoji: '🚻', color: '#3b82f6' },
  medical: { emoji: '🏥', color: '#ef4444' },
  security: { emoji: '🛡️', color: '#6366f1' },
  beverage: { emoji: '🍺', color: '#8b5cf6' },
  merchandise: { emoji: '👕', color: '#ec4899' },
};

export default function StadiumMap({ stadiumData, liveState, currentRoute }) {
  const routePoints = useMemo(() => {
    if (!stadiumData || !currentRoute.length) return [];
    return resolveRoutePoints(currentRoute, stadiumData);
  }, [currentRoute, stadiumData]);

  if (!stadiumData) return <div className="map-loading">Loading stadium map...</div>;

  const routePath = routePoints.length > 1
    ? routePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * SCALE} ${p.y * SCALE}`).join(' ')
    : '';

  return (
    <div className="stadium-map-container">
      <h2>Stadium Map</h2>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="stadium-map"
      >
        <defs>
          <radialGradient id="fieldGrad">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
        </defs>

        {stadiumData.zones.map(zone => {
          const zoneSections = stadiumData.sections.filter(s => s.zone === zone.id);
          if (zoneSections.length === 0) return null;
          const avgX = zoneSections.reduce((s, sec) => s + sec.location.x, 0) / zoneSections.length;
          const avgY = zoneSections.reduce((s, sec) => s + sec.location.y, 0) / zoneSections.length;

          return (
            <circle
              key={zone.id}
              cx={avgX * SCALE}
              cy={avgY * SCALE}
              r={60}
              fill={DENSITY_COLORS[liveState?.crowdDensity?.[zone.id] || zone.crowdDensity] + '33'}
              stroke={DENSITY_COLORS[liveState?.crowdDensity?.[zone.id] || zone.crowdDensity]}
              strokeWidth={2}
              opacity={0.4}
            />
          );
        })}

        <ellipse
          cx={MAP_WIDTH / 2}
          cy={MAP_HEIGHT / 2}
          rx={120}
          ry={80}
          fill="url(#fieldGrad)"
          stroke="#166534"
          strokeWidth={3}
        />
        <text x={MAP_WIDTH / 2} y={MAP_HEIGHT / 2 + 5} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">
          FIELD
        </text>

        {stadiumData.gates.map(gate => {
          const isClosed = liveState?.gateStatus?.[gate.id] === 'closed';
          return (
            <g key={gate.id}>
              <rect
                x={gate.location.x * SCALE - 12}
                y={gate.location.y * SCALE - 12}
                width={24}
                height={24}
                rx={4}
                fill={isClosed ? '#dc2626' : gate.accessible ? '#22c55e' : '#facc15'}
                stroke="#1e293b"
                strokeWidth={2}
              />
              <text
                x={gate.location.x * SCALE}
                y={gate.location.y * SCALE + 4}
                textAnchor="middle"
                fill="white"
                fontSize={8}
                fontWeight="bold"
              >
                {gate.id}
              </text>
              <text
                x={gate.location.x * SCALE}
                y={gate.location.y * SCALE - 16}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={8}
              >
                {gate.name}
              </text>
            </g>
          );
        })}

        {stadiumData.sections.map(section => (
          <g key={section.id}>
            <rect
              x={section.location.x * SCALE - 10}
              y={section.location.y * SCALE - 8}
              width={20}
              height={16}
              rx={3}
              fill={section.hasStairsOnly ? '#f59e0b' : '#3b82f6'}
              stroke="#1e293b"
              strokeWidth={1.5}
            />
            <text
              x={section.location.x * SCALE}
              y={section.location.y * SCALE + 3}
              textAnchor="middle"
              fill="white"
              fontSize={6}
              fontWeight="bold"
            >
              {section.id.replace('S', '')}
            </text>
            {section.hasStairsOnly && (
              <text
                x={section.location.x * SCALE}
                y={section.location.y * SCALE - 12}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize={7}
              >
                STAIRS
              </text>
            )}
          </g>
        ))}

        {stadiumData.amenities.map(amenity => {
          const icon = AMENITY_ICONS[amenity.type] || { emoji: '📍', color: '#94a3b8' };
          return (
            <g key={amenity.id}>
              <circle
                cx={amenity.location.x * SCALE}
                cy={amenity.location.y * SCALE}
                r={8}
                fill={icon.color}
                stroke="#1e293b"
                strokeWidth={1.5}
                opacity={0.9}
              />
              <text
                x={amenity.location.x * SCALE}
                y={amenity.location.y * SCALE + 3}
                textAnchor="middle"
                fontSize={10}
              >
                {icon.emoji}
              </text>
              <text
                x={amenity.location.x * SCALE}
                y={amenity.location.y * SCALE + 18}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize={6}
              >
                {amenity.name}
              </text>
            </g>
          );
        })}

        {routePath && (
          <>
            <path
              d={routePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth={4}
              strokeDasharray="8,4"
              strokeLinecap="round"
              opacity={0.8}
            />
            <path
              d={routePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="8,4"
              strokeLinecap="round"
            />
            {routePoints.map((point, i) => (
              <g key={i}>
                <circle cx={point.x * SCALE} cy={point.y * SCALE} r={6} fill="#06b6d4" stroke="#0e7490" strokeWidth={2} />
                <text
                  x={point.x * SCALE}
                  y={point.y * SCALE - 10}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize={7}
                  fontWeight="bold"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>

      <div className="map-legend">
        <span className="legend-item"><span className="dot" style={{background: '#4ade80'}}></span> Low Crowd</span>
        <span className="legend-item"><span className="dot" style={{background: '#facc15'}}></span> Medium</span>
        <span className="legend-item"><span className="dot" style={{background: '#f97316'}}></span> High</span>
        <span className="legend-item"><span className="dot" style={{background: '#ef4444'}}></span> Very High</span>
        <span className="legend-item"><span className="dot" style={{background: '#22c55e'}}></span> Open Gate</span>
        <span className="legend-item"><span className="dot" style={{background: '#dc2626'}}></span> Closed Gate</span>
        <span className="legend-item"><span className="dot" style={{background: '#3b82f6'}}></span> Section</span>
        <span className="legend-item"><span className="dot" style={{background: '#f59e0b'}}></span> Stairs Only</span>
      </div>
    </div>
  );
}

function resolveRoutePoints(route, stadiumData) {
  const lookup = {};

  stadiumData.gates.forEach(g => {
    lookup[g.name.toLowerCase()] = { x: g.location.x, y: g.location.y, label: g.name };
    lookup[g.id.toLowerCase()] = { x: g.location.x, y: g.location.y, label: g.name };
  });
  stadiumData.sections.forEach(s => {
    lookup[s.name.toLowerCase()] = { x: s.location.x, y: s.location.y, label: s.name };
    lookup[s.id.toLowerCase()] = { x: s.location.x, y: s.location.y, label: s.name };
  });
  stadiumData.amenities.forEach(a => {
    lookup[a.name.toLowerCase()] = { x: a.location.x, y: a.location.y, label: a.name };
    lookup[a.id.toLowerCase()] = { x: a.location.x, y: a.location.y, label: a.name };
  });

  lookup['current location'] = { x: 50, y: 50, label: 'You' };
  lookup['main concourse'] = { x: 50, y: 50, label: 'Concourse' };
  lookup['your section'] = { x: 50, y: 30, label: 'Section' };
  lookup['west corridor'] = { x: 30, y: 40, label: 'West Corr.' };
  lookup['west corridor (accessible)'] = { x: 30, y: 40, label: 'Accessible' };

  return route.map(point => {
    const key = point.toLowerCase();
    return lookup[key] || { x: 50, y: 50, label: point.substring(0, 12) };
  });
}
