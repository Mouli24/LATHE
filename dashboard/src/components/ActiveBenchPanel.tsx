import { useState, useRef, useEffect } from "react"
import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { ALL_PROVIDERS, PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/constants"
import { NumTicker } from "./NumTicker"
import { BenchDetailChart } from "./BenchDetailChart"
import { StatSparkline } from "./StatSparkline"
import { Icon } from "./icons"

interface ActiveBenchPanelProps {
  data: RunResults | null
  metric: MetricKey
  activeProviders?: ProviderName[]
  onExportCsv?: () => void
}

const BOTTOM_TABS = ["Momentum", "General", "Risk", "Reward"]

const CATEGORY_TILES = [
  { key: "credit_card_otp_readback", label: "OTP Readback", color: "#7dd3c0" },
  { key: "hinglish_codeswitch", label: "Hinglish", color: "#c4b5fd" },
  { key: "indian_proper_nouns_and_codes", label: "Proper Nouns", color: "#fbbf24" },
]

function getFastestProvider(data: RunResults): ProviderName {
  const providers = data.providers.length > 0
    ? data.providers
    : (ALL_PROVIDERS as ProviderName[])

  let bestP = providers[0]
  let bestVal = Infinity

  for (const p of providers) {
    const vals: number[] = []
    for (const r of data.results) {
      const o = r.outputs[p]
      if (o?.ttfb?.p50 != null) vals.push(o.ttfb.p50)
    }
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      if (avg < bestVal) {
        bestVal = avg
        bestP = p
      }
    }
  }
  return bestP
}

function getMetricAvg(data: RunResults, provider: ProviderName, key: MetricKey): number {
  const vals: number[] = []
  for (const r of data.results) {
    const o = r.outputs[provider]
    const v = o?.ttfb?.[key]
    if (v != null && v > 0) vals.push(v)
  }
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getSamples(data: RunResults, provider: ProviderName): number[] {
  const all: number[] = []
  for (const r of data.results) {
    const o = r.outputs[provider]
    if (o?.ttfb?.samples) all.push(...o.ttfb.samples)
  }
  return all.slice(0, 24)
}

function generateSeries(n = 20): number[] {
  return Array.from({ length: n }, (_, i) => 200 + Math.sin(i * 0.8) * 80 + Math.random() * 60)
}

function computePercentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * sorted.length)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function getProviderStats(data: RunResults, provider: ProviderName) {
  const vals: number[] = []
  for (const r of data.results) {
    const o = r.outputs[provider]
    if (o?.ttfb?.p50 != null && o.ttfb.p50 > 0) vals.push(o.ttfb.p50)
  }
  const p50 = getMetricAvg(data, provider, "p50")
  const p95 = getMetricAvg(data, provider, "p95")
  const mean = getMetricAvg(data, provider, "mean")
  const errors = data.results.reduce((s, r) => s + (r.outputs[provider]?.errors ?? 0), 0)
  const streaming = data.results.some((r) => r.outputs[provider]?.is_streaming === true)
  return { p50, p95, mean, errors, streaming }
}

