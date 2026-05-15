import { useState } from "react"
import type { RunResults, ProviderName } from "@/lib/types"
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/constants"

interface LatencyCalculatorViewProps {
  data: RunResults | null
  activeProviders: ProviderName[]
}

function getP50Avg(data: RunResults, provider: ProviderName): number {
  const vals = data.results
    .map((r) => r.outputs[provider]?.ttfb?.p50)
    .filter((v): v is number => v != null && v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function LatencyCalculatorView({ data, activeProviders }: LatencyCalculatorViewProps) {
  const [target, setTarget] = useState(500)

  if (!data) {
    return (
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Loading…</div>
        <div style={{ height: 32, width: 300, borderRadius: 8, background: "var(--bg-3)", marginBottom: 24 }} />
      </div>
    )
  }

  const providers =
    activeProviders.length > 0 ? activeProviders : (data.providers as ProviderName[])

  const results = providers.map((p) => {
    const p50 = getP50Avg(data, p)
    const pass = p50 > 0 && p50 < target
    const margin = Math.abs(target - p50)
    return { provider: p, p50, pass, margin }
  })

  const passing = results.filter((r) => r.pass)

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Set a target TTFB and see which providers qualify
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
          Latency Calculator
        </h1>
      </div>

      <div className="px-7 lg:px-9 pb-10" style={{ marginTop: 24 }}>
        {/* Target slider card */}
        <div className="v3-card" style={{ padding: "24px", marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Target TTFB</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                Providers with P50 below this threshold pass
              </div>
            </div>
            <div
              style={{
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 700,
                fontFamily: "Geist Mono, monospace",
                color: "var(--lav-1)",
                letterSpacing: "-0.03em",
              }}
            >
              {target}
              <span style={{ fontSize: "0.4em", fontWeight: 400, color: "var(--ink-dim)", marginLeft: 4 }}>ms</span>
            </div>
          </div>

          <input
            type="range"
            className="latcalc-range"
            min={100}
            max={2000}
            step={10}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            style={{
              width: "100%",
              height: 6,
              borderRadius: 4,
              appearance: "none",
              background: `linear-gradient(90deg, var(--lav-3) 0%, var(--lav-3) ${((target - 100) / 1900) * 100}%, var(--bg-3) ${((target - 100) / 1900) * 100}%, var(--bg-3) 100%)`,
              outline: "none",
              cursor: "pointer",
              marginBottom: 8,
            }}
          />
          <style>{`
            .latcalc-range::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: var(--lav-2);
              border: 2px solid var(--bg-1);
              box-shadow: 0 0 8px rgba(139,92,246,0.5);
              cursor: pointer;
            }
          `}</style>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10.5,
              color: "var(--ink-faint)",
              fontFamily: "Geist Mono, monospace",
            }}
          >
            <span>100ms</span>
            <span>2000ms</span>
          </div>
        </div>

        {/* Provider cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(providers.length, 3)}, 1fr)`,
            gap: 12,
            marginBottom: 20,
          }}
        >
          {results.map(({ provider, p50, pass, margin }) => {
            const color = PROVIDER_COLORS[provider] || "#a78bfa"
            const pct = target > 0 ? Math.min((p50 / target) * 100, 130) : 0
            const barWidth = Math.min(pct, 100)
            return (
              <div
                key={provider}
                className="v3-card fade-up"
                style={{
                  padding: "18px 20px",
                  border: `1px solid ${pass ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.20)"}`,
                  background: pass
                    ? "rgba(74,222,128,0.04)"
                    : "rgba(248,113,113,0.04)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
                      {PROVIDER_LABELS[provider] ?? provider}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: pass ? "#86efac" : "#fca5a5",
                    }}
                  >
                    {pass ? "✓ PASS" : "✗ FAIL"}
                  </span>
                </div>

                {/* P50 value */}
                <div
                  style={{
                    fontSize: "clamp(24px, 2.5vw, 32px)",
                    fontWeight: 700,
                    fontFamily: "Geist Mono, monospace",
                    color: "var(--ink)",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    marginBottom: 8,
                  }}
                >
                  {p50 > 0 ? Math.round(p50) : "—"}
                  {p50 > 0 && (
                    <span style={{ fontSize: "0.4em", fontWeight: 400, color: "var(--ink-dim)", marginLeft: 3 }}>ms</span>
                  )}
                </div>

                {/* Margin text */}
                <div
                  style={{
                    fontSize: 11.5,
                    color: pass ? "#86efac" : "#fca5a5",
                    marginBottom: 12,
                    fontFamily: "Geist Mono, monospace",
                  }}
                >
                  {p50 > 0
                    ? pass
                      ? `${Math.round(margin)}ms under target`
                      : `${Math.round(margin)}ms over target`
                    : "No data"}
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 6,
                    borderRadius: 4,
                    background: "var(--bg-3)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      borderRadius: 4,
                      background: pass ? "#4ade80" : "#f87171",
                      transition: "width 0.5s ease",
                    }}
                  />
                  {/* Target line at 100% (clamped to 100%) */}
                  {pct <= 130 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "calc(100% - 1px)",
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: "rgba(255,255,255,0.3)",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    fontFamily: "Geist Mono, monospace",
                  }}
                >
                  <span>0ms</span>
                  <span>{target}ms</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="v3-card-2" style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
            At{" "}
            <span
              style={{
                color: "var(--lav-1)",
                fontFamily: "Geist Mono, monospace",
                fontWeight: 600,
              }}
            >
              {target}ms
            </span>
            :{" "}
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>
              {passing.length} of {providers.length}
            </span>{" "}
            providers qualify
            {passing.length > 0 && (
              <>
                {" "}(
                <span style={{ color: "#86efac" }}>
                  {passing.map((r) => PROVIDER_LABELS[r.provider] ?? r.provider).join(", ")}
                </span>
                )
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
