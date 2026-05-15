interface BenchDetailChartProps {
  series: number[]
  color?: string
  height?: number
}

function catmullRom(points: [number, number][]): string {
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

export function BenchDetailChart({ series, color = "#a78bfa", height = 120 }: BenchDetailChartProps) {
  const W = 400
  const H = height
  const padX = 8
  const padY = 16
  const chartH = H - padY * 2

  if (!series || series.length < 2) {
    return (
      <div
        style={{
          height,
          background: "rgba(255,255,255,0.02)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-faint)",
          fontSize: 12,
        }}
      >
        No data
      </div>
    )
  }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1

  const pts: [number, number][] = series.map((v, i) => [
    padX + (i / (series.length - 1)) * (W - 2 * padX),
    padY + chartH - ((v - min) / range) * chartH,
  ])

  const linePath = catmullRom(pts)
  const areaPath =
    linePath + ` L ${pts[pts.length - 1][0]},${H - padY} L ${pts[0][0]},${H - padY} Z`

  const gradId = `bdc-${color.replace("#", "")}`

  // guide lines at 25%, 50%, 75%
  const guides = [0.25, 0.5, 0.75]

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
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* guide lines */}
      {guides.map((g) => {
        const y = padY + chartH * (1 - g)
        return (
          <line
            key={g}
            x1={padX}
            y1={y}
            x2={W - padX}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )
      })}

      {/* area */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* min label */}
      <text
        x={padX + 2}
        y={H - 4}
        fontSize="9"
        fill="var(--ink-faint)"
        fontFamily="'Geist Mono', monospace"
      >
        {min.toFixed(0)}ms
      </text>

      {/* max label */}
      <text
        x={padX + 2}
        y={padY - 4}
        fontSize="9"
        fill="var(--ink-faint)"
        fontFamily="'Geist Mono', monospace"
      >
        {max.toFixed(0)}ms
      </text>
    </svg>
  )
}
