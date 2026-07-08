import { Recommendation } from '../../lib/store'
import { CheckCircle2, AlertTriangle, AlertCircle, CornerDownRight, Bell } from 'lucide-react'

interface Props {
  rec: Recommendation
  onApprove: (id: string) => void
}

const PRIORITY = {
  P0: { color: '#FF5A5A', glow: 'rgba(255,90,90,0.16)', label: 'P0 · CRITICAL', Icon: AlertCircle },
  P1: { color: '#FBBF24', glow: 'rgba(251,191,36,0.14)', label: 'P1 · URGENT', Icon: AlertTriangle },
  P2: { color: '#FBBF24', glow: 'rgba(251,191,36,0.14)', label: 'P2 · WATCH', Icon: AlertTriangle },
}

export default function RecCard({ rec, onApprove }: Props) {
  const cfg = PRIORITY[rec.priority]
  return (
    <div
      className="rounded-xl overflow-hidden animate-rise"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${rec.approved ? 'var(--border)' : cfg.color}`,
        boxShadow: rec.approved ? 'none' : `0 0 0 1px ${cfg.glow}, var(--e2)`,
        opacity: rec.approved ? 0.62 : 1,
        transition: 'opacity 0.3s ease',
      }}
      role="article"
      aria-label={`Recommendation: ${rec.action}`}
    >
      <div className="h-1" style={{ background: rec.approved ? 'var(--border)' : cfg.color }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="pill text-[11px] font-bold px-2 py-1"
            style={{ background: cfg.glow, color: cfg.color }}>
            <cfg.Icon size={13} aria-hidden />
            {cfg.label}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded tnum"
            style={{ color: 'var(--muted)', background: 'var(--surface-2)', fontFamily: 'var(--font-mono)' }}>
            {rec.zone_id}
          </span>
        </div>

        <p className="text-sm font-bold mb-1 leading-snug" style={{ color: 'var(--ink)' }}>{rec.action}</p>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>{rec.reason}</p>

        {rec.alternate_zone && (
          <div className="flex items-center gap-1.5 text-xs mb-3 px-2.5 py-1.5 rounded-lg"
            style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}>
            <CornerDownRight size={13} style={{ color: 'var(--accent)' }} aria-hidden />
            Redirect to <strong style={{ color: 'var(--ink)' }}>{rec.alternate_zone}</strong>
          </div>
        )}

        {!rec.approved ? (
          <button
            onClick={() => onApprove(rec.id)}
            className="pill w-full justify-center py-2.5 text-sm font-bold pressable"
            style={{ background: cfg.color, color: '#08111a' }}
            aria-label={`Approve recommendation and notify fans: ${rec.action}`}
          >
            <Bell size={15} aria-hidden />
            Approve &amp; notify fans
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm font-semibold py-1" style={{ color: 'var(--ok)' }}>
            <CheckCircle2 size={16} aria-hidden />
            Approved — fans notified
          </div>
        )}
      </div>
    </div>
  )
}
