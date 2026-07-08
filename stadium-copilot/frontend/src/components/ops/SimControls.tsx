import { triggerScenario } from '../../lib/api'
import { RotateCcw, Users, Timer, DoorClosed, LogOut } from 'lucide-react'

interface Props {
  venueId: string
  speed: number
  onSpeedChange: (s: number) => void
}

const SCENARIOS = [
  { id: 'prematch_rush', label: 'Pre-match Rush', Icon: Users },
  { id: 'halftime_surge', label: 'Halftime Surge', Icon: Timer },
  { id: 'gate_closure', label: 'Gate Closure', Icon: DoorClosed },
  { id: 'full_egress', label: 'Full Egress', Icon: LogOut },
]

export default function SimControls({ venueId, speed, onSpeedChange }: Props) {
  async function trigger(id: string) {
    await triggerScenario(venueId, id, speed)
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="eyebrow hidden lg:inline mr-1" style={{ letterSpacing: '0.1em' }}>Simulation</span>

      {SCENARIOS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => trigger(id)}
          className="flex items-center gap-2 py-2 px-3 text-xs font-semibold whitespace-nowrap pressable"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}
          aria-label={`Trigger scenario: ${label}`}
        >
          <Icon size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden />
          {label}
        </button>
      ))}

      <button
        onClick={() => trigger('reset')}
        className="flex items-center gap-2 py-2 px-3 text-xs font-semibold whitespace-nowrap pressable"
        style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}
        aria-label="Reset simulation"
      >
        <RotateCcw size={13} aria-hidden />
        Reset
      </button>

      <div className="flex items-center gap-1.5 pl-3 ml-1" style={{ borderLeft: '1px solid var(--border)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Speed</span>
        <select
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="text-xs font-bold px-1.5 py-1 tnum outline-none"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}
          aria-label="Simulation speed"
        >
          {[0.5, 1, 2, 5, 10].map(v => <option key={v} value={v}>{v}×</option>)}
        </select>
      </div>
    </div>
  )
}
