import type { RunResults, ProviderName } from "@/lib/types"
import { ALL_PROVIDERS } from "@/lib/constants"
import { NumTicker } from "./NumTicker"
import { HeroSparkline } from "./HeroSparkline"
import { Icon } from "./icons"

interface HeroCardsProps {
  data: RunResults | null
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

const PROVIDER_INITIALS: Record<ProviderName, string> = {
  smallest: "SM",
  groq: "GR",
  sarvam: "SV",
}

const PROVIDER_CATS: Record<ProviderName, string[]> = {
  smallest: ["OTP", "Hinglish"],
  groq: ["OTP", "Nouns"],
  sarvam: ["Hinglish", "Nouns"],
}

function generateFallbackSeries(seed: number, n = 12): number[] {
  let s = seed * 9301 + 49297
  return Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280
    return 200 + (s / 233280) * 600
  })
}

function getProviderP50(data: RunResults, provider: ProviderName): number {
  const vals: number[] = []
  for (const result of data.results) {
    const o = result.outputs[provider]
    if (o?.ttfb?.p50 != null) vals.push(o.ttfb.p50)
  }
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getProviderSamples(data: RunResults, provider: ProviderName): number[] {
  for (const result of data.results) {
    const o = result.outputs[provider]
    if (o?.ttfb?.samples && o.ttfb.samples.length > 3) return o.ttfb.samples
  }
  return []
}

// Skeleton card
function SkeletonCard() {
  return (
    <div
      className="v3-card fade-up"
      style={{ padding: "20px", minHeight: 200 }}
    >
      <div
        style={{
          width: "60%",
          height: 12,
          borderRadius: 6,
          background: "var(--bg-3)",
          marginBottom: 12,
        }}
      />
      <div
        style={{
          width: "40%",
          height: 36,
          borderRadius: 8,
          background: "var(--bg-3)",
          marginBottom: 16,
        }}
      />
      <div
        style={{
          width: "100%",
          height: 60,
          borderRadius: 8,
          background: "var(--bg-3)",
        }}
      />
    </div>
  )
}

interface HeroCardProps {
  provider: ProviderName
  p50: number
  slowestP50: number
  samples: number[]
  index: number
}

function HeroCard({ provider, p50, slowestP50, samples, index }: HeroCardProps) {
  const color = PROVIDER_COLORS[provider]
  const label = PROVIDER_LABELS[provider]
  const initials = PROVIDER_INITIALS[provider]
  const cats = PROVIDER_CATS[provider]

  const perfPct = slowestP50 > 0 ? ((slowestP50 - p50) / slowestP50) * 100 : 0
  const isFastest = perfPct >= 0

  const series = samples.length > 3 ? samples : generateFallbackSeries(index * 137 + 42)

  return (
    <div
      className="v3-card fade-up"
      style={{
        padding: "20px",
        animationDelay: `${index * 0.1}s`,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Provider icon */}
        <div
          style={{
            width: 38,
            height: 38,
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

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category tags */}
          <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
            {cats.map((cat) => (
              <span
                key={cat}
                className="v3-badge"
                style={{ fontSize: 9.5, letterSpacing: "0.03em" }}
              >
                {cat}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>
            {initials} · stream
          </div>
        </div>

        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-faint)",
            cursor: "pointer",
            padding: 2,
          }}
        >
          <Icon.MoreH style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Big P50 number */}
      <div>
        <div
          style={{
            fontSize: "clamp(28px, 3.5vw, 42px)",
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "Geist Mono, monospace",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          <NumTicker value={Math.round(p50)} duration={1200} />
          <span
            style={{ fontSize: "0.45em", fontWeight: 400, color: "var(--ink-dim)", marginLeft: 3 }}
          >
            ms
          </span>
        </div>

        {/* Change badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
          }}
        >
          <span
            className={isFastest ? "v3-badge v3-badge-pos" : "v3-badge v3-badge-neg"}
          >
            {isFastest ? (
              <Icon.ArrowUp style={{ width: 9, height: 9 }} />
            ) : (
              <Icon.ArrowDown style={{ width: 9, height: 9 }} />
            )}
            {Math.abs(perfPct).toFixed(1)}%
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>vs slowest</span>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ marginTop: "auto" }}>
        <HeroSparkline
          series={series}
          color={color}
          trend={isFastest ? "up" : "down"}
          height={56}
        />
      </div>

      {/* Delta label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--ink-faint)",
        }}
      >
        <span style={{ fontFamily: "Geist Mono, monospace" }}>
          P50 TTFB · ms
        </span>
        <span style={{ color }}>
          Δ {Math.abs(slowestP50 - p50).toFixed(0)}ms
        </span>
      </div>
    </div>
  )
}

export function HeroCards({ data }: HeroCardsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ALL_PROVIDERS.map((p) => (
          <SkeletonCard key={p} />
        ))}
      </div>
    )
  }

  const providers = data.providers.length > 0 ? data.providers : (ALL_PROVIDERS as ProviderName[])

  const p50Map: Record<string, number> = {}
  for (const p of providers) {
    p50Map[p] = getProviderP50(data, p)
  }

  const slowestP50 = Math.max(...Object.values(p50Map))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {providers.map((p, i) => (
        <HeroCard
          key={p}
          provider={p}
          p50={p50Map[p] ?? 0}
          slowestP50={slowestP50}
          samples={getProviderSamples(data, p)}
          index={i}
        />
      ))}
    </div>
  )
}
