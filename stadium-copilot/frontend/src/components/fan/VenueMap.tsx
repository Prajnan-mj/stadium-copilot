import { RouteResult } from '../../lib/store'

interface Props {
  route: RouteResult | null
  accessible: boolean
  venue?: 'nyj' | 'mia'
}

const ZONE_COLORS: Record<string, string> = {
  ok: '#22C55E22',
  watch: '#F59E0B33',
  critical: '#EF444433',
}

export default function VenueMap({ route, accessible }: Props) {
  return (
    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: '#F0F4EE' }}>
      <svg
        viewBox="0 0 780 480"
        className="w-full"
        role="img"
        aria-label="Stadium schematic map"
        style={{ display: 'block' }}
      >
        {/* Field */}
        <ellipse cx="390" cy="250" rx="145" ry="100" fill="#4ade8044" stroke="#16a34a" strokeWidth="2" />
        <ellipse cx="390" cy="250" rx="100" ry="65" fill="none" stroke="#16a34a" strokeWidth="1" strokeDasharray="6 3" />
        <text x="390" y="255" textAnchor="middle" fontSize="11" fill="#16a34a" fontFamily="Inter,sans-serif">PITCH</text>

        {/* Concourse ring */}
        <rect x="100" y="70" width="580" height="360" rx="60" fill="none" stroke="#C5CFC0" strokeWidth="2" strokeDasharray="4 4" />

        {/* North concourse */}
        <rect x="160" y="72" width="460" height="78" rx="8" fill="#E8F0E4" stroke="#C5CFC0" strokeWidth="1" />
        <text x="390" y="116" textAnchor="middle" fontSize="10" fill="#5B6470" fontFamily="Inter,sans-serif">North Concourse</text>

        {/* South concourse */}
        <rect x="160" y="340" width="460" height="78" rx="8" fill="#E8F0E4" stroke="#C5CFC0" strokeWidth="1" />
        <text x="390" y="384" textAnchor="middle" fontSize="10" fill="#5B6470" fontFamily="Inter,sans-serif">South Concourse</text>

        {/* East concourse */}
        <rect x="562" y="150" width="78" height="190" rx="8" fill="#E8F0E4" stroke="#C5CFC0" strokeWidth="1" />
        <text x="601" y="250" textAnchor="middle" fontSize="9" fill="#5B6470" fontFamily="Inter,sans-serif" transform="rotate(90,601,250)">East</text>

        {/* West concourse */}
        <rect x="140" y="150" width="78" height="190" rx="8" fill="#E8F0E4" stroke="#C5CFC0" strokeWidth="1" />
        <text x="179" y="250" textAnchor="middle" fontSize="9" fill="#5B6470" fontFamily="Inter,sans-serif" transform="rotate(-90,179,250)">West</text>

        {/* Gates */}
        {[
          { id: 'A', x: 130, y: 90 },
          { id: 'B', x: 250, y: 60 },
          { id: 'C', x: 390, y: 50 },
          { id: 'D', x: 530, y: 60 },
          { id: 'E', x: 650, y: 90 },
          { id: 'F', x: 650, y: 370 },
        ].map(g => (
          <g key={g.id}>
            <rect x={g.x - 22} y={g.y - 14} width="44" height="28" rx="6"
              fill="var(--accent, #0B7A3B)" />
            <text x={g.x} y={g.y + 5} textAnchor="middle" fontSize="11" fontWeight="600"
              fill="white" fontFamily="Inter,sans-serif">Gate {g.id}</text>
          </g>
        ))}

        {/* POI icons */}
        <text x="568" y="144" fontSize="13" textAnchor="middle">♿</text>
        <text x="213" y="364" fontSize="13" textAnchor="middle">♿</text>
        <text x="390" y="122" fontSize="13" textAnchor="middle">⛑</text>
        <text x="390" y="398" fontSize="13" textAnchor="middle">⛑</text>
        <text x="560" y="146" fontSize="11" textAnchor="middle">ℹ</text>
        <text x="220" y="362" fontSize="11" textAnchor="middle">ℹ</text>

        {/* Route overlay */}
        {route && route.steps.length > 1 && (
          <g>
            <polyline
              points={route.steps.map(s => `${s.x},${s.y}`).join(' ')}
              fill="none"
              stroke={accessible ? '#0B7A3B' : '#4F8CFF'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
              style={{ animation: 'dash 1s linear infinite' }}
            />
            {route.steps.map((s, i) => (
              <g key={s.node_id}>
                <circle cx={s.x} cy={s.y} r={i === 0 || i === route.steps.length - 1 ? 8 : 5}
                  fill={i === 0 ? '#0B7A3B' : i === route.steps.length - 1 ? '#EF4444' : '#4F8CFF'}
                  stroke="white" strokeWidth="2" />
                <text x={s.x + 10} y={s.y + 4} fontSize="9" fill="#101418" fontFamily="Inter,sans-serif"
                  style={{ pointerEvents: 'none' }}>{i + 1}</text>
              </g>
            ))}
          </g>
        )}

        <style>{`
          @keyframes dash { to { stroke-dashoffset: -24; } }
          @media (prefers-reduced-motion: reduce) {
            polyline { animation: none !important; }
          }
        `}</style>
      </svg>

      {route && (
        <div className="px-3 py-2 text-xs flex gap-4" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
          <span>{Math.round(route.distance_m)}m</span>
          <span>{route.eta_min} min walk</span>
          {accessible && <span style={{ color: 'var(--accent)' }}>Step-free route</span>}
        </div>
      )}

      <div className="absolute bottom-1 right-2 text-xs" style={{ color: 'var(--muted)', fontSize: '9px' }}>
        Schematic — not to scale
      </div>
    </div>
  )
}
