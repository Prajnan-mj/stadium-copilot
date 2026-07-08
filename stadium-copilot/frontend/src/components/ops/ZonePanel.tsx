import { ZoneState } from '../../lib/store'
import Sparkline from './Sparkline'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

interface Props { zones: ZoneState[] }

const STATUS_ICON = {
  ok: <CheckCircle size={13} aria-hidden />,
  watch: <AlertTriangle size={13} aria-hidden />,
  critical: <AlertCircle size={13} aria-hidden />,
}
const STATUS_COLOR = { ok: 'var(--ok)', watch: 'var(--watch)', critical: 'var(--critical)' }
const STATUS_LABEL = { ok: 'OK', watch: 'Watch', critical: 'Critical' }

export default function ZonePanel({ zones }: Props) {
  const sorted = [...zones].sort((a, b) => b.occupancy - a.occupancy)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        Zone Status
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {sorted.map(zone => (
          <div key={zone.id} className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{zone.label}</span>
                {zone.live_source && (
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#4F8CFF22', color: 'var(--accent)', fontSize: '9px' }}>LIVE</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: STATUS_COLOR[zone.status] }}>
                  {STATUS_ICON[zone.status]}
                  {STATUS_LABEL[zone.status]}
                </span>
                {zone.eta_min !== null && zone.eta_min > 0 && zone.eta_min < 30 && (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    ~{Math.round(zone.eta_min)}m to cap
                  </span>
                )}
              </div>
            </div>
            <Sparkline data={zone.history.slice(-20)} status={zone.status} />
            <span className="text-sm font-bold w-10 text-right"
              style={{ color: STATUS_COLOR[zone.status], fontFamily: 'var(--font-mono)' }}>
              {Math.round(zone.occupancy)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
