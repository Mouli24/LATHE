import type { RunResults, ProviderName } from "@/lib/types"
import { ALL_PROVIDERS } from "@/lib/constants"
import { AudioCard } from "./AudioCard"

interface UtterancePeekProps {
  data: RunResults | null
  activeProviders: ProviderName[]
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

export function UtterancePeek({ data, activeProviders }: UtterancePeekProps) {
  if (!data) {
    return (
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
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

  const utterances = data.results.slice(0, 2)
  const providers = activeProviders.length > 0
    ? activeProviders
    : (ALL_PROVIDERS as ProviderName[])

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Utterance Preview
        </h2>
        <span className="v3-badge">{utterances.length} samples</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {utterances.map((result, i) => {
          const catClass = CATEGORY_CLASS[result.category] || ""
          const catLabel = CATEGORY_LABEL[result.category] || result.category
          const seed = hashSeed(result.test_id)

          // compute best delta across providers
          const p50s = providers
            .map((p) => result.outputs[p]?.ttfb?.p50)
            .filter((v): v is number => v != null)
          const minP50 = p50s.length > 0 ? Math.min(...p50s) : null
          const maxP50 = p50s.length > 0 ? Math.max(...p50s) : null
          const delta = minP50 != null && maxP50 != null ? maxP50 - minP50 : null

          return (
            <div
              key={result.test_id}
              className="v3-card fade-up"
              style={{
                padding: "20px",
                animationDelay: `${i * 0.12}s`,
              }}
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
                {/* Category pill */}
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
                    style={{
                      color: "var(--pos)",
                      background: "rgba(74,222,128,0.10)",
                    }}
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
                    fontSize: 14,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{result.text}&rdquo;
                </p>
              </blockquote>

              {/* Provider audio cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(providers.length, 3)}, 1fr)`,
                  gap: 10,
                }}
              >
                {providers.map((p, pi) => {
                  const o = result.outputs[p]
                  const p50 = o?.ttfb?.p50 ?? 0
                  const p95 = o?.ttfb?.p95 ?? 0
                  const total = o?.total?.p50 ?? 0
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
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
