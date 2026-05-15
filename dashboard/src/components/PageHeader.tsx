import { useState, useEffect } from "react"
import { Icon } from "./icons"
import type { ProviderName, MetricKey } from "@/lib/types"
import { PROVIDER_LABELS } from "@/lib/constants"

const PROVIDER_COLORS: Record<ProviderName, string> = {
  smallest: "#a78bfa",
  groq: "#fbbf24",
  sarvam: "#7dd3c0",
}

const CATEGORY_LABELS: Record<string, string> = {
  credit_card_otp_readback: "OTP",
  hinglish_codeswitch: "Hinglish",
  indian_proper_nouns_and_codes: "Proper Nouns",
}

interface PageHeaderProps {
  totalProviders: number
  categories: string[]
  selectedCategory: string
  onCategoryChange: (v: string) => void
  activeProviders: ProviderName[]
  availableProviders: ProviderName[]
  onProviderToggle: (p: ProviderName) => void
  metric: MetricKey
  onMetricChange: (m: MetricKey) => void
  streamingFilter: "all" | "streaming" | "non-streaming"
  onStreamingFilterChange: (f: "all" | "streaming" | "non-streaming") => void
}

const SUB_TABS: { label: string; filter: "all" | "streaming" | "non-streaming" }[] = [
  { label: "Bench", filter: "all" },
  { label: "Streaming", filter: "streaming" },
  { label: "Robustness", filter: "non-streaming" },
]

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "p50", label: "P50" },
  { key: "p95", label: "P95" },
  { key: "mean", label: "Mean" },
]

export function PageHeader({
  totalProviders,
  categories,
  selectedCategory,
  onCategoryChange,
  activeProviders,
  availableProviders,
  onProviderToggle,
  metric,
  onMetricChange,
  streamingFilter,
  onStreamingFilterChange,
}: PageHeaderProps) {
  const [activeSubTab, setActiveSubTab] = useState(
    SUB_TABS.find((t) => t.filter === streamingFilter)?.label ?? "Bench"
  )

  // Sync from external streamingFilter changes
  useEffect(() => {
    const tab = SUB_TABS.find((t) => t.filter === streamingFilter)
    if (tab && tab.label !== activeSubTab) {
      setActiveSubTab(tab.label)
    }
  }, [streamingFilter])

  function handleSubTab(tab: typeof SUB_TABS[0]) {
    setActiveSubTab(tab.label)
    onStreamingFilterChange(tab.filter)
  }

  return (
    <div
      style={{
        padding: "16px 28px 0 28px",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* top row: sub-tabs + filter controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {/* Segmented sub-tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-2)",
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {SUB_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => handleSubTab(t)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                background: activeSubTab === t.label ? "var(--card)" : "transparent",
                color: activeSubTab === t.label ? "var(--ink)" : "var(--ink-faint)",
                boxShadow:
                  activeSubTab === t.label ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Metric selector */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-2)",
            borderRadius: 8,
            padding: 2,
            gap: 1,
          }}
        >
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onMetricChange(m.key)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                fontSize: 11.5,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                background:
                  metric === m.key ? "rgba(167,139,250,0.18)" : "transparent",
                color:
                  metric === m.key ? "var(--lav-1)" : "var(--ink-faint)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className="v3-btn"
              style={{
                padding: "4px 10px",
                fontSize: 11.5,
                background:
                  selectedCategory === "all"
                    ? "rgba(167,139,250,0.14)"
                    : undefined,
                borderColor:
                  selectedCategory === "all"
                    ? "rgba(167,139,250,0.35)"
                    : undefined,
                color: selectedCategory === "all" ? "var(--lav-1)" : undefined,
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className="v3-btn"
                style={{
                  padding: "4px 10px",
                  fontSize: 11.5,
                  background:
                    selectedCategory === cat
                      ? "rgba(167,139,250,0.14)"
                      : undefined,
                  borderColor:
                    selectedCategory === cat
                      ? "rgba(167,139,250,0.35)"
                      : undefined,
                  color:
                    selectedCategory === cat ? "var(--lav-1)" : undefined,
                }}
              >
                <Icon.Filter style={{ width: 11, height: 11 }} />
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* second row: eyebrow + headline + provider toggles */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingBottom: 14,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span className="eyebrow">Recommended providers for 24 hours</span>
            <span
              className="v3-pill"
              style={{ fontSize: 11, padding: "2px 8px" }}
            >
              {totalProviders} Providers
            </span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(22px, 2.5vw, 30px)",
              fontWeight: 400,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Top Voice AI Providers
          </h1>
        </div>

        {/* Provider toggles */}
        {availableProviders.length > 0 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {availableProviders.map((p) => {
              const active = activeProviders.includes(p)
              const color = PROVIDER_COLORS[p] || "#a78bfa"
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onProviderToggle(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: `1px solid ${active ? color + "55" : "var(--line-2)"}`,
                    background: active ? color + "15" : "rgba(255,255,255,0.025)",
                    color: active ? color : "var(--ink-faint)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: active ? 1 : 0.55,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: active ? color : "var(--ink-faint)",
                      flexShrink: 0,
                    }}
                  />
                  {PROVIDER_LABELS[p] ?? p}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
