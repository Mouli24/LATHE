import { useState } from "react"
import { Icon } from "./icons"

interface PageHeaderProps {
  totalProviders: number
}

const SUB_TABS = ["Bench", "Streaming", "Robustness"]

export function PageHeader({ totalProviders }: PageHeaderProps) {
  const [activeSubTab, setActiveSubTab] = useState("Bench")

  return (
    <div
      style={{
        padding: "16px 28px 0 28px",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* top row: sub-tabs + filter pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
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
              key={t}
              type="button"
              onClick={() => setActiveSubTab(t)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                background: activeSubTab === t ? "var(--card)" : "transparent",
                color: activeSubTab === t ? "var(--ink)" : "var(--ink-faint)",
                boxShadow:
                  activeSubTab === t ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter pills */}
        {["24H", "Streaming", "Desc"].map((f) => (
          <button
            key={f}
            type="button"
            className="v3-btn"
            style={{ padding: "5px 10px", fontSize: 12 }}
          >
            <Icon.Filter style={{ width: 12, height: 12, color: "var(--ink-faint)" }} />
            {f}
          </button>
        ))}
      </div>

      {/* bottom row: eyebrow + headline */}
      <div style={{ paddingBottom: 16 }}>
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
    </div>
  )
}
