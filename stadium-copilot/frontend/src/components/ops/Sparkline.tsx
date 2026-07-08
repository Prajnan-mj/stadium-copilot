interface Props {
  data: number[]
  status: 'ok' | 'watch' | 'critical'
  width?: number
  height?: number
}

const STATUS_COLOR = { ok: '#2DD4A7', watch: '#FBBF24', critical: '#FF5A5A' }

export default function Sparkline({ data, status, width = 84, height = 30 }: Props) {
  if (!data.length) return <svg width={width} height={height} aria-hidden />
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = height - (v / max) * (height - 3) - 1.5
    return [x, y] as const
  })
  const color = STATUS_COLOR[status]
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${pts[0][0]},${height} ${line} ${pts[pts.length - 1][0]},${height}`
  const gid = `spark-${status}`

  return (
    <svg width={width} height={height} aria-hidden style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  )
}
