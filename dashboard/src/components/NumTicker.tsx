import { useEffect, useRef, useState } from "react"

interface NumTickerProps {
  value: number
  duration?: number
  decimals?: number
}

export function NumTicker({ value, duration = 900, decimals = 0 }: NumTickerProps) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const startValRef = useRef(0)

  useEffect(() => {
    startValRef.current = display
    startRef.current = null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    const from = startValRef.current
    const to = value

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3)
    }

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return <>{display.toFixed(decimals)}</>
}
