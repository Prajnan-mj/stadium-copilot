import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

// Bundled sample ticket SVGs as base64
const SAMPLE_TICKETS = [
  {
    label: 'NJY — Section 134 Row 12',
    // Simple SVG ticket image
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="400" height="200" rx="12" fill="#1a2744"/>
      <rect x="0" y="0" width="400" height="60" rx="12" fill="#0B7A3B"/>
      <text x="200" y="38" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="white">FIFA WORLD CUP 2026</text>
      <text x="200" y="90" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" fill="#93c5fd">New York New Jersey Stadium</text>
      <text x="200" y="115" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="#e2e8f0">FIFA World Cup Final · July 19, 2026</text>
      <rect x="20" y="135" width="110" height="45" rx="6" fill="#ffffff11"/>
      <text x="75" y="153" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#93c5fd">SECTION</text>
      <text x="75" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="white">134</text>
      <rect x="145" y="135" width="110" height="45" rx="6" fill="#ffffff11"/>
      <text x="200" y="153" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#93c5fd">ROW</text>
      <text x="200" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="white">12</text>
      <rect x="270" y="135" width="110" height="45" rx="6" fill="#ffffff11"/>
      <text x="325" y="153" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#93c5fd">SEAT</text>
      <text x="325" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="white">8</text>
    </svg>`,
  },
  {
    label: 'MIA — Section 306 Row 3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="400" height="200" rx="12" fill="#1a1a2e"/>
      <rect x="0" y="0" width="400" height="60" rx="12" fill="#c2410c"/>
      <text x="200" y="38" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="white">FIFA WORLD CUP 2026</text>
      <text x="200" y="90" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" fill="#fdba74">Hard Rock Stadium · Miami</text>
      <text x="200" y="115" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="#e2e8f0">3rd Place Match · July 18, 2026</text>
      <rect x="20" y="135" width="110" height="45" rx="6" fill="#ffffff11"/>
      <text x="75" y="153" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#fdba74">SECTION</text>
      <text x="75" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="white">306</text>
      <rect x="145" y="135" width="110" height="45" rx="6" fill="#ffffff11"/>
      <text x="200" y="153" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#fdba74">ROW</text>
      <text x="200" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="white">3</text>
      <rect x="270" y="135" width="110" height="45" rx="6" fill="#ffffff11"/>
      <text x="325" y="153" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#fdba74">SEAT</text>
      <text x="325" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="white">21</text>
    </svg>`,
  },
]

function svgToBase64(svg: string): string {
  return btoa(unescape(encodeURIComponent(svg)))
}

interface Props {
  onTicket: (base64: string) => void
}

export default function TicketSnap({ onTicket }: Props) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSample(svg: string) {
    const b64 = svgToBase64(svg)
    onTicket(b64)
    close()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const b64 = result.split(',')[1]
      onTicket(b64)
      close()
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="pill px-3 py-2 text-xs font-semibold pressable"
        style={{
          background: 'var(--chip)',
          border: '1px solid var(--border)',
          color: 'var(--ink)',
          minHeight: 40,
        }}
        aria-label="Snap your ticket to find your seat"
      >
        <Camera size={14} style={{ color: 'var(--brand)' }} aria-hidden />
        Snap ticket
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 animate-fadein"
          style={{ background: 'rgba(8,12,10,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div ref={dialogRef} className="w-full max-w-sm rounded-2xl p-5 animate-rise"
            role="dialog"
            aria-modal="true"
            aria-label="Ticket scanner"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e4)', outline: 'none' }}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
                  <Camera size={18} aria-hidden />
                </span>
                <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>Scan your ticket</h2>
              </div>
              <button onClick={close} aria-label="Close"
                className="rounded-lg flex items-center justify-center pressable"
                style={{ height: 36, width: 36, color: 'var(--muted)', background: 'var(--surface-2)' }}>
                <X size={17} aria-hidden />
              </button>
            </div>

            <p className="text-sm mb-4 mt-2" style={{ color: 'var(--muted)' }}>
              We'll read your section instantly with vision AI. Try a bundled sample:
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {SAMPLE_TICKETS.map(t => (
                <button
                  key={t.label}
                  onClick={() => handleSample(t.svg)}
                  className="flex items-center gap-3 text-left px-3.5 py-3 rounded-xl text-sm font-medium pressable"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', minHeight: 48 }}
                >
                  <TicketGlyph />
                  <span className="flex-1">{t.label}</span>
                </button>
              ))}
            </div>

            <label
              htmlFor="ticket-upload"
              className="pill w-full justify-center px-4 py-3 text-sm font-semibold cursor-pointer pressable"
              style={{ background: 'var(--brand-grad)', color: 'var(--accent-ink)', boxShadow: 'var(--glow-brand)', minHeight: 48 }}
            >
              <Camera size={16} aria-hidden />
              Upload my ticket image
            </label>
            <input
              id="ticket-upload"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
              aria-label="Upload ticket image"
            />
          </div>
        </div>
      )}
    </>
  )
}

function TicketGlyph() {
  return (
    <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 6v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-6V8Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15 6v12" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
      </svg>
    </span>
  )
}
