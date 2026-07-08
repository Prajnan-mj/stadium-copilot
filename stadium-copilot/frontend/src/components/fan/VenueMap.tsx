import { RouteResult } from '../../lib/store'

interface Props {
  route: RouteResult | null
  accessible: boolean
  venue?: 'nyj' | 'mia'
}

export default function VenueMap({ route, accessible }: Props) {
  const routeColor = accessible ? '#00934A' : '#2563EB'
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#EEF3EA', boxShadow: 'var(--e1)' }}>
      <svg
        viewBox="0 0 780 480"
        className="w-full"
        role="img"
        aria-label="Stadium schematic map with your route highlighted"
        style={{ display: 'block' }}
      >
        {/* Field */}
        <ellipse cx="390" cy="250" rx="145" ry="100" fill="#BBE9C6" stroke="#16a34a" strokeWidth="2" />
        <ellipse cx="390" cy="250" rx="100" ry="65" fill="none" stroke="#16a34a" strokeWidth="1" strokeDasharray="6 3" opacity="0.6" />
        <line x1="390" y1="150" x2="390" y2="350" stroke="#16a34a" strokeWidth="1" opacity="0.5" />
        <text x="390" y="255" textAnchor="middle" fontSize="11" fontWeight="700" fill="#15803d" fontFamily="Inter,sans-serif" letterSpacing="2">PITCH</text>

        {/* Concourse ring */}
        <rect x="100" y="70" width="580" height="360" rx="60" fill="none" stroke="#C5CFC0" strokeWidth="2" strokeDasharray="4 4" />

        {/* Concourses */}
        {[
          { x: 160, y: 72, w: 460, h: 78, label: 'North Concourse', tx: 390, ty: 116, rot: 0 },
          { x: 160, y: 340, w: 460, h: 78, label: 'South Concourse', tx: 390, ty: 384, rot: 0 },
          { x: 562, y: 150, w: 78, h: 190, label: 'East', tx: 601, ty: 250, rot: 90 },
          { x: 140, y: 150, w: 78, h: 190, label: 'West', tx: 179, ty: 250, rot: -90 },
        ].map(c => (
          <g key={c.label}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="10" fill="#E4EEDF" stroke="#CBD6C4" strokeWidth="1" />
            <text x={c.tx} y={c.ty} textAnchor="middle" fontSize="10" fontWeight="600" fill="#5B6470" fontFamily="Inter,sans-serif"
              transform={c.rot ? `rotate(${c.rot},${c.tx},${c.ty})` : undefined}>{c.label}</text>
          </g>
        ))}

        {/* Gates */}
        {[
          { id: 'A', x: 130, y: 90 }, { id: 'B', x: 250, y: 60 }, { id: 'C', x: 390, y: 50 },
          { id: 'D', x: 530, y: 60 }, { id: 'E', x: 650, y: 90 }, { id: 'F', x: 650, y: 370 },
        ].map(g => (
          <g key={g.id}>
            <rect x={g.x - 23} y={g.y - 14} width="46" height="28" rx="7" fill="#00934A" />
            <text x={g.x} y={g.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="Inter,sans-serif">Gate {g.id}</text>
          </g>
        ))}

        {/* POI markers (SVG glyphs, not emoji) */}
        <Poi x={575} y={140} type="access" />
        <Poi x={205} y={370} type="access" />
        <Poi x={340} y={120} type="medical" />
        <Poi x={440} y={392} type="medical" />

        {/* Route overlay */}
        {route && route.steps.length > 1 && (
          <g>
            <polyline
              points={route.steps.map(s => `${s.x},${s.y}`).join(' ')}
              fill="none" stroke={routeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="9 5" style={{ animation: 'dashmove 1s linear infinite' }} opacity="0.9" />
            {route.steps.map((s, i) => {
              const isStart = i === 0
              const isEnd = i === route.steps.length - 1
              return (
                <g key={s.node_id}>
                  <circle cx={s.x} cy={s.y} r={isStart || isEnd ? 9 : 5.5}
                    fill={isStart ? '#00934A' : isEnd ? '#C42B23' : routeColor}
                    stroke="white" strokeWidth="2.5" />
                  {(isStart || isEnd) && (
                    <text x={s.x} y={s.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="Inter,sans-serif"
                      style={{ pointerEvents: 'none' }}>{isStart ? 'A' : 'B'}</text>
                  )}
                </g>
              )
            })}
          </g>
        )}
      </svg>

      {route && (
        <div className="px-3.5 py-2.5 flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <span className="tnum"><strong style={{ color: 'var(--ink)' }}>{Math.round(route.distance_m)}</strong> m</span>
          <span className="tnum"><strong style={{ color: 'var(--ink)' }}>{route.eta_min}</strong> min walk</span>
          {accessible && (
            <span className="pill px-2 py-0.5 text-[11px] ml-auto" style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
              Step-free
            </span>
          )}
        </div>
      )}

      <div className="absolute top-2 right-2.5 text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--faint)', background: 'rgba(255,255,255,0.7)' }}>
        Schematic — not to scale
      </div>
    </div>
  )
}

function Poi({ x, y, type }: { x: number; y: number; type: 'access' | 'medical' }) {
  const color = type === 'access' ? '#2563EB' : '#C42B23'
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r="9" fill="white" stroke={color} strokeWidth="1.5" />
      {type === 'access' ? (
        <>
          <circle cx="0" cy="-3.2" r="1.6" fill={color} />
          <path d="M-3.2 0.2 h6.4 M0 -1.4 v4 M0 2.6 l-2.6 3 M0 2.6 l2.6 3" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <path d="M-1.6 -4 h3.2 v2.4 h2.4 v3.2 h-2.4 v2.4 h-3.2 v-2.4 h-2.4 v-3.2 h2.4 z" fill={color} />
      )}
    </g>
  )
}
