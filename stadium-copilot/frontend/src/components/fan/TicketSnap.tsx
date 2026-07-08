import { useRef, useState } from 'react'
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

  function handleSample(svg: string) {
    const b64 = svgToBase64(svg)
    onTicket(b64)
    setOpen(false)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const b64 = result.split(',')[1]
      onTicket(b64)
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
        style={{
          background: 'var(--chip)',
          border: '1px solid var(--border)',
          color: 'var(--ink)',
          minHeight: '44px',
        }}
        aria-label="Snap your ticket to find your seat"
      >
        <Camera size={15} aria-hidden />
        Snap ticket
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Ticket scanner"
        >
          <div className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-display)' }}>Scan your ticket</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} aria-hidden />
              </button>
            </div>

            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Use a bundled sample or upload your own:</p>

            <div className="flex flex-col gap-2 mb-4">
              {SAMPLE_TICKETS.map(t => (
                <button
                  key={t.label}
                  onClick={() => handleSample(t.svg)}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--chip)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    minHeight: '44px',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <label
                htmlFor="ticket-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  minHeight: '44px',
                  display: 'flex',
                }}
              >
                <Camera size={15} aria-hidden />
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
        </div>
      )}
    </>
  )
}
