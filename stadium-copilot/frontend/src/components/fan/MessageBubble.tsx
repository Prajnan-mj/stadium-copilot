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
      <div className="mx-3 my-2 rounded-2xl overflow-hidden animate-rise" role="alert"
        style={{ background: 'var(--alert-soft)', border: '1px solid rgba(196,43,35,0.22)', boxShadow: 'var(--e1)' }}>
        <div className="flex items-center gap-2 px-3.5 py-2" style={{ background: 'rgba(196,43,35,0.08)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--alert)' }} aria-hidden />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--alert)' }}>Ops Alert</span>
        </div>
        <div className="px-3.5 py-3">
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{message.text}</div>
          {message.route && (
            <div className="mt-2.5"><VenueMap route={message.route} accessible={accessible} /></div>
          )}
        </div>
      </div>
    )
  }

  if (message.isAnnouncement) {
    return (
      <div className="mx-3 my-2 rounded-2xl overflow-hidden animate-rise"
        style={{ background: 'var(--info-soft)', border: '1px solid rgba(37,99,235,0.2)', boxShadow: 'var(--e1)' }}>
        <div className="flex items-center gap-2 px-3.5 py-2" style={{ background: 'rgba(37,99,235,0.07)' }}>
          <Radio size={15} style={{ color: 'var(--info)' }} aria-hidden />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--info)' }}>Stadium Announcement</span>
        </div>
        <div className="px-3.5 py-3" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{message.text}</div>
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col my-2.5 animate-rise', isUser ? 'items-end' : 'items-start')}>
      <div
        className="px-4 py-3 text-sm"
        style={{
          background: isUser ? 'var(--brand-grad)' : 'var(--surface)',
          color: isUser ? 'var(--accent-ink)' : 'var(--ink)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          boxShadow: isUser ? 'var(--glow-brand)' : 'var(--e1)',
          maxWidth: '82%',
          lineHeight: 1.5,
        }}
      >
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p>

        {(message.source === 'cache' || (message.lang && message.lang !== 'en')) && (
          <div className="flex items-center gap-2 mt-1.5 pt-1.5"
            style={{ borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.22)' : 'var(--border)'}` }}>
            {message.source === 'cache' && (
              <span className="text-[11px] flex items-center gap-1 font-medium"
                style={{ color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--faint)' }}>
                <Database size={10} aria-hidden /> Cached
              </span>
            )}
            {message.lang && message.lang !== 'en' && (
              <span className="text-[11px] uppercase font-bold tracking-wide"
                style={{ color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--faint)' }}>
                {message.lang}
              </span>
            )}
          </div>
        )}
      </div>

      {!isUser && message.route && (
        <div className="mt-1.5" style={{ maxWidth: '90%', width: '100%' }}>
          <VenueMap route={message.route} accessible={accessible} />
        </div>
      )}
    </div>
  )
}
