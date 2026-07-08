import { ZoneState } from '../../lib/store'

interface Props {
  zones: ZoneState[]
}

const STATUS = {
  ok: { stroke: '#2DD4A7', fill: 'rgba(45,212,167,0.14)', label: 'OK', range: '<60%' },
  watch: { stroke: '#FBBF24', fill: 'rgba(251,191,36,0.16)', label: 'Watch', range: '60–79%' },
  critical: { stroke: '#FF5A5A', fill: 'rgba(255,90,90,0.20)', label: 'Critical', range: '≥80%' },
}

const ZONE_RECTS: Record<string, { x: number; y: number; w: number; h: number; label: string; big?: boolean }> = {
  gate_a:      { x: 108, y: 72,  w: 52, h: 36, label: 'Gate A' },
  gate_b:      { x: 228, y: 42,  w: 52, h: 36, label: 'Gate B' },
  gate_c:      { x: 364, y: 32,  w: 52, h: 36, label: 'Gate C' },
  gate_d:      { x: 500, y: 42,  w: 52, h: 36, label: 'Gate D' },
  gate_e:      { x: 620, y: 72,  w: 52, h: 36, label: 'Gate E' },
  gate_f:      { x: 620, y: 352, w: 52, h: 36, label: 'Gate F' },
  concourse_n: { x: 165, y: 110, w: 450, h: 74, label: 'North', big: true },
  concourse_e: { x: 556, y: 188, w: 74, h: 172, label: 'East', big: true },
  concourse_s: { x: 165, y: 344, w: 450, h: 74, label: 'South', big: true },
  concourse_w: { x: 150, y: 188, w: 74, h: 172, label: 'West', big: true },
}

export default function Heatmap({ zones }: Props) {
  const byId = Object.fromEntries(zones.map(z => [z.id, z]))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="eyebrow" style={{ letterSpacing: '0.12em' }}>Live Crowd Density</span>
        <div className="flex gap-4">
          {Object.entries(STATUS).map(([k, s]) => (
            <span key={k} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.stroke, boxShadow: `0 0 8px ${s.stroke}66` }} aria-hidden />
              {s.label} {s.range}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox="0 0 780 460" className="w-full h-full" style={{ maxHeight: '68vh' }} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Stadium heatmap of zone occupancy">
          <defs>
            <filter id="zoneGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="pitchGrad" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#13301c" />
              <stop offset="100%" stopColor="#0a2013" />
            </radialGradient>
          </defs>

          {/* Concourse ring outline */}
          <rect x="100" y="68" width="580" height="364" rx="70" fill="none" stroke="#1c2434" strokeWidth="2" />

          {/* Field */}
          <ellipse cx="390" cy="250" rx="150" ry="102" fill="url(#pitchGrad)" stroke="#1f6b3a" strokeWidth="1.5" opacity="0.9" />
          <ellipse cx="390" cy="250" rx="104" ry="66" fill="none" stroke="#1f6b3a" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
          <line x1="390" y1="150" x2="390" y2="350" stroke="#1f6b3a" strokeWidth="1" opacity="0.5" />
          <text x="390" y="256" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="4" fill="#356b48" fontFamily="Inter,sans-serif">PITCH</text>

          {/* Zone heat fills */}
          {Object.entries(ZONE_RECTS).map(([id, r]) => {
            const zone = byId[id]
            if (!zone) return null
            const s = STATUS[zone.status]
            const isHot = zone.status !== 'ok'
            const cx = r.x + r.w / 2
            const cy = r.y + r.h / 2
            return (
              <g key={id} filter={zone.status === 'critical' ? 'url(#zoneGlow)' : undefined}>
                <rect
                  x={r.x} y={r.y} width={r.w} height={r.h} rx={r.big ? 12 : 9}
                  fill={s.fill}
                  stroke={s.stroke}
                  strokeWidth={isHot ? 2 : 1.25}
                  style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }}
                />
                {r.big ? (
                  <>
                    <text x={cx} y={cy - 2} textAnchor="middle"
                      fontSize="30" fontWeight="800" fill={s.stroke} fontFamily="JetBrains Mono,monospace">
                      {Math.round(zone.occupancy)}%
                    </text>
                    <text x={cx} y={cy + 20} textAnchor="middle"
                      fontSize="12" fill="#B7C2D4" fontFamily="Inter,sans-serif" fontWeight="600">
                      {r.label}
                    </text>
                  </>
                ) : (
                  <>
                    <text x={cx} y={cy - 4} textAnchor="middle"
                      fontSize="9" fill="#B7C2D4" fontFamily="Inter,sans-serif" fontWeight="600">
                      {r.label}
                    </text>
                    <text x={cx} y={cy + 10} textAnchor="middle"
                      fontSize="13" fontWeight="800" fill={s.stroke} fontFamily="JetBrains Mono,monospace">
                      {Math.round(zone.occupancy)}%
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
