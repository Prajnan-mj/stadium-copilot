import { useEffect, useRef } from 'react'
import { Message } from '../../lib/store'
import MessageBubble from './MessageBubble'

interface Props {
  messages: Message[]
  loading: boolean
  accessible: boolean
}

export default function ChatThread({ messages, loading, accessible }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-4xl mb-3" aria-hidden>🏟</div>
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Welcome to Stadium Copilot
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Ask anything about the venue — or tap a chip below to try a sample.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2" aria-live="polite" aria-label="Chat messages">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} accessible={accessible} />
      ))}
      {loading && (
        <div className="flex justify-start mx-2 my-1">
          <div className="px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px' }}>
            <span className="flex gap-1" aria-label="Thinking…">
              {[0, 1, 2].map(i => (
                <span key={i} className="block w-2 h-2 rounded-full"
                  style={{
                    background: 'var(--muted)',
                    animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
              ))}
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          span[style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
