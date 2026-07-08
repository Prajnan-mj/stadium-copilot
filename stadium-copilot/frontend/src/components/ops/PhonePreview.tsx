import { useOpsStore } from '../../lib/store'
import { Smartphone, X } from 'lucide-react'

interface Props { venueId: string }

export default function PhonePreview({ venueId }: Props) {
  const { previewOpen, setPreviewOpen } = useOpsStore()

  if (!previewOpen) {
    return (
      <button
        onClick={() => setPreviewOpen(true)}
        className="pill fixed bottom-4 right-4 z-50 px-3.5 py-2.5 text-sm font-semibold pressable"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', boxShadow: 'var(--e3)', minHeight: 44 }}
        aria-label="Show fan phone preview"
      >
        <Smartphone size={15} style={{ color: 'var(--accent)' }} aria-hidden />
        Fan preview
      </button>
    )
  }

  const fanUrl = `/fan?embed=1&venue=${venueId}`

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col animate-rise"
      style={{ width: 292 }}
      role="complementary"
      aria-label="Fan phone preview panel"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
          <span className="livedot" style={{ color: 'var(--ok)', width: 6, height: 6 }} />
          Live fan phone
        </div>
        <button
          onClick={() => setPreviewOpen(false)}
          aria-label="Close fan preview"
          className="rounded-lg flex items-center justify-center pressable"
          style={{ height: 30, width: 30, color: 'var(--muted)', background: 'var(--surface-2)' }}
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto rounded-[2.2rem] overflow-hidden"
        style={{
          width: 264, height: 528,
          border: '8px solid #171F2E',
          background: '#000',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.15)',
        }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full z-10 flex items-center justify-center gap-1.5"
          style={{ background: '#0b0f18' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2a3448' }} />
          <span className="w-6 h-1 rounded-full" style={{ background: '#2a3448' }} />
        </div>
        <iframe
          src={fanUrl}
          className="w-full h-full border-0"
          title="Fan Copilot preview"
          aria-label="Live fan phone preview"
          style={{ background: '#F6F8F5' }}
        />
      </div>
    </div>
  )
}
