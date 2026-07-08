import { Recommendation } from '../../lib/store'
import RecCard from './RecCard'
import { Sparkles, ShieldCheck } from 'lucide-react'

interface Props {
  recs: Recommendation[]
  onApprove: (id: string) => void
}

export default function RecommendationFeed({ recs, onApprove }: Props) {
  const active = recs.filter(r => !r.approved)
  const approved = recs.filter(r => r.approved)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3.5">
        <Sparkles size={15} style={{ color: 'var(--accent)' }} aria-hidden />
        <span className="eyebrow" style={{ letterSpacing: '0.1em' }}>AI Dispatch</span>
        {active.length > 0 && (
          <span className="pill ml-auto text-[11px] px-2 py-0.5 font-bold tnum"
            style={{ background: 'rgba(255,90,90,0.14)', color: 'var(--critical)', border: '1px solid rgba(255,90,90,0.3)' }}>
            {active.length} pending
          </span>
        )}
      </div>

      {recs.length === 0 ? (
        <div className="panel px-4 py-8 text-center">
          <ShieldCheck size={26} className="mx-auto mb-2" style={{ color: 'var(--ok)' }} aria-hidden />
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>All zones nominal</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--faint)' }}>No active recommendations</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map(r => <RecCard key={r.id} rec={r} onApprove={onApprove} />)}
        </div>
      )}

      {/* Resolved today */}
      <div className="mt-6">
        <p className="eyebrow mb-2.5" style={{ letterSpacing: '0.1em' }}>Resolved Today</p>
        {approved.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--faint)' }}>No resolved incidents yet this session.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {approved.map(r => <RecCard key={r.id} rec={r} onApprove={onApprove} />)}
          </div>
        )}
      </div>
    </div>
  )
}
