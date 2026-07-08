import { SAMPLE_CHIPS } from '../../lib/i18nStrings'

interface Props {
  onSelect: (text: string) => void
  disabled?: boolean
}

export default function SampleChips({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-2 py-2" role="group" aria-label="Sample questions">
      {SAMPLE_CHIPS.map(chip => (
        <button
          key={chip.lang}
          onClick={() => !disabled && onSelect(chip.text)}
          disabled={disabled}
          aria-label={`Ask in ${chip.lang}: ${chip.text}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={{
            background: 'var(--chip)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            minHeight: '44px',
          }}
        >
          <span className="text-xs font-bold rounded px-1"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: '9px', letterSpacing: '0.05em' }}>
            {chip.flag}
          </span>
          <span className="text-xs truncate max-w-[160px]">{chip.text}</span>
        </button>
      ))}
    </div>
  )
}
