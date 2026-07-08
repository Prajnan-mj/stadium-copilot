import { useState } from 'react'
import { sendAnnouncement } from '../../lib/api'
import { Radio, Send, CheckCircle } from 'lucide-react'

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
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Radio size={13} style={{ color: 'var(--accent)' }} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Announce to All Fans
        </span>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--ok)' }}>
          <CheckCircle size={14} aria-hidden />
          Sent to {count} fan session{count !== 1 ? 's' : ''} — translated automatically
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type an announcement..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: '#1E2533',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              minHeight: 44,
            }}
            aria-label="Announcement text"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="px-3 py-2 rounded-lg"
            style={{
              background: text.trim() ? 'var(--accent)' : '#1E2533',
              color: text.trim() ? '#fff' : 'var(--muted)',
              minHeight: 44, minWidth: 44,
            }}
            aria-label="Send announcement to all fans"
          >
            <Send size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
