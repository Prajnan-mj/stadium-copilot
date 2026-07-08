import { useState } from 'react'
import { addIncident } from '../../lib/api'
import { AlertTriangle, Plus } from 'lucide-react'
import { useOpsStore } from '../../lib/store'

interface Props { venueId: string }

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
      setOpen(false)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} style={{ color: 'var(--watch)' }} aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Incident Log
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded"
          style={{ background: '#1E2533', color: 'var(--accent)', minHeight: 36 }}
          aria-label="Add incident"
        >
          <Plus size={12} aria-hidden /> Add
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 mb-3 p-3 rounded-lg" style={{ background: '#1E2533' }}>
          <select
            value={zone}
            onChange={e => setZone(e.target.value)}
            className="px-2 py-1 rounded text-sm"
            style={{ background: '#0B0E14', color: 'var(--ink)', border: '1px solid var(--border)', minHeight: 36 }}
            aria-label="Zone"
          >
            {['gate_a','gate_b','gate_c','gate_d','gate_e','gate_f',
              'concourse_n','concourse_e','concourse_s','concourse_w'].map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Describe incident..."
              className="flex-1 px-2 py-1 rounded text-sm outline-none"
              style={{ background: '#0B0E14', border: '1px solid var(--border)', color: 'var(--ink)', minHeight: 36 }}
              aria-label="Incident description"
            />
            <button
              onClick={handleAdd}
              disabled={!text.trim() || adding}
              className="px-3 py-1 rounded text-xs font-semibold"
              style={{ background: 'var(--watch)', color: '#000', minHeight: 36 }}
            >Log</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {incidents.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>No incidents logged</p>
        ) : (
          [...incidents].reverse().map(inc => (
            <div key={inc.id} className="text-xs p-2 rounded" style={{ background: '#1E2533' }}>
              <span className="font-mono" style={{ color: 'var(--watch)' }}>[{inc.zone_id}]</span>{' '}
              <span style={{ color: 'var(--ink)' }}>{inc.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
