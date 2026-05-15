import { useState } from "react"
import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { ALL_PROVIDERS, PROVIDER_LABELS } from "@/lib/constants"
import { AudioCard } from "./AudioCard"
import { ResultsTable } from "./ResultsTable"
import { Icon } from "./icons"

interface UtterancePeekProps {
  data: RunResults | null
  activeProviders: ProviderName[]
  metric?: MetricKey
  baselineProvider?: ProviderName | null
}

const PROVIDER_COLORS: Record<ProviderName, string> = {
  smallest: "#a78bfa",
  groq: "#fbbf24",
  sarvam: "#7dd3c0",
}

const CATEGORY_CLASS: Record<string, string> = {
  credit_card_otp_readback: "cat-otp",
  hinglish_codeswitch: "cat-hing",
  indian_proper_nouns_and_codes: "cat-npn",
}

const CATEGORY_LABEL: Record<string, string> = {
  credit_card_otp_readback: "OTP",
  hinglish_codeswitch: "Hinglish",
  indian_proper_nouns_and_codes: "Proper Nouns",
}

function hashSeed(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}

function SkeletonPeek() {
  return (
    <div className="v3-card" style={{ padding: "20px", marginBottom: 12 }}>
      <div style={{ width: "30%", height: 12, borderRadius: 6, background: "var(--bg-3)", marginBottom: 12 }} />
      <div style={{ width: "80%", height: 20, borderRadius: 6, background: "var(--bg-3)", marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div style={{ height: 100, borderRadius: 10, background: "var(--bg-3)" }} />
        <div style={{ height: 100, borderRadius: 10, background: "var(--bg-3)" }} />
        <div style={{ height: 100, borderRadius: 10, background: "var(--bg-3)" }} />
      </div>
    </div>
  )
}

export function UtterancePeek({ data, activeProviders, metric = "p50", baselineProvider }: UtterancePeekProps) {
  const [showAll, setShowAll] = useState(false)

  if (!data) {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            Utterance Preview
          </h2>
          <span className="v3-badge">loading</span>
        </div>
        <SkeletonPeek />
        <SkeletonPeek />
      </div>
    )
  }

  const utterances = data.results.slice(0, 3)
  const providers = activeProviders.length > 0
    ? activeProviders
    : (ALL_PROVIDERS as ProviderName[])

  const gridCols = Math.min(providers.length, 3)

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Utterance Comparison
        </h2>
        <span className="v3-badge">{utterances.length} samples</span>

        {/* Provider legend */}
        <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
          {providers.map((p) => (
            <span
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--ink-dim)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: PROVIDER_COLORS[p] || "var(--lav-2)",
                  display: "inline-block",
                }}
              />
              {PROVIDER_LABELS[p] ?? p}
            </span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="v3-btn"
          style={{ fontSize: 12 }}
        >
          {showAll ? (
            <>
              <Icon.ArrowUp style={{ width: 12, height: 12 }} />
              Hide full table
            </>
          ) : (
            <>
              <Icon.Activity style={{ width: 12, height: 12 }} />
              View all {data.results.length} results
            </>
          )}
        </button>
      </div>

      {/* Preview cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {utterances.map((result, i) => {
          const catClass = CATEGORY_CLASS[result.category] || ""
          const catLabel = CATEGORY_LABEL[result.category] || result.category
          const seed = hashSeed(result.test_id)

          const p50s = providers
            .map((p) => result.outputs[p]?.ttfb?.p50)
            .filter((v): v is number => v != null)
          const minP50 = p50s.length > 0 ? Math.min(...p50s) : null
          const maxP50 = p50s.length > 0 ? Math.max(...p50s) : null
          const delta = minP50 != null && maxP50 != null && maxP50 !== minP50
            ? maxP50 - minP50
            : null

          return (
            <div
              key={result.test_id}
              className="v3-card fade-up"
              style={{ padding: "20px", animationDelay: `${i * 0.1}s` }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className={`v3-pill ${catClass}`}
                  style={{ fontSize: 11, padding: "3px 9px" }}
                >
                  {catLabel}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    fontFamily: "Geist Mono, monospace",
                  }}
                >
                  {result.test_id}
                </span>
                {delta != null && (
                  <span
                    className="v3-badge"
                    style={{ color: "var(--lav-1)", background: "rgba(167,139,250,0.12)" }}
                  >
                    Δ {delta.toFixed(0)} ms
                  </span>
                )}
              </div>

              {/* Utterance text */}
              <blockquote
                style={{
                  margin: "0 0 16px",
                  padding: "10px 14px",
                  borderLeft: `2px solid ${PROVIDER_COLORS[providers[0]] || "var(--lav-2)"}`,
                  background: "rgba(255,255,255,0.015)",
                  borderRadius: "0 8px 8px 0",
                }}
              >
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{result.text}&rdquo;
                </p>
                {result.expected_behavior && (
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-faint)",
                      lineHeight: 1.5,
                      margin: "8px 0 0",
                      fontStyle: "normal",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 5,
                    }}
                  >
                    <span style={{ color: "var(--lav-2)", flexShrink: 0, marginTop: 1 }}>▸</span>
                    {result.expected_behavior}
                  </p>
                )}
              </blockquote>

              {/* Provider audio cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                  gap: 10,
                }}
              >
                {providers.map((p, pi) => {
                  const o = result.outputs[p]
                  const p50 = o?.ttfb?.[metric] ?? o?.ttfb?.p50 ?? 0
                  const p95 = o?.ttfb?.p95 ?? 0
                  const total = o?.total?.[metric] ?? o?.total?.p50 ?? 0
                  return (
                    <AudioCard
                      key={p}
                      seed={seed + pi * 31}
                      p50={p50}
                      p95={p95}
                      total={total}
                      n={o?.runs}
                      stream={o?.is_streaming}
                      role={p}
                      audioPath={o?.audio_path}
                      errors={o?.errors ?? 0}
                      errorMsg={o?.last_error}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full results table — toggled by "View all" button */}
      {showAll && (
        <div
          className="v3-card"
          style={{
            marginTop: 16,
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-2)",
              marginBottom: 16,
            }}
          >
            All results · {data.results.length} utterances
          </div>
          <div
            style={{
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid var(--line)",
            }}
          >
            <ResultsTable
              results={data.results}
              activeProviders={providers}
              metric={metric}
              baselineProvider={baselineProvider}
            />
          </div>
        </div>
      )}
    </div>
  )
}
