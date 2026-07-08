import { ZoneState } from '../../lib/store'
import Sparkline from './Sparkline'

interface Props { zones: ZoneState[] }

const STATUS_COLOR = { ok: 'var(--ok)', watch: 'var(--watch)', critical: 'var(--critical)' }
const STATUS_LABEL = { ok: 'OK', watch: 'Watch', critical: 'Critical' }

export default function ZonePanel({ zones }: Props) {
  const concourses = zones.filter(z => z.id.startsWith('concourse')).sort((a, b) => b.occupancy - a.occupancy)
  const gates = zones.filter(z => z.id.startsWith('gate')).sort((a, b) => b.occupancy - a.occupancy)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="eyebrow" style={{ letterSpacing: '0.1em' }}>Zone Status</span>
        <span className="text-[11px] ml-auto tnum" style={{ color: 'var(--faint)' }}>{zones.length} zones</span>
      </div>

      {zones.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--faint)' }}>Awaiting telemetry…</div>
      )}

      {/* Concourses — full rows with status */}
      <div className="flex flex-col">
        {concourses.map(zone => {
          const color = STATUS_COLOR[zone.status]
          return (
            <div key={zone.id} className="flex items-center gap-2.5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="w-1 self-stretch rounded-full" style={{ background: color, minHeight: 34 }} aria-hidden />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold truncate block" style={{ color: 'var(--ink)' }}>{zone.label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                  {STATUS_LABEL[zone.status]}
                </span>
              </div>
              <Sparkline data={zone.history.slice(-20)} status={zone.status} width={44} height={22} />
              <span className="text-[15px] font-bold w-11 text-right tnum" style={{ color, fontFamily: 'var(--font-mono)' }}>
                {Math.round(zone.occupancy)}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Gates — compact */}
      {gates.length > 0 && (
        <>
          <p className="eyebrow mt-4 mb-1.5 text-center" style={{ letterSpacing: '0.14em', fontSize: 10 }}>Gates</p>
          <div className="flex flex-col">
            {gates.map(zone => {
              const color = STATUS_COLOR[zone.status]
              return (
                <div key={zone.id} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[13px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--muted)' }}>{zone.label}</span>
                  <Sparkline data={zone.history.slice(-20)} status={zone.status} width={40} height={18} />
                  <span className="text-[13px] font-bold w-9 text-right tnum" style={{ color, fontFamily: 'var(--font-mono)' }}>
                    {Math.round(zone.occupancy)}%
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
