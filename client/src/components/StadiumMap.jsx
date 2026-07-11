import { useMemo } from 'react';

const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;
const SCALE = 5;
// Gates sit on the map boundary (x/y = 0 or 100), so pad the viewBox to keep
// their icons and labels from being clipped at the edges.
const PAD = 32;

const DENSITY_COLORS = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  very_high: '#ef4444',
};

const AMENITY_STYLES = {
  food:      { color: '#f97316', shape: 'diamond' },
  restroom:  { color: '#38bdf8', shape: 'circle' },
  medical:   { color: '#ef4444', shape: 'cross' },
  security:  { color: '#818cf8', shape: 'shield' },
  beverage:  { color: '#c084fc', shape: 'diamond' },
  merchandise: { color: '#f472b6', shape: 'diamond' },
};

function MapLabel({ x, y, children, offset = 12, className = '' }) {
  const w = children.length * 5.5 + 8;
  // Clamp the label box inside the padded viewBox so edge labels stay readable
  const bx = Math.max(-PAD + 2, Math.min(x - w / 2, MAP_WIDTH + PAD - w - 2));
  const by = Math.max(-PAD + 2, Math.min(y + offset - 9, MAP_HEIGHT + PAD - 14));
  return (
    <g className={`map-label-group ${className}`}>
      <rect
        x={bx}
        y={by}
        width={w}
        height={12}
        rx={3}
        fill="rgba(15,23,42,0.85)"
        stroke="rgba(71,85,105,0.4)"
        strokeWidth={0.5}
      />
      <text
        x={bx + w / 2}
        y={by + 9}
        textAnchor="middle"
        fill="#cbd5e1"
        fontSize={7}
        fontWeight="500"
        style={{ pointerEvents: 'none' }}
      >
        {children}
      </text>
    </g>
  );
}

function AmenityIcon({ amenity, isOnRoute }) {
  const style = AMENITY_STYLES[amenity.type] || { color: '#94a3b8', shape: 'circle' };
  const cx = amenity.location.x * SCALE;
  const cy = amenity.location.y * SCALE;
  const r = isOnRoute ? 8 : 6;
  const opacity = isOnRoute ? 1 : 0.45;

  if (style.shape === 'diamond') {
    const d = r * 0.9;
    return (
      <g opacity={opacity}>
        <polygon
          points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
          fill={style.color}
          stroke="#0f172a"
          strokeWidth={1.5}
        />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={isOnRoute ? 9 : 7} style={{ pointerEvents: 'none' }}>
          {amenity.type === 'food' ? '🍔' : amenity.type === 'beverage' ? '🍺' : '👕'}
        </text>
      </g>
    );
  }

  if (style.shape === 'cross') {
    const s = r * 0.7;
    return (
      <g opacity={opacity}>
        <rect x={cx - s / 3} y={cy - s} width={s * 0.67} height={s * 2} rx={1.5} fill={style.color} stroke="#0f172a" strokeWidth={1.5} />
        <rect x={cx - s} y={cy - s / 3} width={s * 2} height={s * 0.67} rx={1.5} fill={style.color} stroke="#0f172a" strokeWidth={1.5} />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={isOnRoute ? 9 : 7} style={{ pointerEvents: 'none' }}>🏥</text>
      </g>
    );
  }

  if (style.shape === 'shield') {
    const s = r * 1.1;
    return (
      <g opacity={opacity}>
        <path
          d={`M${cx} ${cy - s} L${cx + s * 0.8} ${cy - s * 0.3} L${cx + s * 0.8} ${cy + s * 0.3} Q${cx + s * 0.8} ${cy + s} ${cx} ${cy + s + s * 0.3} Q${cx - s * 0.8} ${cy + s} ${cx - s * 0.8} ${cy + s * 0.3} L${cx - s * 0.8} ${cy - s * 0.3} Z`}
          fill={style.color}
          stroke="#0f172a"
          strokeWidth={1.5}
        />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize={isOnRoute ? 8 : 6} style={{ pointerEvents: 'none' }}>🛡️</text>
      </g>
    );
  }

  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={style.color} stroke="#0f172a" strokeWidth={1.5} />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={isOnRoute ? 9 : 7} style={{ pointerEvents: 'none' }}>🚻</text>
    </g>
  );
}