export function ActiveBenchPanel({ data, metric, activeProviders, onExportCsv }: ActiveBenchPanelProps) {
  const [bottomTab, setBottomTab] = useState("Momentum")
  const [sliderValue, setSliderValue] = useState(50)
  const [showCompare, setShowCompare] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (!data) {
    return (
      <div
        className="v3-card fade-up"
        style={{ marginTop: 24, padding: "24px", minHeight: 300 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 200, height: 16, borderRadius: 6, background: "var(--bg-3)" }} />
          <div style={{ marginLeft: "auto", width: 80, height: 28, borderRadius: 8, background: "var(--bg-3)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 20 }}>
          <div style={{ height: 200, borderRadius: 12, background: "var(--bg-3)" }} />
          <div style={{ height: 200, borderRadius: 12, background: "var(--bg-3)" }} />
        </div>
      </div>
    )
  }

  const fastest = getFastestProvider(data)
  const p50 = getMetricAvg(data, fastest, metric)
  const p95 = getMetricAvg(data, fastest, "p95")
  const samples = getSamples(data, fastest)
  const chartSeries = samples.length > 4 ? samples : generateSeries()
  const color = PROVIDER_COLORS[fastest] || "#a78bfa"
  const label = PROVIDER_LABELS[fastest] || fastest

  const runDate = data.generated_at
    ? new Date(data.generated_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"

  const allActive = activeProviders ?? data.providers
  const totalErrors = allActive.reduce(
    (sum, p) => sum + data.results.reduce((s, r) => s + (r.outputs[p]?.errors ?? 0), 0),
    0
  )
  const totalRuns2 = data.results.reduce((acc, r) => {
    const o = r.outputs[fastest]
    return acc + (o?.runs ?? 0)
  }, 0)
  const metricLabel = metric.toUpperCase()

  // Compute slider-driven percentile value
  const allSamples = getSamples(data, fastest)
  const sliderPercentileValue = allSamples.length > 0
    ? computePercentile(allSamples, sliderValue)
    : p50 * (sliderValue / 50)
  const sliderPct = Math.round(sliderPercentileValue)
  const sliderLabel = sliderValue <= 50 ? "P50" : sliderValue <= 75 ? "P75" : sliderValue <= 90 ? "P90" : sliderValue <= 95 ? "P95" : "P99"

  // Stat tiles vary by bottomTab
  function getStatTiles() {
    const meanAll = allActive.length > 0
      ? allActive.map((p) => getMetricAvg(data!, p, "mean")).reduce((a, b) => a + b, 0) / allActive.length
      : 0
    const bestP50 = allActive.length > 0
      ? Math.min(...allActive.map((p) => getMetricAvg(data!, p, "p50")).filter((v) => v > 0))
      : 0
    const worstP50 = allActive.length > 0
      ? Math.max(...allActive.map((p) => getMetricAvg(data!, p, "p50")).filter((v) => v > 0))
      : 0
    const worstP95 = allActive.length > 0
      ? Math.max(...allActive.map((p) => getMetricAvg(data!, p, "p95")).filter((v) => v > 0))
      : 0
    const nonStreamingCount = data!.results.filter((r) =>
      allActive.every((p) => r.outputs[p]?.is_streaming === false)
    ).length

    const catKeys = ["credit_card_otp_readback", "hinglish_codeswitch", "indian_proper_nouns_and_codes"]
    const catLabels = ["OTP", "Hinglish", "NPN"]
    const catBest = catKeys.map((cat) => {
      const catResults = data!.results.filter((r) => r.category === cat)
      if (!catResults.length) return 0
      const vals = allActive.flatMap((p) =>
        catResults.map((r) => r.outputs[p]?.ttfb?.p50).filter((v): v is number => v != null && v > 0)
      )
      return vals.length > 0 ? Math.min(...vals) : 0
    })

    switch (bottomTab) {
      case "Momentum":
        return [
          {
            label: metricLabel + " TTFB",
            value: p50.toFixed(1),
            unit: "ms",
            series: chartSeries.slice(0, 12),
            color,
          },
          {
            label: "P95 TTFB",
            value: p95.toFixed(1),
            unit: "ms",
            series: chartSeries.slice(4, 16),
            color: "var(--ink-dim)",
          },
          {
            label: "Total Errors",
            value: String(totalErrors),
            unit: "err",
            series: Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? 0.8 : 0.1)),
            color: totalErrors > 0 ? "var(--neg)" : "var(--pos)",
          },
          {
            label: "Sample Count",
            value: totalRuns2 > 0 ? String(totalRuns2) : String(data!.results.length),
            unit: totalRuns2 > 0 ? "runs" : "tests",
            series: generateSeries(12),
            color: "var(--teal)",
          },
        ]
      case "General":
        return [
          {
            label: "Mean TTFB",
            value: meanAll.toFixed(1),
            unit: "ms",
            series: chartSeries.slice(0, 12),
            color: "var(--lav-2)",
          },
          {
            label: "Best P50",
            value: bestP50.toFixed(1),
            unit: "ms",
            series: chartSeries.slice(2, 14),
            color: "var(--pos)",
          },
          {
            label: "Worst P50",
            value: worstP50.toFixed(1),
            unit: "ms",
            series: chartSeries.slice(6, 18),
            color: "var(--warn)",
          },
          {
            label: "Providers",
            value: String(allActive.length),
            unit: "active",
            series: Array.from({ length: 12 }, () => 0.5),
            color: "var(--teal)",
          },
        ]
      case "Risk":
        return [
          {
            label: "Total Errors",
            value: String(totalErrors),
            unit: "err",
            series: Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? 0.8 : 0.1)),
            color: totalErrors > 0 ? "var(--neg)" : "var(--pos)",
          },
          {
            label: "Non-Streaming",
            value: String(nonStreamingCount),
            unit: "tests",
            series: generateSeries(12),
            color: "var(--warn)",
          },
          {
            label: "Worst P95",
            value: worstP95.toFixed(1),
            unit: "ms",
            series: chartSeries.slice(8, 20),
            color: "var(--neg)",
          },
          {
            label: "Providers",
            value: String(allActive.length),
            unit: "tested",
            series: Array.from({ length: 12 }, () => 0.5),
            color: "var(--ink-dim)",
          },
        ]
      case "Reward":
        return catKeys.map((_, i) => ({
          label: `Best P50 · ${catLabels[i]}`,
          value: catBest[i].toFixed(1),
          unit: "ms",
          series: generateSeries(12),
          color: ["#7dd3c0", "#c4b5fd", "#fbbf24"][i],
        })).concat([
          {
            label: "Total Runs",
            value: String(totalRuns2 || data!.results.length),
            unit: totalRuns2 > 0 ? "runs" : "tests",
            series: generateSeries(12),
            color: "var(--lav-2)",
          },
        ])
      default:
        return []
    }
  }

  const statTiles = getStatTiles()
  const totalRuns = totalRuns2

  return (
    <div className="v3-card fade-up" style={{ marginTop: 24 }}>
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 22px 16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Icon.Activity style={{ width: 16, height: 16, color: "var(--lav-2)" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          Your active benchmarks
        </span>
        <span className="v3-badge v3-badge-pos" style={{ marginLeft: 4 }}>
          Live
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, position: "relative" }}>
          <button
            type="button"
            className="v3-btn"
            style={{ padding: "5px 8px" }}
            onClick={onExportCsv}
            title="Export CSV"
            disabled={!onExportCsv}
          >
            <Icon.Download style={{ width: 13, height: 13 }} />
          </button>
          <div ref={moreRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="v3-btn"
              style={{ padding: "5px 8px" }}
              onClick={() => setShowMoreMenu((v) => !v)}
            >
              <Icon.MoreH style={{ width: 13, height: 13 }} />
            </button>
            {showMoreMenu && (
              <div
                className="v3-card"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 20,
                  minWidth: 160,
                  padding: "6px",
                  border: "1px solid var(--line-2)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {[
                  {
                    label: "Copy Run ID",
                    onClick: () => {
                      navigator.clipboard.writeText(data.run_id ?? "")
                      setShowMoreMenu(false)
                    },
                  },
                  {
                    label: "Refresh Data",
                    onClick: () => {
                      window.location.reload()
                    },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "none",
                      color: "var(--ink-2)",
                      fontSize: 12.5,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.target as HTMLButtonElement).style.background = "none"
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "7fr 5fr",
          gap: 0,
        }}
      >
        {/* Left: provider details + chart */}
        <div
          style={{
            padding: "22px",
            borderRight: "1px solid var(--line)",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {runDate} · {data.run_id?.slice(0, 14) || "run-xxxx"}
          </div>

          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(24px, 2.5vw, 32px)",
              fontWeight: 400,
              color: "var(--ink)",
              margin: "0 0 12px",
              lineHeight: 1.2,
            }}
          >
            {label}
          </h2>

          {/* Big number — driven by slider */}
          <div
            style={{
              fontSize: "clamp(44px, 5vw, 64px)",
              fontWeight: 700,
              color: "var(--ink)",
              fontFamily: "Geist Mono, monospace",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              marginBottom: 16,
            }}
          >
            <NumTicker value={sliderPct} duration={400} decimals={0} />
            <span
              style={{
                fontSize: "0.35em",
                fontWeight: 400,
                color: "var(--ink-dim)",
                marginLeft: 4,
              }}
            >
              ms
            </span>
            <span
              style={{
                fontSize: "0.28em",
                fontWeight: 500,
                color: "var(--lav-2)",
                marginLeft: 8,
                fontFamily: "Geist, sans-serif",
              }}
            >
              {sliderLabel}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button type="button" className="v3-btn v3-btn-primary" style={{ fontSize: 12.5 }}>
              <Icon.Sparkle style={{ width: 13, height: 13 }} />
              Upgrade
            </button>
            <button
              type="button"
              className="v3-btn v3-btn-violet"
              style={{ fontSize: 12.5 }}
              onClick={() => setShowCompare((v) => !v)}
            >
              <Icon.Layers style={{ width: 13, height: 13 }} />
              Compare
            </button>
            <span className="v3-badge" style={{ alignSelf: "center", color }}>
              Stream
            </span>
            <span className="v3-badge" style={{ alignSelf: "center" }}>
              {totalRuns > 0 ? `n=${totalRuns}` : `${data.results.length} tests`}
            </span>
          </div>

          {/* Compare table */}
          {showCompare && (
            <div
              className="v3-card-2"
              style={{ padding: "14px", marginBottom: 16, overflowX: "auto" }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 10 }}>
                Provider Comparison
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                <thead>
                  <tr>
                    {["Provider", "P50", "P95", "Mean", "Errors", "Streaming"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "4px 8px",
                          color: "var(--ink-faint)",
                          fontWeight: 500,
                          borderBottom: "1px solid var(--line)",
                          fontFamily: "Geist Mono, monospace",
                          fontSize: 10.5,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allActive.map((p) => {
                    const stats = getProviderStats(data, p)
                    const isFastest = p === fastest
                    return (
                      <tr key={p}>
                        <td style={{ padding: "6px 8px", color: "var(--ink-2)" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: PROVIDER_COLORS[p] || "#a78bfa",
                                flexShrink: 0,
                                display: "inline-block",
                              }}
                            />
                            {PROVIDER_LABELS[p] ?? p}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            fontFamily: "Geist Mono, monospace",
                            color: isFastest ? "var(--lav-1)" : "var(--ink-2)",
                            fontWeight: isFastest ? 600 : 400,
                          }}
                        >
                          {Math.round(stats.p50)}ms
                        </td>
                        <td style={{ padding: "6px 8px", fontFamily: "Geist Mono, monospace", color: "var(--ink-2)" }}>
                          {Math.round(stats.p95)}ms
                        </td>
                        <td style={{ padding: "6px 8px", fontFamily: "Geist Mono, monospace", color: "var(--ink-2)" }}>
                          {Math.round(stats.mean)}ms
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            fontFamily: "Geist Mono, monospace",
                            color: stats.errors > 0 ? "var(--neg)" : "var(--pos)",
                          }}
                        >
                          {stats.errors}
                        </td>
                        <td style={{ padding: "6px 8px", color: stats.streaming ? "var(--pos)" : "var(--ink-faint)" }}>
                          {stats.streaming ? "✓" : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart */}
          <BenchDetailChart series={chartSeries} color={color} height={110} />
        </div>

        {/* Right: test window slider + tiles */}
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Test window card with real slider */}
          <div className="v3-card-2" style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
                Test Window
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "Geist Mono, monospace",
                  color: "var(--lav-2)",
                  fontWeight: 600,
                }}
              >
                {sliderLabel} · {sliderPct}ms
              </span>
            </div>
            {/* Real range slider */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                type="range"
                min={50}
                max={99}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: 4,
                  borderRadius: 4,
                  appearance: "none",
                  background: `linear-gradient(90deg, ${color} 0%, ${color} ${((sliderValue - 50) / 49) * 100}%, var(--bg-3) ${((sliderValue - 50) / 49) * 100}%, var(--bg-3) 100%)`,
                  outline: "none",
                  cursor: "pointer",
                }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: ${color};
                  border: 2px solid var(--bg-2);
                  box-shadow: 0 0 6px ${color}80;
                  cursor: pointer;
                }
                input[type=range]::-moz-range-thumb {
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: ${color};
                  border: 2px solid var(--bg-2);
                  cursor: pointer;
                }
              `}</style>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--ink-faint)",
                fontFamily: "Geist Mono, monospace",
              }}
            >
              <span>P50</span>
              <span>P99</span>
            </div>
          </div>

          {/* Category mini tiles */}
          {CATEGORY_TILES.map((tile) => {
            const count = data.results.filter((r) => r.category === tile.key).length
            return (
              <div
                key={tile.key}
                className="v3-card-2"
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: tile.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--ink-2)", flex: 1 }}>
                  {tile.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    fontFamily: "Geist Mono, monospace",
                  }}
                >
                  {count} tests
                </span>
              </div>
            )
          })}

          {/* Info card */}
          <div className="v3-card-2" style={{ padding: "12px 14px", marginTop: "auto" }}>
            <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.6 }}>
              Benchmark run{" "}
              <span style={{ color: "var(--lav-2)", fontFamily: "Geist Mono, monospace" }}>
                #{data.run_id?.slice(0, 8) || "00000000"}
              </span>{" "}
              completed with {data.results.length} test cases across{" "}
              {data.providers.length || 3} providers.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tabs + stat tiles */}
      <div style={{ borderTop: "1px solid var(--line)" }}>
        {/* Tab row */}
        <div
          style={{
            display: "flex",
            padding: "0 22px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setBottomTab(tab)}
              style={{
                padding: "12px 16px",
                border: "none",
                background: "none",
                fontSize: 12.5,
                fontWeight: 500,
                color: bottomTab === tab ? "var(--ink)" : "var(--ink-faint)",
                cursor: "pointer",
                borderBottom: bottomTab === tab ? `2px solid ${color}` : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stat tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${statTiles.length}, 1fr)`,
            gap: 0,
          }}
        >
          {statTiles.map((tile, i) => (
            <div
              key={tile.label}
              style={{
                padding: "16px 20px",
                borderRight: i < statTiles.length - 1 ? "1px solid var(--line)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    marginBottom: 4,
                    fontFamily: "Geist Mono, monospace",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {tile.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: tile.color,
                    fontFamily: "Geist Mono, monospace",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tile.value}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: "var(--ink-faint)",
                      marginLeft: 3,
                    }}
                  >
                    {tile.unit}
                  </span>
                </div>
              </div>
              <StatSparkline
                series={tile.series}
                color={tile.color.startsWith("var") ? "#8d8898" : tile.color}
                height={32}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
