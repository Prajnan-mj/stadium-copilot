import { useState } from 'react'
import { addIncident } from '../../lib/api'
import { Plus, X } from 'lucide-react'
import { useOpsStore } from '../../lib/store'

interface Props { venueId: string }

const ZONES = ['gate_a','gate_b','gate_c','gate_d','gate_e','gate_f','concourse_n','concourse_e','concourse_s','concourse_w']

export default function IncidentLog({ venueId }: Props) {
  const incidents = useOpsStore(s => s.incidents)
  const [zone, setZone] = useState('gate_c')
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleAdd() {
    if (!text.trim()) return
    setAdding(true)
    try {
      await addIncident(venueId, zone, text.trim())
      setText('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <span className="eyebrow hidden xl:inline" style={{ letterSpacing: '0.1em' }}>Incident Log</span>
      {incidents.length > 0 && (
        <span className="text-[11px] px-1.5 py-0.5 tnum" style={{ background: 'var(--surface-2)', color: 'var(--muted)', borderRadius: 'var(--r-sm)' }}>{incidents.length}</span>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="pill text-xs font-semibold px-2.5 py-1.5 pressable"
        style={{ background: open ? 'var(--surface-2)' : 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)' }}
        aria-label={open ? 'Close incident log' : 'Add incident'}
      >
        {open ? <X size={13} aria-hidden /> : <Plus size={13} aria-hidden />}
        {open ? 'Close' : 'Add'}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-3 w-80 p-4 glass animate-rise z-40"
          style={{ boxShadow: 'var(--e3)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow" style={{ letterSpacing: '0.1em' }}>Log Incident</span>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="px-2.5 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}
              aria-label="Zone"
            >
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <div className="flex gap-2 items-center">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Describe incident…"
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 'var(--r-sm)' }}
                aria-label="Incident description"
              />
              <button
                onClick={handleAdd}
                disabled={!text.trim() || adding}
                className="px-3.5 py-2 text-xs font-bold pressable"
                style={{ background: 'var(--watch)', color: '#1a1300', borderRadius: 'var(--r-sm)' }}
              >Log</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
            {incidents.length === 0 ? (
              <p className="text-xs py-2 text-center" style={{ color: 'var(--faint)' }}>No incidents logged</p>
            ) : (
              [...incidents].reverse().map(inc => (
                <div key={inc.id} className="flex items-start gap-2 text-xs p-2.5" style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                  <span className="pill px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0 tnum"
                    style={{ background: 'rgba(251,191,36,0.14)', color: 'var(--watch)', fontFamily: 'var(--font-mono)' }}>
                    {inc.zone_id}
                  </span>
                  <span style={{ color: 'var(--ink)', lineHeight: 1.4 }}>{inc.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