export default function StadiumMap({ stadiumData, liveState, currentRoute, currentLocation }) {
  const youPoint = useMemo(() => {
    if (!stadiumData) return null;
    return resolvePoint(currentLocation, stadiumData) || { x: 50, y: 50, label: 'You' };
  }, [currentLocation, stadiumData]);

  const routePoints = useMemo(() => {
    if (!stadiumData || !currentRoute.length) return [];
    const pts = resolveRoutePoints(currentRoute, stadiumData, youPoint);
    // The model sometimes returns only the destination — always draw the path
    // starting from the fan's actual location so "You" never lands on the target.
    if (pts.length && (pts[0].x !== youPoint.x || pts[0].y !== youPoint.y)) {
      return [{ ...youPoint, label: 'You' }, ...pts];
    }
    return pts;
  }, [currentRoute, stadiumData, youPoint]);

  const routeNames = useMemo(() => {
    return new Set(routePoints.map(p => p.label));
  }, [routePoints]);

  const isOnRoute = (name) => routeNames.has(name);

  if (!stadiumData) return <div className="map-loading">Loading stadium map...</div>;

  const routePath = routePoints.length > 1
    ? routePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * SCALE} ${p.y * SCALE}`).join(' ')
    : '';

  return (
    <div className="stadium-map-container">
      <h2 className="section-title">Stadium Map</h2>
      <svg viewBox={`${-PAD} ${-PAD} ${MAP_WIDTH + PAD * 2} ${MAP_HEIGHT + PAD * 2}`} className="stadium-map">
        <defs>
          <radialGradient id="fieldGrad">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Zones */}
        {stadiumData.zones.map(zone => {
          const zoneSections = stadiumData.sections.filter(s => s.zone === zone.id);
          if (zoneSections.length === 0) return null;
          const avgX = zoneSections.reduce((s, sec) => s + sec.location.x, 0) / zoneSections.length;
          const avgY = zoneSections.reduce((s, sec) => s + sec.location.y, 0) / zoneSections.length;
          const density = liveState?.crowdDensity?.[zone.id] || zone.crowdDensity;
          return (
            <circle
              key={zone.id}
              cx={avgX * SCALE}
              cy={avgY * SCALE}
              r={60}
              fill={DENSITY_COLORS[density] + '22'}
              stroke={DENSITY_COLORS[density] + '44'}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Field */}
        <ellipse cx={MAP_WIDTH / 2} cy={MAP_HEIGHT / 2} rx={120} ry={80} fill="url(#fieldGrad)" stroke="#166534" strokeWidth={3} />
        <text x={MAP_WIDTH / 2} y={MAP_HEIGHT / 2 + 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={16} fontWeight="800" letterSpacing="3" style={{ pointerEvents: 'none' }}>
          FIELD
        </text>

        {/* Sections - quiet */}
        {stadiumData.sections.map(section => {
          const onRoute = isOnRoute(section.name);
          const x = section.location.x * SCALE;
          const y = section.location.y * SCALE;
          return (
            <g key={section.id} opacity={onRoute ? 1 : 0.3}>
              <rect
                x={x - 10} y={y - 8}
                width={20} height={16} rx={3}
                fill={section.hasStairsOnly ? '#f59e0b' : '#3b82f6'}
                stroke={onRoute ? '#e2e8f0' : '#1e293b'}
                strokeWidth={onRoute ? 2 : 1}
              />
              <text x={x} y={y + 3} textAnchor="middle" fill="white" fontSize={6} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                {section.id.replace('S', '')}
              </text>
              {section.hasStairsOnly && (
                <text x={x} y={y - 12} textAnchor="middle" fill="#f59e0b" fontSize={6} fontWeight="600" style={{ pointerEvents: 'none' }}>
                  STAIRS
                </text>
              )}
            </g>
          );
        })}

        {/* Gates - quiet unless on route */}
        {stadiumData.gates.map(gate => {
          const isClosed = liveState?.gateStatus?.[gate.id] === 'closed';
          const onRoute = isOnRoute(gate.name);
          const x = gate.location.x * SCALE;
          const y = gate.location.y * SCALE;
          return (
            <g key={gate.id} opacity={onRoute ? 1 : 0.4}>
              <rect
                x={x - 12} y={y - 12}
                width={24} height={24} rx={4}
                fill={isClosed ? '#dc2626' : gate.accessible ? '#22c55e' : '#facc15'}
                stroke={onRoute ? '#e2e8f0' : '#1e293b'}
                strokeWidth={onRoute ? 2.5 : 1.5}
              />
              <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                {gate.id}
              </text>
              <MapLabel x={x} y={y} offset={-20}>{gate.name}</MapLabel>
            </g>
          );
        })}

        {/* Amenities - different shapes, quiet unless on route */}
        {/* Route waypoints already carry their own labels, so none here */}
        {stadiumData.amenities.map(amenity => (
          <g key={amenity.id}>
            <AmenityIcon amenity={amenity} isOnRoute={isOnRoute(amenity.name)} />
          </g>
        ))}

        {/* Route path */}
        {routePath && (
          <g filter="url(#glow)">
            <path d={routePath} fill="none" stroke="#06b6d4" strokeWidth={5} strokeLinecap="round" opacity={0.3} />
            <path d={routePath} fill="none" stroke="#06b6d4" strokeWidth={3} strokeDasharray="10,5" strokeLinecap="round" opacity={0.9} />
            <path d={routePath} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="10,5" strokeLinecap="round" />
          </g>
        )}

        {/* Current location — always visible, dominant when no route is active */}
        {youPoint && routePoints.length === 0 && (
          <g filter="url(#glow)">
            <circle cx={youPoint.x * SCALE} cy={youPoint.y * SCALE} r={10} fill="#22d3ee" stroke="#ffffff" strokeWidth={3} />
            <text x={youPoint.x * SCALE} y={youPoint.y * SCALE + 1} textAnchor="middle" fill="#0f172a" fontSize={9} fontWeight="800" style={{ pointerEvents: 'none' }}>You</text>
          </g>
        )}

        {/* Route waypoints */}
        {routePoints.map((point, i) => {
          const isFirst = i === 0;
          const x = point.x * SCALE;
          const y = point.y * SCALE;
          return (
            <g key={i} filter={isFirst ? 'url(#glow)' : undefined}>
              <circle cx={x} cy={y} r={isFirst ? 10 : 6} fill={isFirst ? '#22d3ee' : '#06b6d4'} stroke={isFirst ? '#ffffff' : '#0e7490'} strokeWidth={isFirst ? 3 : 2} />
              {isFirst && (
                <text x={x} y={y + 1} textAnchor="middle" fill="#0f172a" fontSize={9} fontWeight="800" style={{ pointerEvents: 'none' }}>You</text>
              )}
              {!isFirst && (
                <text x={x} y={y - 1} textAnchor="middle" fill="white" fontSize={5} fontWeight="bold" style={{ pointerEvents: 'none' }}>{i}</text>
              )}
              {!isFirst && (
                <MapLabel x={x} y={y} offset={-16}>{point.label}</MapLabel>
              )}
            </g>
          );
        })}
      </svg>

      <div className="map-legend">
        <div className="legend-group">
          <span className="legend-group-title">Crowd</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#4ade80' }} /> Low</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#facc15' }} /> Medium</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }} /> High</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> Very High</span>
        </div>
        <div className="legend-group">
          <span className="legend-group-title">Gates</span>
          <span className="legend-item"><span className="legend-square" style={{ background: '#22c55e' }} /> Open</span>
          <span className="legend-item"><span className="legend-square" style={{ background: '#dc2626' }} /> Closed</span>
          <span className="legend-item"><span className="legend-square" style={{ background: '#facc15' }} /> No Ramp</span>
        </div>
        <div className="legend-group">
          <span className="legend-group-title">Amenities</span>
          <span className="legend-item"><span className="legend-diamond" style={{ background: '#f97316' }} /> Food</span>
          <span className="legend-item"><span className="legend-circle-sm" style={{ background: '#38bdf8' }} /> Restroom</span>
          <span className="legend-item"><span className="legend-cross" style={{ background: '#ef4444' }} /> Medical</span>
          <span className="legend-item"><span className="legend-shield" style={{ background: '#818cf8' }} /> Security</span>
        </div>
      </div>
    </div>
  );
}

function buildLookup(stadiumData) {
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
  lookup['main concourse'] = { x: 50, y: 50, label: 'Concourse' };
  lookup['west corridor'] = { x: 30, y: 40, label: 'West Corr.' };
  lookup['west corridor (accessible)'] = { x: 30, y: 40, label: 'Accessible' };
  return lookup;
}

function resolvePoint(name, stadiumData) {
  if (!name) return null;
  return buildLookup(stadiumData)[name.toLowerCase()] || null;
}

function resolveRoutePoints(route, stadiumData, youPoint) {
  const lookup = buildLookup(stadiumData);
  lookup['current location'] = { ...youPoint, label: 'You' };
  lookup['your section'] = { ...youPoint, label: 'You' };

  return route.map(point => {
    const key = point.toLowerCase();
    return lookup[key] || { ...youPoint, label: point.substring(0, 12) };
  });
}
