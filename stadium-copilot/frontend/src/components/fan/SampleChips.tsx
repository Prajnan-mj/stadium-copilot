import { SAMPLE_CHIPS } from '../../lib/i18nStrings'
import { Sparkles } from 'lucide-react'

interface Props {
  onSelect: (text: string) => void
  disabled?: boolean
}

export default function SampleChips({ onSelect, disabled }: Props) {
  return (
    <div className="px-3 pb-1" role="group" aria-label="Sample questions">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={12} style={{ color: 'var(--brand)' }} aria-hidden />
        <span className="eyebrow">Try asking</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {SAMPLE_CHIPS.map(chip => (
          <button
            key={chip.lang}
            onClick={() => !disabled && onSelect(chip.text)}
            disabled={disabled}
            aria-label={`Ask in ${chip.lang}: ${chip.text}`}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-medium pressable flex-shrink-0"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--e1)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              minHeight: 38,
            }}
          >
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
              {chip.flag}
            </span>
            <span className="text-xs whitespace-nowrap">{chip.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
