import { useEffect, useRef, useState } from 'react'
import { WifiOff, Clock } from 'lucide-react'
import { useOpsStore } from '../lib/store'
import { WSConnection } from '../lib/ws'
import { approveRec, getOpsState } from '../lib/api'
import Heatmap from '../components/ops/Heatmap'
import ZonePanel from '../components/ops/ZonePanel'
import RecommendationFeed from '../components/ops/RecommendationFeed'
import SimControls from '../components/ops/SimControls'
import AnnounceComposer from '../components/ops/AnnounceComposer'
import IncidentLog from '../components/ops/IncidentLog'
import PhonePreview from '../components/ops/PhonePreview'
import GuidedDemo from '../components/ops/GuidedDemo'

function clockLabel(min: number): string {
  const abs = Math.abs(Math.round(min))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const sign = min < 0 ? 'T−' : 'T+'
  return h > 0 ? `${sign}${h}h${pad(m)}m` : `${sign}${pad(m)}m`
}

export default function OpsApp() {
  const store = useOpsStore()
  const wsRef = useRef<WSConnection | null>(null)
  const [speed, setSpeed] = useState(1)
  const VENUE = 'nyj'

  useEffect(() => {
    document.body.classList.add('ops-theme')
    return () => document.body.classList.remove('ops-theme')
  }, [])

  // Poll fallback every 10s
  useEffect(() => {
    const poll = setInterval(async () => {
      if (!store.wsConnected) {
        const state = await getOpsState(VENUE)
        if (state) {
          store.setZones(state.zones)
          store.setRecs(state.recs)
          store.setClock(state.clock_min)
        }
      }
    }, 10000)
    return () => clearInterval(poll)
  }, [store.wsConnected])

  useEffect(() => {
    const ws = new WSConnection(`/ws/ops/${VENUE}`)
    wsRef.current = ws

    const unsub = ws.onMessage((data: unknown) => {
      const msg = data as Record<string, unknown>
      store.setWsConnected(true)

      if (msg.type === 'tick') {
        store.setZones((msg.zones as typeof store.zones) || [])
        store.setRecs((msg.recs as typeof store.recs) || [])
        store.setClock(msg.clock_min as number)
        setSpeed(msg.speed as number)
      }
      if (msg.type === 'recommendation') {
        const r = msg.rec as (typeof store.recs)[0]
        if (r) store.addRec(r)
      }
      if (msg.type === 'incident') {
        store.addIncident(msg as { id: string; zone_id: string; text: string; timestamp: number })
      }
      if (msg.type === 'approved') {
        store.approveRec(msg.rec_id as string)
      }
    })

    const interval = setInterval(() => store.setWsConnected(ws.connected), 3000)

    return () => {
      unsub()
      ws.destroy()
      clearInterval(interval)
    }
  }, [])

  async function handleApprove(recId: string) {
    store.approveRec(recId)
    await approveRec(VENUE, recId)
  }

  const critical = store.zones.filter(z => z.status === 'critical').length
  const watch = store.zones.filter(z => z.status === 'watch').length
  const pending = store.recs.filter(r => !r.approved).length

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'var(--bg-tint)', color: 'var(--ink)' }}>
      {/* ===== Top bar ===== */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-5 h-14 flex-shrink-0 z-30"
        style={{ background: 'color-mix(in srgb, var(--surface) 86%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00C25A,#00934A)', borderRadius: 'var(--r-md)', boxShadow: '0 0 18px rgba(0,194,90,0.32)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <ellipse cx="12" cy="12" rx="10" ry="7" stroke="white" strokeWidth="1.8" />
              <ellipse cx="12" cy="12" rx="4" ry="7" stroke="white" strokeWidth="1.4" opacity="0.75" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.4" opacity="0.75" />
            </svg>
          </span>
          <h1 className="text-[15px] font-bold tracking-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
            Ops Command Center
          </h1>
          <span className="hidden lg:inline text-[12px] truncate" style={{ color: 'var(--faint)' }}>· MetLife Stadium · NY/NJ</span>
        </div>

        {/* At-a-glance status counters */}
        <div className="hidden md:flex items-center gap-2">
          <StatChip color="var(--critical)" glow="var(--critical-glow)" value={critical} label="Critical" pulse={critical > 0} />
          <StatChip color="var(--watch)" glow="var(--watch-glow)" value={watch} label="Watch" />
          <StatChip color="var(--pending)" glow="var(--pending-glow)" value={pending} label="Pending" pulse={pending > 0} />
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 pr-3 h-8" style={{ borderRight: '1px solid var(--border)' }}>
            <Clock size={13} style={{ color: 'var(--accent)' }} aria-hidden />
            <span className="text-[13px] font-semibold tnum" style={{ fontFamily: 'var(--font-mono)' }}>{clockLabel(store.clockMin)}</span>
            <span className="text-[11px] px-1.5 py-0.5 font-bold tnum" style={{ background: 'var(--surface-2)', color: 'var(--muted)', borderRadius: 'var(--r-sm)' }}>{speed}×</span>
          </div>
          <div className="pill text-xs px-2.5 py-1.5"
            style={{
              background: store.wsConnected ? 'rgba(45,212,167,0.12)' : 'rgba(255,90,90,0.12)',
              color: store.wsConnected ? 'var(--ok)' : 'var(--critical)',
              border: `1px solid ${store.wsConnected ? 'rgba(45,212,167,0.25)' : 'rgba(255,90,90,0.25)'}`,
            }}>
            {store.wsConnected
              ? <span className="livedot" style={{ color: 'var(--ok)', width: 6, height: 6 }} />
              : <WifiOff size={11} aria-hidden />}
            {store.wsConnected ? 'Live' : 'Reconnecting'}
          </div>
          <GuidedDemo venueId={VENUE} />
        </div>
      </header>

      {/* ===== Main: 3 columns ===== */}
      <div className="flex-1 flex min-h-0">
        {/* Left rail — AI dispatch + announce */}
        <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 min-h-0"
          style={{ borderRight: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}>
          <div className="flex-1 overflow-y-auto p-4">
            <RecommendationFeed recs={store.recs} onApprove={handleApprove} />
          </div>
          <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <AnnounceComposer venueId={VENUE} />
          </div>
        </aside>

        {/* Center — heatmap */}
        <section className="flex-1 min-w-0 p-4 sm:p-6 overflow-auto flex flex-col">
          <Heatmap zones={store.zones} />
        </section>

        {/* Right rail — zone status */}
        <aside className="hidden lg:flex flex-col w-[256px] flex-shrink-0 min-h-0 overflow-y-auto p-4"
          style={{ borderLeft: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}>
          <ZonePanel zones={store.zones} />
        </aside>
      </div>

      {/* ===== Bottom bar — simulation ===== */}
      <footer className="flex items-center gap-3 px-4 sm:px-5 h-14 flex-shrink-0 overflow-x-auto"
        style={{ borderTop: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface) 86%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        <SimControls venueId={VENUE} speed={speed} onSpeedChange={setSpeed} />
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <IncidentLog venueId={VENUE} />
        </div>
      </footer>

      {/* Phone preview — fixed overlay bottom-right */}
      {store.previewOpen && <PhonePreview venueId={VENUE} />}
    </div>
  )
}

function StatChip({ color, glow, value, label, pulse }: { color: string; glow: string; value: number; label: string; pulse?: boolean }) {
  const active = value > 0
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1"
      style={{ background: active ? glow : 'var(--surface-2)', border: `1px solid ${active ? color : 'var(--border)'}`, borderRadius: 'var(--r-pill)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, animation: pulse ? 'softpulse 1.4s ease-in-out infinite' : 'none' }} />
      <span className="text-sm font-bold tnum" style={{ color: active ? color : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{value}</span>
      <span className="text-[11px] font-medium" style={{ color: 'var(--faint)' }}>{label}</span>
    </div>
  )
}
