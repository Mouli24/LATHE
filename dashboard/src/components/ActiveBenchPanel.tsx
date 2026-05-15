import { useState } from "react"
import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { ALL_PROVIDERS } from "@/lib/constants"
import { NumTicker } from "./NumTicker"
import { BenchDetailChart } from "./BenchDetailChart"
import { StatSparkline } from "./StatSparkline"
import { Icon } from "./icons"

interface ActiveBenchPanelProps {
  data: RunResults | null
  metric: MetricKey
}

const PROVIDER_COLORS: Record<ProviderName, string> = {
  smallest: "#a78bfa",
  groq: "#fbbf24",
  sarvam: "#7dd3c0",
}

const PROVIDER_LABELS: Record<ProviderName, string> = {
  smallest: "Smallest.ai",
  groq: "Groq PlayAI",
  sarvam: "Sarvam AI",
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

function getP50(data: RunResults, provider: ProviderName): number {
  const vals: number[] = []
  for (const r of data.results) {
    const o = r.outputs[provider]
    if (o?.ttfb?.p50 != null) vals.push(o.ttfb.p50)
  }
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getP95(data: RunResults, provider: ProviderName): number {
  const vals: number[] = []
  for (const r of data.results) {
    const o = r.outputs[provider]
    if (o?.ttfb?.p95 != null) vals.push(o.ttfb.p95)
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

export function ActiveBenchPanel({ data, metric: _metric }: ActiveBenchPanelProps) {
  const [bottomTab, setBottomTab] = useState("Momentum")

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
  const p50 = getP50(data, fastest)
  const p95 = getP95(data, fastest)
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

  // stat tiles
  const statTiles = [
    {
      label: "P50 TTFB",
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
      label: "Error Rate",
      value: "0.0",
      unit: "%",
      series: Array.from({ length: 12 }, () => 0.5 + Math.random()),
      color: "var(--pos)",
    },
    {
      label: "Sample Count",
      value: String(data.results.length),
      unit: "tests",
      series: generateSeries(12),
      color: "var(--teal)",
    },
  ]

  const totalRuns = data.results.reduce((acc, r) => {
    const o = r.outputs[fastest]
    return acc + (o?.runs ?? 0)
  }, 0)

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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" className="v3-btn" style={{ padding: "5px 8px" }}>
            <Icon.Download style={{ width: 13, height: 13 }} />
          </button>
          <button type="button" className="v3-btn" style={{ padding: "5px 8px" }}>
            <Icon.MoreH style={{ width: 13, height: 13 }} />
          </button>
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
          <div
            className="eyebrow"
            style={{ marginBottom: 8 }}
          >
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

          {/* Big P50 */}
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
            <NumTicker value={p50} duration={1400} decimals={1} />
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
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button type="button" className="v3-btn v3-btn-primary" style={{ fontSize: 12.5 }}>
              <Icon.Sparkle style={{ width: 13, height: 13 }} />
              Upgrade
            </button>
            <button type="button" className="v3-btn v3-btn-violet" style={{ fontSize: 12.5 }}>
              <Icon.Layers style={{ width: 13, height: 13 }} />
              Compare
            </button>
            <span
              className="v3-badge"
              style={{ alignSelf: "center", color }}
            >
              Stream
            </span>
            <span
              className="v3-badge"
              style={{ alignSelf: "center" }}
            >
              {totalRuns > 0 ? `n=${totalRuns}` : `${data.results.length} tests`}
            </span>
          </div>

          {/* Chart */}
          <BenchDetailChart series={chartSeries} color={color} height={110} />
        </div>

        {/* Right: test window + tiles */}
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Test window card */}
          <div className="v3-card-2" style={{ padding: "14px 16px" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-2)",
                marginBottom: 12,
              }}
            >
              Test Window
            </div>
            {/* Slider mock */}
            <div
              style={{
                height: 4,
                borderRadius: 4,
                background: "var(--bg-3)",
                marginBottom: 8,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "64%",
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${color}, ${color}80)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "64%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid var(--bg-2)",
                  boxShadow: `0 0 6px ${color}80`,
                }}
              />
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
              <span>0 ms</span>
              <span>2000 ms</span>
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
          <div
            className="v3-card-2"
            style={{ padding: "12px 14px", marginTop: "auto" }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                lineHeight: 1.6,
              }}
            >
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
            gridTemplateColumns: "repeat(4, 1fr)",
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
                    color: tile.color.startsWith("var") ? tile.color : tile.color,
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
              <StatSparkline series={tile.series} color={tile.color.startsWith("var") ? "#8d8898" : tile.color} height={32} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
