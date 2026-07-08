import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff, Clock } from 'lucide-react'
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 sticky top-0 z-30"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Stadium Copilot — Ops
          </h1>
          <div className="flex items-center gap-1.5 text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            <Clock size={13} aria-hidden />
            <span>{clockLabel(store.clockMin)}</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>{speed}×</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GuidedDemo venueId={VENUE} />
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
            style={{
              background: store.wsConnected ? '#14532D55' : '#45130F55',
              color: store.wsConnected ? 'var(--ok)' : 'var(--critical)',
            }}>
            {store.wsConnected ? <Wifi size={11} aria-hidden /> : <WifiOff size={11} aria-hidden />}
            {store.wsConnected ? 'Live' : 'Reconnecting'}
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex gap-0 min-h-[calc(100vh-57px)]">
        {/* Left column */}
        <div className="flex-1 p-6 flex flex-col gap-5 min-w-0">
          <Heatmap zones={store.zones} />
          <div className="grid grid-cols-2 gap-4">
            <SimControls venueId={VENUE} speed={speed} onSpeedChange={setSpeed} />
            <AnnounceComposer venueId={VENUE} />
          </div>
          <IncidentLog venueId={VENUE} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5 p-6" style={{ width: 360, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
          <ZonePanel zones={store.zones} />
          <RecommendationFeed recs={store.recs} onApprove={handleApprove} />
        </div>

        {/* Phone preview — fixed overlay bottom-right */}
        {store.previewOpen && <PhonePreview venueId={VENUE} />}
      </div>
    </div>
  )
}
