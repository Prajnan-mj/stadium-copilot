import { Message } from '../../lib/store'
import { AlertTriangle, Radio, Database } from 'lucide-react'
import VenueMap from './VenueMap'
import clsx from 'clsx'

interface Props {
  message: Message
  accessible: boolean
}

export default function MessageBubble({ message, accessible }: Props) {
  const isUser = message.role === 'user'

  if (message.isAlert) {
    return (
      <div className="mx-2 my-2 p-3 rounded-xl flex gap-2"
        style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        role="alert">
        <AlertTriangle size={16} style={{ color: '#B4231F', flexShrink: 0, marginTop: 2 }} aria-hidden />
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#B4231F' }}>Ops Alert</div>
          <div style={{ fontSize: '14px', color: '#101418' }}>{message.text}</div>
          {message.route && (
            <div className="mt-2">
              <VenueMap route={message.route} accessible={accessible} />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (message.isAnnouncement) {
    return (
      <div className="mx-2 my-2 p-3 rounded-xl flex gap-2"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <Radio size={16} style={{ color: '#4F8CFF', flexShrink: 0, marginTop: 2 }} aria-hidden />
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#4F8CFF' }}>Stadium Announcement</div>
          <div style={{ fontSize: '14px', color: '#101418' }}>{message.text}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start', 'mx-2 my-1')}>
      <div
        className="max-w-xs rounded-2xl px-4 py-3 text-sm"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--surface)',
          color: isUser ? 'var(--accent-ink)' : 'var(--ink)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          maxWidth: '78%',
        }}
      >
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p>

        <div className="flex items-center gap-2 mt-1">
          {message.source === 'cache' && (
            <span className="text-xs flex items-center gap-1"
              style={{ color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>
              <Database size={10} aria-hidden /> cached
            </span>
          )}
          {message.lang && message.lang !== 'en' && (
            <span className="text-xs uppercase"
              style={{ color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>
              {message.lang}
            </span>
          )}
        </div>
      </div>

      {!isUser && message.route && (
        <div className="w-full px-2 mt-1 max-w-xs" style={{ marginLeft: '0.5rem' }}>
          <VenueMap route={message.route} accessible={accessible} />
        </div>
      )}
    </div>
  )
}
