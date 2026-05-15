import { useState, useEffect, useRef } from "react"
import type { RunResults, ProviderName } from "@/lib/types"
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/constants"
import { NumTicker } from "./NumTicker"
import { BenchDetailChart } from "./BenchDetailChart"

interface LiquidBenchViewProps {
  data: RunResults | null
  activeProviders: ProviderName[]
}

function computeRunningAvg(data: RunResults, provider: ProviderName, upToIndex: number): number {
  const vals = data.results
    .slice(0, upToIndex + 1)
    .map((r) => r.outputs[provider]?.ttfb?.p50)
    .filter((v): v is number => v != null && v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function computeCurrentP50(data: RunResults, providers: ProviderName[], tick: number): number {
  let bestVal = Infinity
  for (const p of providers) {
    const avg = computeRunningAvg(data, p, tick)
    if (avg > 0 && avg < bestVal) bestVal = avg
  }
  return bestVal === Infinity ? 0 : bestVal
}

export function LiquidBenchView({ data, activeProviders }: LiquidBenchViewProps) {
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const providers =
    activeProviders.length > 0 ? activeProviders : (data?.providers as ProviderName[] ?? [])

  const maxTick = data ? Math.max(data.results.length - 1, 0) : 0
  const currentP50 = data ? computeCurrentP50(data, providers, tick) : 0
  const currentUtterance = data ? data.results[tick]?.text ?? "" : ""
  const progress = maxTick > 0 ? ((tick + 1) / (maxTick + 1)) * 100 : 0

  function start() {
    if (!data || running) return
    setRunning(true)
    setTick(0)
    setHistory([])
    intervalRef.current = setInterval(() => {
      setTick((t) => {
        const next = t + 1
        if (next > maxTick) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          return t
        }
        return next
      })
    }, 500)
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  // Update history on tick
  useEffect(() => {
    if (data && running) {
      const val = computeCurrentP50(data, providers, tick)
      if (val > 0) {
        setHistory((h) => [...h.slice(-30), val])
      }
    }
  }, [tick, running])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div className="eyebrow">Real-time benchmark simulation</div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: "rgba(251,191,36,0.15)",
              color: "#fbbf24",
              padding: "2px 6px",
              borderRadius: 4,
              letterSpacing: "0.04em",
            }}
          >
            BETA
          </span>
        </div>
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(24px, 2.5vw, 32px)",
            fontWeight: 400,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Liquid Bench
        </h1>
      </div>

      <div className="px-7 lg:px-9 pb-10" style={{ marginTop: 24 }}>
        {!data ? (
          <div className="v3-card" style={{ padding: "32px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--ink-faint)" }}>
              No benchmark data loaded. Place a results.json in public/ to begin.
            </div>
          </div>
        ) : (
          <>
            {/* Live indicator */}
            <div
              className="v3-card"
              style={{
                padding: "12px 20px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: running ? "#4ade80" : "var(--ink-faint)",
                  flexShrink: 0,
                  animation: running ? "pulseDot 1.8s ease-in-out infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: running ? "#86efac" : "var(--ink-faint)",
                  fontFamily: "Geist Mono, monospace",
                  letterSpacing: "0.12em",
                }}
              >
                {running ? "LIVE" : "IDLE"}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {running
                  ? `Processing utterance ${tick + 1} / ${data.results.length}`
                  : tick > 0
                    ? `Completed ${tick + 1} / ${data.results.length} utterances`
                    : "Ready to start"}
              </span>
              <div style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  fontFamily: "Geist Mono, monospace",
                }}
              >
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Main content grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "7fr 5fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Left: big counter + chart */}
              <div className="v3-card" style={{ padding: "24px" }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Best P50 TTFB (running)
                </div>

                {/* Big animated counter */}
                <div
                  style={{
                    fontSize: "clamp(48px, 6vw, 72px)",
                    fontWeight: 700,
                    color: "var(--ink)",
                    fontFamily: "Geist Mono, monospace",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    marginBottom: 12,
                  }}
                >
                  <NumTicker value={Math.round(currentP50)} duration={300} />
                  <span
                    style={{
                      fontSize: "0.3em",
                      fontWeight: 400,
                      color: "var(--ink-dim)",
                      marginLeft: 6,
                    }}
                  >
                    ms
                  </span>
                </div>

                {/* Current utterance */}
                {running && currentUtterance && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.025)",
                      borderRadius: 8,
                      borderLeft: "2px solid var(--lav-2)",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: 10.5, color: "var(--lav-2)", marginBottom: 3, fontFamily: "Geist Mono, monospace" }}>
                      TESTING
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ink-2)",
                        fontStyle: "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      &ldquo;{currentUtterance}&rdquo;
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginBottom: 6,
                      fontFamily: "Geist Mono, monospace",
                    }}
                  >
                    <span>{tick + 1} / {data.results.length} utterances</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 4,
                      background: "var(--bg-3)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        borderRadius: 4,
                        background: "linear-gradient(90deg, var(--lav-3), var(--lav-2))",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", gap: 8 }}>
                  {!running ? (
                    <button
                      type="button"
                      className="v3-btn v3-btn-primary"
                      style={{ fontSize: 13 }}
                      onClick={start}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="currentColor"
                        stroke="none"
                      >
                        <path d="M6 4.5v15l13-7.5z" />
                      </svg>
                      {tick > 0 ? "Restart" : "Start Simulation"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="v3-btn"
                      style={{ fontSize: 13 }}
                      onClick={stop}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="currentColor"
                        stroke="none"
                      >
                        <rect x="6.5" y="4.5" width="3.5" height="15" rx="1" />
                        <rect x="14" y="4.5" width="3.5" height="15" rx="1" />
                      </svg>
                      Stop
                    </button>
                  )}
                </div>

                {/* Rolling sparkline */}
                {history.length > 2 && (
                  <div style={{ marginTop: 16 }}>
                    <BenchDetailChart series={history} color="var(--lav-2)" height={80} />
                  </div>
                )}
              </div>

              {/* Right: provider running averages */}
              <div className="v3-card" style={{ padding: "20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 16 }}>
                  Running Averages
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {providers.map((p) => {
                    const avg = computeRunningAvg(data, p, tick)
                    const color = PROVIDER_COLORS[p] || "#a78bfa"
                    const label = PROVIDER_LABELS[p] || p
                    return (
                      <div key={p} className="v3-card-2" style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: color,
                                flexShrink: 0,
                                animation: running ? "pulseDot 1.8s ease-in-out infinite" : "none",
                              }}
                            />
                            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{label}</span>
                          </div>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              fontFamily: "Geist Mono, monospace",
                              color,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {avg > 0 ? `${Math.round(avg)}ms` : "—"}
                          </span>
                        </div>
                        {avg > 0 && (
                          <div
                            style={{
                              height: 4,
                              borderRadius: 4,
                              background: "var(--bg-3)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min((avg / 2000) * 100, 100)}%`,
                                borderRadius: 4,
                                background: color,
                                opacity: 0.7,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {!running && tick === 0 && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px",
                      borderRadius: 10,
                      background: "rgba(167,139,250,0.06)",
                      border: "1px solid rgba(167,139,250,0.15)",
                    }}
                  >
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.5 }}>
                      Press Start to simulate a live benchmark run through all {data.results.length} test utterances.
                    </div>
                  </div>
                )}

                {!running && tick > 0 && (
                  <div className="v3-card-2" style={{ padding: "12px 14px", marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 4, fontFamily: "Geist Mono, monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Final Summary
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.6 }}>
                      Processed{" "}
                      <span style={{ color: "var(--lav-1)", fontWeight: 600 }}>
                        {tick + 1}
                      </span>{" "}
                      utterances · Best P50:{" "}
                      <span
                        style={{
                          color: "var(--lav-1)",
                          fontFamily: "Geist Mono, monospace",
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(currentP50)}ms
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
