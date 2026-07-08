import { useEffect, useRef } from 'react'
import { MapPin, Languages, Accessibility, Train } from 'lucide-react'
import { Message } from '../../lib/store'
import MessageBubble from './MessageBubble'

interface Props {
  messages: Message[]
  loading: boolean
  accessible: boolean
}

const HINTS = [
  { icon: Languages, text: 'Ask in any language' },
  { icon: MapPin, text: 'Get walking routes' },
  { icon: Accessibility, text: 'Step-free options' },
  { icon: Train, text: 'Transit & exits' },
]

export default function ChatThread({ messages, loading, accessible }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-rise"
          style={{ background: 'var(--brand-grad)', boxShadow: 'var(--glow-brand)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <ellipse cx="12" cy="12" rx="10" ry="7" stroke="white" strokeWidth="1.8" />
            <ellipse cx="12" cy="12" rx="4" ry="7" stroke="white" strokeWidth="1.4" opacity="0.75" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.4" opacity="0.75" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-1.5 animate-rise" style={{ fontFamily: 'var(--font-display)', animationDelay: '50ms' }}>
          How can I help at the match?
        </h2>
        <p className="text-sm mb-6 max-w-xs animate-rise" style={{ color: 'var(--muted)', animationDelay: '100ms' }}>
          Your grounded venue guide — snap a ticket, or tap a sample below to try it.
        </p>
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs animate-rise" style={{ animationDelay: '150ms' }}>
          {HINTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Icon size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} aria-hidden />
              <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-6" aria-live="polite" aria-label="Chat messages">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} accessible={accessible} />
      ))}
      {loading && (
        <div className="flex justify-start my-2.5">
          <div className="px-4 py-3.5 flex items-center gap-1.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--e1)' }}
            aria-label="Thinking…">
            {[0, 1, 2].map(i => (
              <span key={i} className="block w-2 h-2 rounded-full"
                style={{ background: 'var(--brand)', animation: `typingdot 1.2s ease-in-out ${i * 0.16}s infinite` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
      </div>
    </div>
  )
}
