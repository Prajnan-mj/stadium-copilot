import { useNavigate } from 'react-router-dom'
import { MessageCircle, LayoutDashboard, Globe, MapPin, Shield, Users, Zap, Leaf } from 'lucide-react'

const CATEGORIES = [
  { icon: <Globe size={14} aria-hidden />, label: 'Multilingual' },
  { icon: <MapPin size={14} aria-hidden />, label: 'Navigation' },
  { icon: <Shield size={14} aria-hidden />, label: 'Accessibility' },
  { icon: <Users size={14} aria-hidden />, label: 'Crowd Management' },
  { icon: <Zap size={14} aria-hidden />, label: 'Operational Intelligence' },
  { icon: <Leaf size={14} aria-hidden />, label: 'Sustainability' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ background: 'var(--chip)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
            FIFA World Cup 2026
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
          Stadium Copilot
        </h1>

        <p className="text-lg max-w-xl mb-2" style={{ color: 'var(--muted)' }}>
          One venue-intelligence layer. Two surfaces.
        </p>
        <p className="text-base max-w-2xl mb-10" style={{ color: 'var(--muted)' }}>
          A multilingual fan assistant that gives grounded, routable, accessibility-aware answers —
          connected to an ops dashboard that turns crowd-density signals into one-click dispatches,
          which instantly become translated alerts on every fan's phone.
        </p>

        {/* CTA cards */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-xl mb-8">
          <button
            onClick={() => navigate('/fan')}
            className="flex flex-col items-start p-5 rounded-2xl text-left transition-all group"
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--accent)',
              minHeight: 120,
            }}
            aria-label="Open Fan Copilot"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={20} style={{ color: 'var(--accent)' }} aria-hidden />
              <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                Fan Copilot
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Ask anything in any language — routes, facilities, transit, accessibility
            </p>
          </button>

          <button
            onClick={() => navigate('/ops')}
            className="flex flex-col items-start p-5 rounded-2xl text-left transition-all"
            style={{
              background: '#0B0E14',
              border: '2px solid #232B3D',
              minHeight: 120,
            }}
            aria-label="Open Ops Copilot"
          >
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard size={20} style={{ color: '#4F8CFF' }} aria-hidden />
              <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: '#E6EAF2' }}>
                Ops Copilot
              </span>
            </div>
            <p className="text-sm" style={{ color: '#8A93A6' }}>
              Live crowd density, AI dispatch cards, one-click fan notifications
            </p>
          </button>
        </div>

        {/* Demo button */}
        <button
          onClick={() => navigate('/ops')}
          className="px-8 py-3 rounded-xl font-semibold text-base mb-12 transition-all"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            minHeight: 52,
            boxShadow: '0 4px 24px rgba(11,122,59,0.25)',
          }}
          aria-label="Run the 90-second demo"
        >
          Run the 90-second demo
        </button>

        {/* Category coverage */}
        <div className="w-full max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            All 6 Challenge-4 categories from one shared venue-intelligence layer
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(c => (
              <span
                key={c.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ background: 'var(--chip)', color: 'var(--ink)', border: '1px solid var(--border)' }}
              >
                {c.icon}
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 flex items-center justify-between text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
        <span>Built for Google PromptWars Virtual — Challenge 4</span>
        <a
          href="https://github.com"
          className="underline"
          style={{ color: 'var(--accent)' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}
