import { useOpsStore } from '../../lib/store'
import { Smartphone, X } from 'lucide-react'

interface Props { venueId: string }

export default function PhonePreview({ venueId }: Props) {
  const { previewOpen, setPreviewOpen } = useOpsStore()

  if (!previewOpen) {
    return (
      <button
        onClick={() => setPreviewOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', minHeight: 44 }}
        aria-label="Show fan phone preview"
      >
        <Smartphone size={14} aria-hidden />
        Fan preview
      </button>
    )
  }

  const fanUrl = `/fan?embed=1&venue=${venueId}`

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col"
      style={{ width: 300 }}
      role="complementary"
      aria-label="Fan phone preview panel"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
          <Smartphone size={12} aria-hidden />
          Fan Preview
        </div>
        <button
          onClick={() => setPreviewOpen(false)}
          aria-label="Close fan preview"
          style={{ minHeight: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
        >
          <X size={13} aria-hidden />
        </button>
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto rounded-3xl overflow-hidden shadow-2xl"
        style={{
          width: 260,
          height: 520,
          border: '7px solid #232B3D',
          background: '#000',
        }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 rounded-b-xl z-10"
          style={{ background: '#232B3D' }} />
        <iframe
          src={fanUrl}
          className="w-full h-full border-0"
          title="Fan Copilot preview"
          aria-label="Live fan phone preview"
          style={{ background: '#FAFAF8' }}
        />
      </div>
    </div>
  )
}
