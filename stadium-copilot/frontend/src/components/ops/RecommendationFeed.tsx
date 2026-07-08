import { Recommendation } from '../../lib/store'
import RecCard from './RecCard'
import { Zap } from 'lucide-react'

interface Props {
  recs: Recommendation[]
  onApprove: (id: string) => void
}

export default function RecommendationFeed({ recs, onApprove }: Props) {
  const active = recs.filter(r => !r.approved)
  const approved = recs.filter(r => r.approved)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} style={{ color: 'var(--accent)' }} aria-hidden />
        <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>AI Dispatch</span>
        {active.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: '#EF4444', color: '#fff' }}>
            {active.length}
          </span>
        )}
      </div>

      {recs.length === 0 ? (
        <div className="rounded-xl p-4 text-center text-sm" style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
          No active recommendations — all zones nominal
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map(r => (
            <RecCard key={r.id} rec={r} onApprove={onApprove} />
          ))}
          {approved.map(r => (
            <RecCard key={r.id} rec={r} onApprove={onApprove} />
          ))}
        </div>
      )}
    </div>
  )
}
