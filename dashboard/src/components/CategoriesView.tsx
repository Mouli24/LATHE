import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { PROVIDER_LABELS, PROVIDER_COLORS, CATEGORY_DESCRIPTIONS } from "@/lib/constants"
import { LatencyChart } from "./LatencyChart"

interface CategoriesViewProps {
  data: RunResults | null
  activeProviders: ProviderName[]
  metric: MetricKey
}

const CATEGORIES = [
  { key: "credit_card_otp_readback", label: "OTP / Card Readback", color: "#7dd3c0", cls: "cat-otp" },
  { key: "hinglish_codeswitch", label: "Hinglish Conversations", color: "#c4b5fd", cls: "cat-hing" },
  { key: "indian_proper_nouns_and_codes", label: "Indian Financial Codes", color: "#fbbf24", cls: "cat-npn" },
]

function getMetricAvg(data: RunResults, provider: ProviderName, category: string, key: MetricKey): number {
  const vals = data.results
    .filter((r) => r.category === category)
    .map((r) => r.outputs[provider]?.ttfb?.[key])
    .filter((v): v is number => v != null && v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getBestProvider(
  data: RunResults,
  category: string,
  providers: ProviderName[]
): { provider: ProviderName; value: number } | null {
  const ranked = providers
    .map((p) => ({ provider: p, value: getMetricAvg(data, p, category, "p50") }))
    .filter((r) => r.value > 0)
    .sort((a, b) => a.value - b.value)
  return ranked[0] ?? null
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

export function CategoriesView({ data, activeProviders, metric }: CategoriesViewProps) {
  if (!data) {
    return (
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Loading…</div>
        <div
          style={{
            height: 32,
            width: 260,
            borderRadius: 8,
            background: "var(--bg-3)",
            marginBottom: 24,
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 240, borderRadius: 18, background: "var(--bg-2)" }} />
          ))}
        </div>
      </div>
    )
  }

  const providers =
    activeProviders.length > 0 ? activeProviders : (data.providers as ProviderName[])

  // Global max P50 for normalization
  const allVals = CATEGORIES.flatMap((cat) =>
    providers.map((p) => getMetricAvg(data, p, cat.key, "p50")).filter((v) => v > 0)
  )
  const globalMax = allVals.length ? Math.max(...allVals) : 1

  // Category data
  const catData = CATEGORIES.map((cat) => {
    const utterances = data.results.filter((r) => r.category === cat.key)
    const best = getBestProvider(data, cat.key, providers)
    const providerVals = providers.map((p) => ({
      provider: p,
      value: getMetricAvg(data, p, cat.key, "p50"),
      color: PROVIDER_COLORS[p] || "#a78bfa",
    }))
    return { ...cat, utterances, best, providerVals }
  }).filter((c) => c.utterances.length > 0)

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Test category analysis</div>
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
          Category Breakdown
        </h1>
      </div>

      {/* Category cards */}
      <div
        className="px-7 lg:px-9"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${catData.length}, 1fr)`,
          gap: 16,
          marginTop: 24,
        }}
      >
        {catData.map((cat) => (
          <div key={cat.key} className="v3-card fade-up" style={{ padding: "20px" }}>
            {/* Category badge + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                className={`v3-pill ${cat.cls}`}
                style={{ fontSize: 11, padding: "3px 10px" }}
              >
                {cat.label}
              </span>
              <span className="v3-badge">{cat.utterances.length} tests</span>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "0 0 14px", lineHeight: 1.5 }}>
              {CATEGORY_DESCRIPTIONS[cat.key]}
            </p>

            {/* Best provider */}
            {cat.best && (
              <div className="v3-card-2" style={{ padding: "12px 14px", marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-faint)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "Geist Mono, monospace",
                    marginBottom: 4,
                  }}
                >
                  Best P50
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: "Geist Mono, monospace",
                      color: PROVIDER_COLORS[cat.best.provider] || "var(--lav-2)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {Math.round(cat.best.value)}ms
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>
                    {PROVIDER_LABELS[cat.best.provider] ?? cat.best.provider}
                  </span>
                </div>
              </div>
            )}

            {/* Provider compare bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cat.providerVals.map(({ provider, value, color }) => (
                <div key={provider}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      fontSize: 11.5,
                    }}
                  >
                    <span style={{ color: "var(--ink-2)" }}>
                      {PROVIDER_LABELS[provider] ?? provider}
                    </span>
                    <span
                      style={{
                        color: "var(--ink-faint)",
                        fontFamily: "Geist Mono, monospace",
                      }}
                    >
                      {Math.round(value)}ms
                    </span>
                  </div>
                  <CompareBar value={value} max={globalMax} color={color} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Latency chart */}
      <div className="px-7 lg:px-9 pb-10" style={{ marginTop: 24 }}>
        <div className="v3-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 16 }}>
            Latency by Category ({metric.toUpperCase()})
          </div>
          <LatencyChart results={data.results} activeProviders={providers} metric={metric} />
        </div>
      </div>

      {/* Utterances grouped by category */}
      <div className="px-7 lg:px-9 pb-10">
        {catData.map((cat) => (
          <div key={cat.key} style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                className={`v3-pill ${cat.cls}`}
                style={{ fontSize: 11, padding: "3px 10px" }}
              >
                {cat.label}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {cat.utterances.length} utterances
              </span>
            </div>
            <div
              className="v3-card-2"
              style={{
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <th
                      style={{
                        padding: "8px 14px",
                        textAlign: "left",
                        color: "var(--ink-faint)",
                        fontWeight: 500,
                        fontSize: 10.5,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        fontFamily: "Geist Mono, monospace",
                      }}
                    >
                      Test
                    </th>
                    {providers.map((p) => (
                      <th
                        key={p}
                        style={{
                          padding: "8px 14px",
                          textAlign: "left",
                          color: PROVIDER_COLORS[p] || "var(--ink-faint)",
                          fontWeight: 500,
                          fontSize: 10.5,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontFamily: "Geist Mono, monospace",
                          minWidth: 200,
                        }}
                      >
                        {PROVIDER_LABELS[p] ?? p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cat.utterances.slice(0, 5).map((r, i) => (
                    <tr
                      key={r.test_id}
                      style={{
                        borderBottom:
                          i < cat.utterances.slice(0, 5).length - 1
                            ? "1px solid var(--line)"
                            : "none",
                        verticalAlign: "top",
                      }}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "var(--ink-faint)",
                            fontFamily: "Geist Mono, monospace",
                            marginBottom: 2,
                          }}
                        >
                          {r.test_id}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-2)",
                            maxWidth: 260,
                            lineHeight: 1.4,
                          }}
                        >
                          {r.text}
                        </div>
                      </td>
                      {providers.map((p) => {
                        const out = r.outputs[p]
                        const val = out?.ttfb?.p50
                        const audioPath = out?.audio_path
                        return (
                          <td key={p} style={{ padding: "12px 14px" }}>
                            <div
                              style={{
                                fontFamily: "Geist Mono, monospace",
                                fontSize: 13,
                                fontWeight: 600,
                                color: val != null && val > 0
                                  ? (PROVIDER_COLORS[p] || "var(--ink-2)")
                                  : "var(--ink-faint)",
                                marginBottom: audioPath ? 8 : 0,
                              }}
                            >
                              {val != null && val > 0 ? `${Math.round(val)}ms` : "—"}
                            </div>
                            {audioPath && (
                              <audio
                                controls
                                src={`/${audioPath}`}
                                style={{
                                  height: 28,
                                  width: "100%",
                                  minWidth: 160,
                                  maxWidth: 220,
                                  opacity: 0.85,
                                }}
                              />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {cat.utterances.length > 5 && (
                <div
                  style={{
                    padding: "8px 14px",
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    borderTop: "1px solid var(--line)",
                    textAlign: "center",
                  }}
                >
                  +{cat.utterances.length - 5} more utterances
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
