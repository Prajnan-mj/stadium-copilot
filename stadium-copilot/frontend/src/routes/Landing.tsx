import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, LayoutDashboard, Globe, MapPin, Accessibility,
  Users, Zap, Leaf, ArrowRight, Play,
} from 'lucide-react'

const CATEGORIES = [
  { icon: Globe, label: 'Multilingual' },
  { icon: MapPin, label: 'Navigation' },
  { icon: Accessibility, label: 'Accessibility' },
  { icon: Users, label: 'Crowd Management' },
  { icon: Zap, label: 'Operational Intel' },
  { icon: Leaf, label: 'Sustainability' },
]

const FAN_PILLS = [
  { icon: Globe, label: 'Multilingual' },
  { icon: MapPin, label: 'Navigation' },
  { icon: Accessibility, label: 'Accessible' },
]
const OPS_PILLS = ['Live Density', 'AI Dispatch', 'Fan Alerts']

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--surface)' }}>
      {/* Top nav */}
      <header className="relative z-20 flex items-center justify-between px-5 sm:px-7 h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 pressable" aria-label="Stadium Copilot home">
            <Logo />
            <span className="font-bold text-[15px] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Stadium&nbsp;Copilot
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            <Tab label="Home" active onClick={() => navigate('/')} />
            <Tab label="Fan Copilot" onClick={() => navigate('/fan')} />
            <Tab label="Ops Center" onClick={() => navigate('/ops')} />
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline" style={{ color: 'var(--muted)' }}>MetLife Stadium</span>
          <a href="https://github.com/Prajnan-mj/stadium-copilot" target="_blank" rel="noopener noreferrer"
            className="font-semibold pressable" style={{ color: 'var(--ink)' }}>
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Hero — split two-column */}
      <main className="relative z-10 flex-1 grid lg:grid-cols-2">
        {/* Left — pitch */}
        <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-14"
          style={{ background: 'var(--surface-2)' }}>
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase mb-7 animate-rise"
              style={{ color: 'var(--brand)' }}>
              <span className="livedot" style={{ color: 'var(--brand)', width: 7, height: 7 }} />
              FIFA World Cup 2026 · Live Demo
            </span>

            <h1 className="text-5xl xl:text-6xl font-bold leading-[1.03] tracking-tight mb-7 animate-rise"
              style={{ fontFamily: 'var(--font-display)', animationDelay: '40ms' }}>
              One venue brain.
              <br />
              <span style={{ color: 'var(--brand-strong)' }}>Two connected surfaces.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-9 animate-rise"
              style={{ color: 'var(--muted)', animationDelay: '90ms' }}>
              A multilingual fan assistant giving grounded, routable, accessibility-aware
              answers — wired to an ops command center that turns crowd-density signals into
              one-click dispatches.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-14 animate-rise" style={{ animationDelay: '140ms' }}>
              <button
                onClick={() => navigate('/ops')}
                className="pill px-6 py-3.5 text-base font-semibold pressable"
                style={{ background: 'var(--brand-strong)', color: '#fff', boxShadow: 'var(--glow-brand)' }}
                aria-label="Run the guided 90-second demo"
              >
                <Play size={17} fill="currentColor" aria-hidden />
                Run the 90-second demo
              </button>
              <button
                onClick={() => navigate('/ops')}
                className="pill px-6 py-3.5 text-base font-semibold pressable"
                style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border-strong)' }}
                aria-label="View Ops Center"
              >
                View Ops Center
              </button>
            </div>

            <div className="animate-rise" style={{ animationDelay: '190ms' }}>
              <p className="eyebrow mb-3">All 6 Challenge-4 categories · one shared intelligence layer</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {CATEGORIES.map(({ icon: Icon, label }, i) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: 'var(--muted)' }}>
                    <Icon size={14} style={{ color: 'var(--brand)' }} aria-hidden />
                    {label}
                    {i < CATEGORIES.length - 1 && <span className="ml-3" style={{ color: 'var(--border-strong)' }}>·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — two surface cards */}
        <div className="flex flex-col justify-center gap-5 px-6 sm:px-12 lg:px-14 xl:px-16 py-14"
          style={{ background: 'var(--surface)' }}>
          {/* Fan Copilot */}
          <button
            onClick={() => navigate('/fan')}
            className="group flex items-start gap-4 p-7 text-left lift animate-rise"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--e2)', animationDelay: '160ms' }}
            aria-label="Open Fan Copilot"
          >
            <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)', borderRadius: 'var(--r-md)' }}>
              <MessageCircle size={22} aria-hidden />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>Fan Copilot</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" style={{ color: 'var(--brand)' }} aria-hidden />
              </div>
              <p className="text-[15px] leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
                Ask anything in any language — step-free routes, facilities, transit and live alerts.
              </p>
              <div className="flex flex-wrap gap-2">
                {FAN_PILLS.map(({ icon: Icon, label }) => (
                  <span key={label} className="pill px-3 py-1.5 text-[13px] font-medium"
                    style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <Icon size={13} style={{ color: 'var(--brand)' }} aria-hidden />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Ops Center — dark */}
          <button
            onClick={() => navigate('/ops')}
            className="group relative flex items-start gap-4 p-7 text-left lift overflow-hidden animate-rise"
            style={{ background: '#08160E', border: '1px solid #16351F', borderRadius: 'var(--r-xl)', boxShadow: '0 12px 32px rgba(4,20,10,0.35)', animationDelay: '210ms' }}
            aria-label="Open Ops Command Center"
          >
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--brand-grad)' }} />
            <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,194,90,0.14)', color: '#3BE382', borderRadius: 'var(--r-md)' }}>
              <LayoutDashboard size={22} aria-hidden />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)', color: '#EAF5EC' }}>Ops Center</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" style={{ color: '#3BE382' }} aria-hidden />
              </div>
              <p className="text-[15px] leading-relaxed mb-4" style={{ color: '#8AA592' }}>
                Live crowd density, AI dispatch cards and one-click fan notifications.
              </p>
              <div className="flex flex-wrap gap-2">
                {OPS_PILLS.map(label => (
                  <span key={label} className="pill px-3 py-1.5 text-[13px] font-medium"
                    style={{ background: 'rgba(0,194,90,0.08)', color: '#3BE382', border: '1px solid rgba(0,194,90,0.28)' }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </button>

          <p className="text-center text-[13px] mt-3" style={{ color: 'var(--faint)' }}>
            Built for Google PromptWars Virtual — Challenge 4 · MetLife Stadium · Hard Rock Stadium
          </p>
        </div>
      </main>
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 text-sm font-medium pressable"
      style={{
        borderRadius: 'var(--r-md)',
        background: active ? 'var(--surface-2)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--muted)',
      }}
    >
      {label}
    </button>
  )
}

function Logo() {
  return (
    <span className="w-8 h-8 flex items-center justify-center" style={{ background: 'var(--brand-grad)', borderRadius: 'var(--r-md)', boxShadow: 'var(--glow-brand)' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
        <ellipse cx="12" cy="12" rx="10" ry="7" stroke="white" strokeWidth="1.8" />
        <ellipse cx="12" cy="12" rx="4" ry="7" stroke="white" strokeWidth="1.4" opacity="0.75" />
        <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.4" opacity="0.75" />
      </svg>
    </span>
  )
}
