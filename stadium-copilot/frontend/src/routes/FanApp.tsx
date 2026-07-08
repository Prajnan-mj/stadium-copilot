import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Wifi, WifiOff, Accessibility, WifiOff as ZoneOff } from 'lucide-react'
import { useFanStore } from '../lib/store'
import { chatRequest } from '../lib/api'
import { WSConnection } from '../lib/ws'
import { offlineAnswer } from '../lib/offline'
import { getUIString } from '../lib/i18nStrings'
import ChatThread from '../components/fan/ChatThread'
import SampleChips from '../components/fan/SampleChips'
import TicketSnap from '../components/fan/TicketSnap'

export default function FanApp() {
  const [searchParams] = useSearchParams()
  const embed = searchParams.get('embed') === '1'
  const venueParam = searchParams.get('venue') || 'nyj'

  const store = useFanStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WSConnection | null>(null)

  // Session lang heuristic from messages
  const lastAssistantLang = store.messages.filter(m => m.role === 'assistant').slice(-1)[0]?.lang || 'en'

  useEffect(() => {
    const ws = new WSConnection(`/ws/fan/${venueParam}/${store.sessionId}`)
    wsRef.current = ws

    const unsub = ws.onMessage((data: unknown) => {
      const msg = data as Record<string, unknown>
      store.setWsConnected(true)
      if (msg.type === 'alert') {
        store.addMessage({
          role: 'assistant',
          text: msg.text as string,
          route: (msg.route as null) ?? null,
          isAlert: true,
        })
      }
      if (msg.type === 'announcement') {
        store.addMessage({
          role: 'assistant',
          text: msg.text as string,
          isAnnouncement: true,
        })
      }
    })

    const interval = setInterval(() => {
      store.setWsConnected(ws.connected)
    }, 3000)

    return () => {
      unsub()
      ws.destroy()
      clearInterval(interval)
    }
  }, [venueParam, store.sessionId])

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim()
    if (!message) return

    store.addMessage({ role: 'user', text: message })
    setInput('')
    setLoading(true)

    if (store.offline) {
      const reply = offlineAnswer(message)
      store.addMessage({
        role: 'assistant',
        text: reply,
        source: 'cache',
      })
      setLoading(false)
      return
    }

    try {
      const res = await chatRequest({
        venue_id: venueParam,
        session_id: store.sessionId,
        message,
        accessibility_mode: store.accessibilityMode,
        user_context: { section: store.section ?? undefined, seat: store.seat ?? undefined },
      })
      store.addMessage({
        role: 'assistant',
        text: res.reply_text,
        lang: res.detected_lang,
        route: res.route ?? null,
        source: res.source,
      })
      if (res.session_context?.section) store.setSection(res.session_context.section)
      if (res.session_context?.seat) store.setSeat(res.session_context.seat)
    } catch {
      store.addMessage({
        role: 'assistant',
        text: 'Sorry, I couldn\'t reach the server. Please visit the Fan Help Desk for assistance.',
        source: 'template',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleTicket(base64: string) {
    store.addMessage({ role: 'user', text: '[Ticket image uploaded]' })
    setLoading(true)
    try {
      const res = await chatRequest({
        venue_id: venueParam,
        session_id: store.sessionId,
        image_base64: base64,
        accessibility_mode: store.accessibilityMode,
        user_context: {},
      })
      store.addMessage({
        role: 'assistant',
        text: res.reply_text,
        route: res.route ?? null,
        source: res.source,
      })
      if (res.session_context?.section) store.setSection(res.session_context.section)
    } catch {
      store.addMessage({ role: 'assistant', text: 'Couldn\'t read the ticket. Please tell me your section number.' })
    } finally {
      setLoading(false)
    }
  }

  const lang = lastAssistantLang
  const venueName = venueParam === 'nyj' ? 'MetLife Stadium' : 'Hard Rock Stadium'

  return (
    <div
      className="flex flex-col h-dvh w-full relative"
      style={{ background: 'var(--bg-tint)' }}
    >
      {/* Header */}
      {!embed && (
        <header className="flex items-center justify-between gap-3 px-5 sm:px-8 py-3.5 z-20 w-full"
          style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-grad)', boxShadow: 'var(--glow-brand)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <ellipse cx="12" cy="12" rx="10" ry="7" stroke="white" strokeWidth="1.8" />
                <ellipse cx="12" cy="12" rx="4" ry="7" stroke="white" strokeWidth="1.4" opacity="0.75" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.4" opacity="0.75" />
              </svg>
            </span>
            <div>
              <h1 className="font-bold text-[15px] leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Stadium Copilot
              </h1>
              <p className="text-xs leading-tight" style={{ color: 'var(--muted)' }}>{venueName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {store.section && (
              <span className="pill text-xs px-2.5 py-1 tnum"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
                §{store.section}
              </span>
            )}
            <button
              onClick={() => store.setAccessibility(!store.accessibilityMode)}
              aria-pressed={store.accessibilityMode}
              aria-label="Toggle step-free routing"
              className="rounded-xl flex items-center justify-center pressable"
              style={{
                background: store.accessibilityMode ? 'var(--brand-grad)' : 'var(--chip)',
                color: store.accessibilityMode ? 'var(--accent-ink)' : 'var(--muted)',
                boxShadow: store.accessibilityMode ? 'var(--glow-brand)' : 'none',
                height: 40, width: 40,
              }}
            >
              <Accessibility size={17} aria-hidden />
            </button>
            <div className="pill text-xs px-2.5 py-1"
              style={{
                background: store.wsConnected ? 'var(--brand-soft)' : 'var(--alert-soft)',
                color: store.wsConnected ? 'var(--brand-strong)' : 'var(--alert)',
              }}>
              {store.wsConnected
                ? <span className="livedot" style={{ color: 'var(--brand)', width: 6, height: 6 }} />
                : <WifiOff size={11} aria-hidden />}
              {store.wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>
      )}

      {/* Offline banner */}
      {store.offline && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm animate-fadein"
          style={{ background: '#FEF6E4', color: '#8A5A00', borderBottom: '1px solid #F5E3BC' }}
          role="status">
          <ZoneOff size={14} aria-hidden />
          {getUIString(lang, 'offlineBanner')}
        </div>
      )}

      {/* Chat */}
      <ChatThread messages={store.messages} loading={loading} accessible={store.accessibilityMode} />

      {/* Chips (shown when no messages yet) */}
      {store.messages.length === 0 && (
        <div className="w-full max-w-3xl mx-auto">
          <SampleChips onSelect={sendMessage} disabled={loading} />
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 sm:px-6 pt-2.5 pb-4 w-full"
        style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)' }}>
        <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <TicketSnap onTicket={handleTicket} />
          <button
            onClick={() => store.setOffline(!store.offline)}
            aria-pressed={store.offline}
            aria-label="Simulate stadium dead zone"
            className="pill px-3 py-2 text-xs font-semibold pressable"
            style={{
              background: store.offline ? '#FEF6E4' : 'var(--chip)',
              color: store.offline ? '#8A5A00' : 'var(--muted)',
              border: '1px solid var(--border)',
              minHeight: 40, whiteSpace: 'nowrap',
            }}
            title="Simulate dead zone"
          >
            {store.offline ? <Wifi size={13} aria-hidden /> : <ZoneOff size={13} aria-hidden />}
            {store.offline ? 'Back online' : 'Dead zone'}
          </button>
        </div>
        <div className="flex items-center gap-2 pl-4 pr-1.5 py-1.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e1)', borderRadius: 'var(--r-lg)' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={getUIString(lang, 'placeholder')}
            disabled={loading}
            aria-label="Message input"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--ink)', minHeight: 40 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="rounded-xl flex items-center justify-center transition-all pressable"
            style={{
              background: input.trim() ? 'var(--brand-grad)' : 'var(--chip)',
              color: input.trim() ? 'var(--accent-ink)' : 'var(--faint)',
              boxShadow: input.trim() ? 'var(--glow-brand)' : 'none',
              height: 40, width: 40, flexShrink: 0,
            }}
          >
            <Send size={16} aria-hidden />
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
