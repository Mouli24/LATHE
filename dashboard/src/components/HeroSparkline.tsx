interface HeroSparklineProps {
  series: number[]
  color?: string
  trend?: "up" | "down" | "queued"
  height?: number
}

function catmullRomToBezier(points: [number, number][]): string {
  if (points.length < 2) return ""
  const d: string[] = [`M ${points[0][0]},${points[0][1]}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`)
  }
  return d.join(" ")
}

export function HeroSparkline({
  series,
  color = "#a78bfa",
  trend: _trend = "up",
  height = 64,
}: HeroSparklineProps) {
  if (!series || series.length < 2) {
    return <div style={{ height }} />
  }

  const W = 220
  const H = height
  const pad = 4
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1

  const pts: [number, number][] = series.map((v, i) => [
    pad + (i / (series.length - 1)) * (W - 2 * pad),
    H - pad - ((v - min) / range) * (H - 2 * pad),
  ])

  const linePath = catmullRomToBezier(pts)
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1][0]},${H} L ${pts[0][0]},${H} Z`

  // milestone: last point
  const lastPt = pts[pts.length - 1]

  const gradId = `hsg-${color.replace("#", "")}`
  const glowId = `hsg-glow-${color.replace("#", "")}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.00" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* glow line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
        opacity="0.7"
      />

      {/* crisp line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* milestone dot */}
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill={color} />
      <circle
        cx={lastPt[0]}
        cy={lastPt[1]}
        r="6"
        fill={color}
        opacity="0.22"
      />
    </svg>
  )
}
