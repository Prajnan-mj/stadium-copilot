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

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'var(--bg)', maxWidth: embed ? '100%' : '430px', margin: '0 auto' }}
    >
      {/* Header */}
      {!embed && (
        <header className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 className="font-semibold text-base" style={{ fontFamily: 'var(--font-display)' }}>
              Stadium Copilot
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {venueParam === 'nyj' ? 'MetLife Stadium' : 'Hard Rock Stadium'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {store.section && (
              <span className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'var(--chip)', color: 'var(--muted)' }}>
                §{store.section}
              </span>
            )}
            <button
              onClick={() => store.setAccessibility(!store.accessibilityMode)}
              aria-pressed={store.accessibilityMode}
              aria-label="Toggle step-free routing"
              className="p-2 rounded-lg transition-colors"
              style={{
                background: store.accessibilityMode ? 'var(--accent)' : 'var(--chip)',
                color: store.accessibilityMode ? 'var(--accent-ink)' : 'var(--muted)',
                minHeight: 44, minWidth: 44,
              }}
            >
              <Accessibility size={16} aria-hidden />
            </button>
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{
                background: store.wsConnected ? '#DCFCE7' : '#FEE2E2',
                color: store.wsConnected ? '#15803D' : '#B91C1C',
              }}>
              {store.wsConnected ? <Wifi size={11} aria-hidden /> : <WifiOff size={11} aria-hidden />}
              {store.wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>
      )}

      {/* Offline banner */}
      {store.offline && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ background: '#FEF3C7', color: '#92400E', borderBottom: '1px solid #FDE68A' }}
          role="status">
          <ZoneOff size={14} aria-hidden />
          {getUIString(lang, 'offlineBanner')}
        </div>
      )}

      {/* Chat */}
      <ChatThread messages={store.messages} loading={loading} accessible={store.accessibilityMode} />

      {/* Chips (shown when no messages yet) */}
      {store.messages.length === 0 && (
        <SampleChips onSelect={sendMessage} disabled={loading} />
      )}

      {/* Input bar */}
      <div className="px-3 py-3" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <TicketSnap onTicket={handleTicket} />

          <button
            onClick={() => store.setOffline(!store.offline)}
            aria-pressed={store.offline}
            aria-label="Simulate stadium dead zone"
            className="px-2 py-2 rounded-lg text-xs font-medium"
            style={{
              background: store.offline ? '#FEF3C7' : 'var(--chip)',
              color: store.offline ? '#92400E' : 'var(--muted)',
              border: '1px solid var(--border)',
              minHeight: 44,
              whiteSpace: 'nowrap',
            }}
            title="Simulate dead zone"
          >
            {store.offline ? 'Online' : 'Dead zone'}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={getUIString(lang, 'placeholder')}
            disabled={loading}
            aria-label="Message input"
            className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              minHeight: 44,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="p-3 rounded-xl transition-colors"
            style={{
              background: input.trim() ? 'var(--accent)' : 'var(--chip)',
              color: input.trim() ? 'var(--accent-ink)' : 'var(--muted)',
              minHeight: 44, minWidth: 44,
            }}
          >
            <Send size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
