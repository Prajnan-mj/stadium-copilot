import { useEffect, useRef, useState } from 'react'
import { triggerScenario } from '../../lib/api'
import { Play, X } from 'lucide-react'

interface Step {
  caption: string
  action: () => Promise<void> | void
  delay: number
}

interface Props {
  venueId: string
  onComplete?: () => void
}

export default function GuidedDemo({ venueId, onComplete }: Props) {
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [caption, setCaption] = useState('')
  const abortRef = useRef(false)

  const steps: Step[] = [
    {
      caption: '1/5 — Navigating to Fan Copilot...',
      action: () => {},
      delay: 1500,
    },
    {
      caption: '2/5 — Tapping the Portuguese chip to ask about the accessible restroom...',
      action: () => {
        const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Fan Copilot preview"]')
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'demo_chip', lang: 'pt' }, '*')
        }
      },
      delay: 3000,
    },
    {
      caption: '3/5 — Triggering halftime surge in Gate C...',
      action: () => triggerScenario(venueId, 'halftime_surge', 5),
      delay: 4000,
    },
    {
      caption: '4/5 — Gate C reaching critical — AI dispatch card generated. Approving now...',
      action: () => {},
      delay: 5000,
    },
    {
      caption: '5/5 — Alert delivered to fan phone in their language. Demo complete!',
      action: () => {},
      delay: 3000,
    },
  ]

  async function runDemo() {
    abortRef.current = false
    setRunning(true)
    setStep(0)

    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) break
      setStep(i)
      setCaption(steps[i].caption)
      await steps[i].action()
      await new Promise(r => setTimeout(r, steps[i].delay))
    }

    setRunning(false)
    setCaption('')
    onComplete?.()
  }

  function stop() {
    abortRef.current = true
    setRunning(false)
    setCaption('')
  }

  if (!running) {
    return (
      <button
        onClick={runDemo}
        className="pill px-4 py-2 text-sm font-bold pressable"
        style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', minHeight: 40 }}
        aria-label="Run the 90-second guided demo"
      >
        <Play size={14} aria-hidden />
        Run 90s demo
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass animate-rise"
      style={{ border: '1px solid var(--accent)', boxShadow: '0 0 24px rgba(56,189,248,0.18)', maxWidth: 460 }}>
      <span className="livedot flex-shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
      <p className="text-sm flex-1 font-medium" style={{ color: 'var(--ink)' }}>{caption}</p>
      <div className="flex gap-1" aria-hidden>
        {steps.map((_, i) => (
          <div key={i} className="h-1.5 rounded-full transition-all"
            style={{ width: i === step ? 14 : 6, background: i <= step ? 'var(--accent)' : 'var(--border-strong)' }} />
        ))}
      </div>
      <button
        onClick={stop}
        className="rounded-lg flex items-center justify-center pressable"
        style={{ color: 'var(--muted)', height: 30, width: 30, background: 'var(--surface-2)' }}
        aria-label="Skip demo"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}
