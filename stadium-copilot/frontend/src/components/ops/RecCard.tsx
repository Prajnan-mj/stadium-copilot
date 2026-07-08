import { Recommendation } from '../../lib/store'
import { CheckCircle, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react'

interface Props {
  rec: Recommendation
  onApprove: (id: string) => void
}

const PRIORITY_CONFIG = {
  P0: { color: '#EF4444', bg: '#EF444422', label: 'P0 — Critical', icon: <AlertCircle size={14} aria-hidden /> },
  P1: { color: '#F59E0B', bg: '#F59E0B22', label: 'P1 — Urgent',   icon: <AlertTriangle size={14} aria-hidden /> },
  P2: { color: '#4F8CFF', bg: '#4F8CFF22', label: 'P2 — Watch',    icon: <CheckCircle size={14} aria-hidden /> },
}

export default function RecCard({ rec, onApprove }: Props) {
  const cfg = PRIORITY_CONFIG[rec.priority]
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${cfg.color}`,
        opacity: rec.approved ? 0.5 : 1,
        transition: 'opacity 0.3s ease',
      }}
      role="article"
      aria-label={`Recommendation: ${rec.action}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {rec.zone_id}
        </span>
      </div>

      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{rec.action}</p>
      <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{rec.reason}</p>

      {rec.alternate_zone && (
        <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--muted)' }}>
          <ArrowRight size={12} aria-hidden />
          Redirect to <strong style={{ color: 'var(--ink)' }}>{rec.alternate_zone}</strong>
        </div>
      )}

      {!rec.approved ? (
        <button
          onClick={() => onApprove(rec.id)}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: cfg.color, color: '#fff' }}
          aria-label={`Approve recommendation and notify fans: ${rec.action}`}
        >
          Approve &amp; notify fans
        </button>
      ) : (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ok)' }}>
          <CheckCircle size={14} aria-hidden />
          Approved — fans notified
        </div>
      )}
    </div>
  )
}
