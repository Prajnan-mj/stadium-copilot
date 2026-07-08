import { useState } from 'react'
import { sendAnnouncement } from '../../lib/api'
import { Megaphone, Send, CheckCircle2, Languages } from 'lucide-react'

interface Props { venueId: string }

export default function AnnounceComposer({ venueId }: Props) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [count, setCount] = useState(0)

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await sendAnnouncement(venueId, text.trim())
      setCount(res.delivery_count)
      setSent(true)
      setText('')
      setTimeout(() => setSent(false), 4000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2.5">
        <Megaphone size={13} style={{ color: 'var(--accent)' }} aria-hidden />
        <span className="eyebrow" style={{ letterSpacing: '0.1em' }}>Announce to All Fans</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
          <Languages size={11} aria-hidden /> Auto-translate ↗
        </span>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-sm py-2 mt-auto animate-rise" style={{ color: 'var(--ok)' }} role="status">
          <CheckCircle2 size={16} aria-hidden />
          <span>Sent to <strong className="tnum">{count}</strong> fan session{count !== 1 ? 's' : ''} — translated per language</span>
        </div>
      ) : (
        <div className="flex gap-2 mt-auto items-center rounded-xl pl-3 pr-1.5 py-1.5"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type an announcement…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--ink)', minHeight: 38 }}
            aria-label="Announcement text"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="rounded-lg flex items-center justify-center pressable"
            style={{
              background: text.trim() ? 'var(--accent)' : 'var(--surface)',
              color: text.trim() ? '#08111a' : 'var(--faint)',
              height: 38, width: 38, flexShrink: 0,
            }}
            aria-label="Send announcement to all fans"
          >
            <Send size={15} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
