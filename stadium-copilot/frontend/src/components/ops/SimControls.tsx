import { triggerScenario } from '../../lib/api'
import { Play, RefreshCw, Clock } from 'lucide-react'

interface Props {
  venueId: string
  speed: number
  onSpeedChange: (s: number) => void
}

const SCENARIOS = [
  { id: 'prematch_rush', label: 'Pre-match Rush' },
  { id: 'halftime_surge', label: 'Halftime Surge' },
  { id: 'gate_closure', label: 'Gate Closure' },
  { id: 'full_egress', label: 'Full Egress' },
]

export default function SimControls({ venueId, speed, onSpeedChange }: Props) {
  async function trigger(id: string) {
    await triggerScenario(venueId, id, speed)
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Play size={13} style={{ color: 'var(--accent)' }} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Simulation Controls
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => trigger(s.id)}
            className="py-2 px-3 rounded-lg text-xs font-medium text-left transition-colors"
            style={{
              background: '#1E2533',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              minHeight: 44,
            }}
            aria-label={`Trigger scenario: ${s.label}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => trigger('reset')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ background: '#1E2533', color: 'var(--muted)', border: '1px solid var(--border)', minHeight: 44 }}
          aria-label="Reset simulation"
        >
          <RefreshCw size={12} aria-hidden />
          Reset
        </button>

        <div className="flex items-center gap-2">
          <Clock size={12} style={{ color: 'var(--muted)' }} aria-hidden />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Speed</span>
          <select
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded"
            style={{ background: '#1E2533', color: 'var(--ink)', border: '1px solid var(--border)', minHeight: 36 }}
            aria-label="Simulation speed"
          >
            {[0.5, 1, 2, 5, 10].map(v => (
              <option key={v} value={v}>{v}×</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
