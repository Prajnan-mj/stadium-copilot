import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  lang?: string
  route?: RouteResult | null
  source?: string
  isAlert?: boolean
  isAnnouncement?: boolean
  timestamp: number
}

export interface RouteStep {
  node_id: string
  label: string
  x: number
  y: number
}

export interface RouteResult {
  steps: RouteStep[]
  distance_m: number
  eta_min: number
  accessible: boolean
}

export interface ZoneState {
  id: string
  label: string
  occupancy: number
  status: 'ok' | 'watch' | 'critical'
  eta_min: number | null
  inflow: number
  history: number[]
  live_source: boolean
}

export interface Recommendation {
  id: string
  priority: 'P0' | 'P1' | 'P2'
  zone_id: string
  action: string
  reason: string
  alternate_zone: string | null
  expires_min: number
  approved: boolean
  timestamp: number
}

export interface FanStore {
  sessionId: string
  venueId: string
  messages: Message[]
  accessibilityMode: boolean
  section: string | null
  seat: string | null
  offline: boolean
  wsConnected: boolean
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void
  setAccessibility: (v: boolean) => void
  setSection: (s: string | null) => void
  setSeat: (s: string | null) => void
  setOffline: (v: boolean) => void
  setWsConnected: (v: boolean) => void
}

export interface OpsStore {
  venueId: string
  zones: ZoneState[]
  recs: Recommendation[]
  incidents: { id: string; zone_id: string; text: string; timestamp: number }[]
  clockMin: number
  speed: number
  simRunning: boolean
  previewOpen: boolean
  wsConnected: boolean
  setZones: (z: ZoneState[]) => void
  setRecs: (r: Recommendation[]) => void
  addRec: (r: Recommendation) => void
  approveRec: (id: string) => void
  addIncident: (i: { id: string; zone_id: string; text: string; timestamp: number }) => void
  setClock: (c: number) => void
  setSpeed: (s: number) => void
  setPreviewOpen: (v: boolean) => void
  setWsConnected: (v: boolean) => void
}

function genId() {
  return Math.random().toString(36).slice(2)
}

export const useFanStore = create<FanStore>((set) => ({
  sessionId: genId(),
  venueId: 'nyj',
  messages: [],
  accessibilityMode: false,
  section: null,
  seat: null,
  offline: false,
  wsConnected: false,
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: genId(), timestamp: Date.now() }],
    })),
  setAccessibility: (v) => set({ accessibilityMode: v }),
  setSection: (s) => set({ section: s }),
  setSeat: (s) => set({ seat: s }),
  setOffline: (v) => set({ offline: v }),
  setWsConnected: (v) => set({ wsConnected: v }),
}))

export const useOpsStore = create<OpsStore>((set) => ({
  venueId: 'nyj',
  zones: [],
  recs: [],
  incidents: [],
  clockMin: -120,
  speed: 1,
  simRunning: true,
  previewOpen: false,
  wsConnected: false,
  setZones: (z) => set({ zones: z }),
  setRecs: (r) => set({ recs: r }),
  addRec: (r) =>
    set((s) => ({
      recs: s.recs.find(x => x.id === r.id) ? s.recs : [...s.recs.slice(-2), r],
    })),
  approveRec: (id) =>
    set((s) => ({
      recs: s.recs.map(r => r.id === id ? { ...r, approved: true } : r),
    })),
  addIncident: (i) =>
    set((s) => ({ incidents: [...s.incidents.slice(-19), i] })),
  setClock: (c) => set({ clockMin: c }),
  setSpeed: (s) => set({ speed: s }),
  setPreviewOpen: (v) => set({ previewOpen: v }),
  setWsConnected: (v) => set({ wsConnected: v }),
}))
