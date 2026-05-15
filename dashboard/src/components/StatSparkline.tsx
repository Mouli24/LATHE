interface StatSparklineProps {
  series: number[]
  color?: string
  height?: number
  dotted?: boolean
}

export function StatSparkline({ series, color = "#a78bfa", height = 32, dotted = false }: StatSparklineProps) {
  if (!series || series.length < 2) {
    return <div style={{ height }} />
  }

  const W = 80
  const H = height
  const pad = 2
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1

  const pts = series.map((v, i) => [
    pad + (i / (series.length - 1)) * (W - 2 * pad),
    H - pad - ((v - min) / range) * (H - 2 * pad),
  ])

  const d = pts.reduce((acc, pt, i) => {
    return acc + (i === 0 ? `M ${pt[0]},${pt[1]}` : ` L ${pt[0]},${pt[1]}`)
  }, "")

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dotted ? "2 3" : undefined}
        opacity="0.85"
      />
    </svg>
  )
}
