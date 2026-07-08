interface Props {
  data: number[]
  status: 'ok' | 'watch' | 'critical'
  width?: number
  height?: number
}

const STATUS_COLOR = { ok: '#22C55E', watch: '#F59E0B', critical: '#EF4444' }

export default function Sparkline({ data, status, width = 80, height = 28 }: Props) {
  if (!data.length) return <svg width={width} height={height} />
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = height - (v / max) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const color = STATUS_COLOR[status]
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
