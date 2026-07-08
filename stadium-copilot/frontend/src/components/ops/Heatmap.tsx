import { ZoneState } from '../../lib/store'

interface Props {
  zones: ZoneState[]
}

function occToColor(occ: number, status: string): string {
  if (status === 'critical') return '#EF444466'
  if (status === 'watch') return '#F59E0B55'
  return '#22C55E33'
}

const ZONE_RECTS: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  gate_a:      { x: 108, y: 72,  w: 52, h: 36, label: 'Gate A' },
  gate_b:      { x: 228, y: 42,  w: 52, h: 36, label: 'Gate B' },
  gate_c:      { x: 364, y: 32,  w: 52, h: 36, label: 'Gate C' },
  gate_d:      { x: 500, y: 42,  w: 52, h: 36, label: 'Gate D' },
  gate_e:      { x: 620, y: 72,  w: 52, h: 36, label: 'Gate E' },
  gate_f:      { x: 620, y: 352, w: 52, h: 36, label: 'Gate F' },
  concourse_n: { x: 165, y: 110, w: 450, h: 70, label: 'North' },
  concourse_e: { x: 560, y: 183, w: 70, h: 180, label: 'East' },
  concourse_s: { x: 165, y: 346, w: 450, h: 70, label: 'South' },
  concourse_w: { x: 150, y: 183, w: 70, h: 180, label: 'West' },
}

export default function Heatmap({ zones }: Props) {
  const byId = Object.fromEntries(zones.map(z => [z.id, z]))

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0B0E14', border: '1px solid var(--border)' }}>
      <svg viewBox="0 0 780 480" className="w-full" role="img" aria-label="Stadium heatmap">
        {/* Field */}
        <ellipse cx="390" cy="250" rx="145" ry="100" fill="#14532d44" stroke="#166534" strokeWidth="2" />
        <ellipse cx="390" cy="250" rx="100" ry="65" fill="none" stroke="#166534" strokeWidth="1" strokeDasharray="6 3" />
        <text x="390" y="255" textAnchor="middle" fontSize="11" fill="#166534" fontFamily="Inter,sans-serif">PITCH</text>

        {/* Concourse ring outline */}
        <rect x="100" y="68" width="580" height="364" rx="60" fill="none" stroke="#232B3D" strokeWidth="2" />

        {/* Zone heat fills */}
        {Object.entries(ZONE_RECTS).map(([id, r]) => {
          const zone = byId[id]
          if (!zone) return null
          return (
            <g key={id}>
              <rect
                x={r.x} y={r.y} width={r.w} height={r.h}
                rx="8"
                fill={occToColor(zone.occupancy, zone.status)}
                stroke={zone.status === 'critical' ? '#EF4444' : zone.status === 'watch' ? '#F59E0B' : '#22C55E'}
                strokeWidth={zone.status === 'ok' ? 1 : 2}
                style={{ transition: 'fill 0.4s ease, stroke 0.4s ease' }}
              />
              <text
                x={r.x + r.w / 2}
                y={r.y + r.h / 2 - 6}
                textAnchor="middle"
                fontSize={r.w > 80 ? '11' : '9'}
                fill="#E6EAF2"
                fontFamily="Inter,sans-serif"
                fontWeight="500"
              >
                {r.label}
              </text>
              <text
                x={r.x + r.w / 2}
                y={r.y + r.h / 2 + 10}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={zone.status === 'critical' ? '#EF4444' : zone.status === 'watch' ? '#F59E0B' : '#22C55E'}
                fontFamily="JetBrains Mono,monospace"
              >
                {Math.round(zone.occupancy)}%
              </text>
            </g>
          )
        })}

        <style>{`
          rect { transition: fill 0.4s ease; }
          @media (prefers-reduced-motion: reduce) { rect { transition: none; } }
        `}</style>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
        {[['ok','#22C55E','OK'], ['watch','#F59E0B','Watch'], ['critical','#EF4444','Critical']].map(([,color,label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
