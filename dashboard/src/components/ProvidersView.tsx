import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/constants"
import { NumTicker } from "./NumTicker"
import { LatencyChart } from "./LatencyChart"

interface ProvidersViewProps {
  data: RunResults | null
  activeProviders: ProviderName[]
  metric: MetricKey
}

function getMetric(data: RunResults, p: ProviderName, key: MetricKey): number {
  const vals = data.results
    .map((r) => r.outputs[p]?.ttfb?.[key])
    .filter((v): v is number => v != null && v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getMin(data: RunResults, p: ProviderName): number {
  const vals = data.results
    .map((r) => r.outputs[p]?.ttfb?.min)
    .filter((v): v is number => v != null && v > 0)
  return vals.length ? Math.min(...vals) : 0
}

function getMax(data: RunResults, p: ProviderName): number {
  const vals = data.results
    .map((r) => r.outputs[p]?.ttfb?.max)
    .filter((v): v is number => v != null && v > 0)
  return vals.length ? Math.max(...vals) : 0
}

function getCategoryP50s(
  data: RunResults,
  p: ProviderName
): { cat: string; p50: number }[] {
  const cats = [...new Set(data.results.map((r) => r.category))].sort()
  return cats.map((cat) => {
    const vals = data.results
      .filter((r) => r.category === cat)
      .map((r) => r.outputs[p]?.ttfb?.p50)
      .filter((v): v is number => v != null && v > 0)
    return {
      cat,
      p50: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
    }
  })
}

const CAT_SHORT: Record<string, string> = {
  credit_card_otp_readback: "OTP",
  hinglish_codeswitch: "Hinglish",
  indian_proper_nouns_and_codes: "Fin. Codes",
}

function CompareBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div
      style={{
        height: 6,
        borderRadius: 4,
        background: "var(--bg-3)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 4,
          background: color,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  )
}

function ProviderCard({
  data,
  provider,
  metric,
  maxP50,
}: {
  data: RunResults
  provider: ProviderName
  metric: MetricKey
  maxP50: number
}) {
  const color = PROVIDER_COLORS[provider] || "#a78bfa"
  const label = PROVIDER_LABELS[provider] || provider
  const p50 = getMetric(data, provider, "p50")
  const p95 = getMetric(data, provider, "p95")
  const mean = getMetric(data, provider, "mean")
  const min = getMin(data, provider)
  const max = getMax(data, provider)
  const totalRuns = data.results.reduce((s, r) => s + (r.outputs[provider]?.runs ?? 0), 0)
  const totalErrors = data.results.reduce((s, r) => s + (r.outputs[provider]?.errors ?? 0), 0)
  const isStreaming = data.results.some((r) => r.outputs[provider]?.is_streaming === true)
  const lastError = data.results
    .map((r) => r.outputs[provider]?.last_error)
    .find((e) => e != null && e !== "")
  const catP50s = getCategoryP50s(data, provider)

  const stats = [
    { label: "P50", value: p50 },
    { label: "P95", value: p95 },
    { label: "Mean", value: mean },
    { label: "Min", value: min },
    { label: "Max", value: max },
  ]

  return (
    <div
      className="v3-card fade-up"
      style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `${color}18`,
            border: `1.5px solid ${color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="1.4" />
            <circle cx="12" cy="12" r="4.5" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
            <circle cx="12" cy="12" r="1.8" fill={color} />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
            <span
              className="v3-badge"
              style={{
                background: isStreaming ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                color: isStreaming ? "#86efac" : "var(--ink-faint)",
              }}
            >
              {isStreaming ? "Streaming" : "Non-stream"}
            </span>
            <span className="v3-badge">
              {totalRuns > 0 ? `${totalRuns} runs` : `${data.results.length} tests`}
            </span>
          </div>
        </div>
      </div>

      {/* Big metric */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          {metric.toUpperCase()} TTFB
        </div>
        <div
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "Geist Mono, monospace",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          <NumTicker value={Math.round(getMetric(data, provider, metric))} duration={1200} />
          <span style={{ fontSize: "0.4em", fontWeight: 400, color: "var(--ink-dim)", marginLeft: 3 }}>ms</span>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="v3-card-2"
            style={{ padding: "8px 10px", textAlign: "center" }}
          >
            <div
              style={{
                fontSize: 9.5,
                color: "var(--ink-faint)",
                fontFamily: "Geist Mono, monospace",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "Geist Mono, monospace",
                color: "var(--ink-2)",
              }}
            >
              {Math.round(s.value)}
              <span style={{ fontSize: 9, color: "var(--ink-faint)", marginLeft: 1 }}>ms</span>
            </div>
          </div>
        ))}
        <div className="v3-card-2" style={{ padding: "8px 10px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 9.5,
              color: "var(--ink-faint)",
              fontFamily: "Geist Mono, monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Errors
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "Geist Mono, monospace",
              color: totalErrors > 0 ? "var(--neg)" : "var(--pos)",
            }}
          >
            {totalErrors}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", marginBottom: 8 }}>
          Category P50
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {catP50s.map(({ cat, p50: catP50 }) => (
            <div key={cat}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 3,
                  fontSize: 11,
                }}
              >
                <span style={{ color: "var(--ink-faint)" }}>{CAT_SHORT[cat] ?? cat}</span>
                <span
                  style={{
                    color: "var(--ink-2)",
                    fontFamily: "Geist Mono, monospace",
                  }}
                >
                  {Math.round(catP50)}ms
                </span>
              </div>
              <CompareBar value={catP50} max={maxP50} color={color} />
            </div>
          ))}
        </div>
      </div>

      {/* Last error */}
      {lastError && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.20)",
          }}
        >
          <div style={{ fontSize: 10, color: "#fca5a5", fontWeight: 600, marginBottom: 3 }}>
            LAST ERROR
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#fca5a5",
              fontFamily: "Geist Mono, monospace",
              wordBreak: "break-word",
            }}
          >
            {lastError}
          </div>
        </div>
      )}
    </div>
  )
}

export function ProvidersView({ data, activeProviders, metric }: ProvidersViewProps) {
  if (!data) {
    return (
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Loading…</div>
        <div
          style={{
            height: 32,
            width: 300,
            borderRadius: 8,
            background: "var(--bg-3)",
            marginBottom: 8,
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 24,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ height: 300, borderRadius: 18, background: "var(--bg-2)" }}
            />
          ))}
        </div>
      </div>
    )
  }

  const providers =
    activeProviders.length > 0 ? activeProviders : (data.providers as ProviderName[])

  // Max p50 across providers (for compare bars)
  const allP50s = providers.map((p) => getMetric(data, p, "p50")).filter((v) => v > 0)
  const maxP50 = allP50s.length ? Math.max(...allP50s) : 1

  const colCount = Math.min(providers.length, 3)

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Detailed per-provider analysis</div>
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
          Provider Breakdown
        </h1>
      </div>

      {/* Provider cards */}
      <div
        className="px-7 lg:px-9 pb-10"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: 16,
          marginTop: 24,
        }}
      >
        {providers.map((p) => (
          <ProviderCard
            key={p}
            data={data}
            provider={p}
            metric={metric}
            maxP50={maxP50}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="px-7 lg:px-9 pb-10">
        <div className="v3-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 16 }}>
            Latency by Category
          </div>
          <LatencyChart results={data.results} activeProviders={providers} metric={metric} />
        </div>
      </div>
    </div>
  )
}
