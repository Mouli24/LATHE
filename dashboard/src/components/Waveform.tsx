import { useEffect, useRef, useCallback } from "react"

interface WaveformProps {
  seed?: number
  playing?: boolean
  progress?: number
  accent?: string
  height?: number
  bars?: number
  onClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void
}

function generatePeaks(seed: number, bars: number): number[] {
  let s = seed * 9301 + 49297
  const peaks: number[] = []
  for (let i = 0; i < bars; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    const t = i / (bars - 1)
    const bell = Math.sin(t * Math.PI)
    peaks[i] = 0.12 + 0.88 * (0.35 + 0.65 * r) * (0.5 + 0.5 * bell)
  }
  return peaks
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export function Waveform({
  seed = 42,
  playing = false,
  progress = 0,
  accent = "#a78bfa",
  height = 40,
  bars = 40,
  onClick,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const timeRef = useRef(0)
  const peaks = useRef<number[]>([])

  peaks.current = generatePeaks(seed, bars)

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, W, H)

      const barW = 2.5
      const gap = (W - bars * barW) / (bars + 1)
      const pivotIdx = Math.floor(progress * bars)

      for (let i = 0; i < bars; i++) {
        const x = gap + i * (barW + gap)
        let peak = peaks.current[i]

        if (playing) {
          const wobble = Math.sin(time * 0.004 + i * 0.6) * 0.08
          if (i >= pivotIdx) peak = Math.max(0.08, peak + wobble)
        }

        const barH = Math.max(3, peak * H)
        const y = (H - barH) / 2

        ctx.fillStyle =
          i <= pivotIdx ? accent : "rgba(255,255,255,0.16)"

        roundRect(ctx, x, y, barW, barH, 2)
        ctx.fill()
      }
    },
    [accent, bars, playing, progress]
  )

  useEffect(() => {
    let running = true

    const loop = (ts: number) => {
      if (!running) return
      timeRef.current = ts
      draw(ts)
      if (playing) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    draw(timeRef.current)
    if (playing) {
      rafRef.current = requestAnimationFrame(loop)
    }

    return () => {
      running = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [draw, playing])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height, display: "block", cursor: "pointer" }}
      onClick={onClick}
    />
  )
}
