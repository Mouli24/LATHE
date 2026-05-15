import { useState } from "react"
import { Icon } from "./icons"

interface SidebarProps {
  activeTab: string
  mode: string
  onTabChange: (t: string) => void
  onModeChange: (m: string) => void
  providers: string[]
  p50Map?: Record<string, number>
}

const PROVIDER_COLORS: Record<string, string> = {
  smallest: "#a78bfa",
  sarvam: "#7dd3c0",
  groq: "#fbbf24",
}

const PROVIDER_LABELS: Record<string, string> = {
  smallest: "Smallest.ai",
  sarvam: "Sarvam AI",
  groq: "Groq PlayAI",
}

const NAV_ITEMS = [
  { id: "dash", label: "Dashboard", icon: "Activity" as const },
  { id: "providers", label: "Providers", icon: "Layers" as const },
  { id: "categories", label: "Categories", icon: "Filter" as const },
  { id: "latency", label: "Latency Calculator", icon: "Zap" as const },
  { id: "api", label: "Data API", icon: "Globe" as const, external: true },
  { id: "liquid", label: "Liquid Bench", icon: "Sparkle" as const, beta: true },
]

export function Sidebar({ activeTab, mode, onTabChange, onModeChange, providers, p50Map = {} }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const displayProviders = providers.length > 0 ? providers : ["smallest", "sarvam", "groq"]

  return (
    <aside
      style={{
        width: collapsed ? 64 : 260,
        minWidth: collapsed ? 64 : 260,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--bg-1)",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "20px 12px" : "20px 16px",
        gap: 0,
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 10,
        transition: "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: "1px solid var(--line)",
          overflow: "hidden",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        {/* Concentric circles icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#a78bfa" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="5.5" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <circle cx="12" cy="12" r="2" fill="#a78bfa" />
          </svg>
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                Lathe®
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 1 }}>Voice AI Bench</div>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-faint)",
                cursor: "pointer",
                padding: 2,
                flexShrink: 0,
              }}
            >
              <Icon.Chevron
                style={{
                  width: 16,
                  height: 16,
                  transform: "rotate(90deg)",
                  transition: "transform 0.25s ease",
                }}
              />
            </button>
          </>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            style={{
              position: "absolute",
              top: 20,
              right: -1,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderLeft: "none",
              borderRadius: "0 8px 8px 0",
              color: "var(--ink-faint)",
              cursor: "pointer",
              padding: "4px 2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon.Chevron
              style={{
                width: 14,
                height: 14,
                transform: "rotate(-90deg)",
                transition: "transform 0.25s ease",
              }}
            />
          </button>
        )}
      </div>

      {/* Segmented mode toggle — hidden when collapsed */}
      {!collapsed && (
        <div
          style={{
            display: "flex",
            background: "var(--bg-2)",
            borderRadius: 10,
            padding: 3,
            marginBottom: 20,
            gap: 2,
          }}
        >
          {["Streaming", "Non-stream"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              style={{
                flex: 1,
                padding: "5px 0",
                borderRadius: 8,
                border: "none",
                fontSize: 11.5,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                background: mode === m ? "var(--bg-3)" : "transparent",
                color: mode === m ? "var(--ink)" : "var(--ink-faint)",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          marginBottom: 16,
          alignItems: collapsed ? "center" : "stretch",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const IconComp = Icon[item.icon]
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`v3-nav-item${isActive ? " active" : ""}`}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                justifyContent: collapsed ? "center" : undefined,
                padding: collapsed ? "0.62rem" : undefined,
              }}
            >
              {isActive && !collapsed && (
                <span
                  style={{
                    width: 3,
                    height: 16,
                    background: "var(--lav-2)",
                    borderRadius: 2,
                    marginRight: 9,
                    flexShrink: 0,
                    boxShadow: "0 0 8px var(--lav-2)",
                  }}
                />
              )}
              <IconComp
                style={{
                  width: 15,
                  height: 15,
                  flexShrink: 0,
                  color: isActive ? "var(--lav-2)" : undefined,
                }}
              />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.external && (
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M18 13v6H5V6h6M15 3h6v6M10 14 21 3" />
                </svg>
              )}
              {!collapsed && item.beta && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    background: "rgba(251,191,36,0.15)",
                    color: "#fbbf24",
                    padding: "1px 5px",
                    borderRadius: 4,
                    letterSpacing: "0.04em",
                  }}
                >
                  BETA
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Divider — hidden when collapsed */}
      {!collapsed && <div className="div-h" style={{ marginBottom: 16 }} />}

      {/* Active Runs — hidden when collapsed */}
      {!collapsed && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              paddingLeft: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Active Runs
            </span>
            <span
              className="v3-badge"
              style={{ background: "rgba(74,222,128,0.15)", color: "#86efac" }}
            >
              {displayProviders.length}
            </span>
            <Icon.Chevron style={{ width: 14, height: 14, color: "var(--ink-faint)", marginLeft: "auto" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {displayProviders.map((p) => {
              const color = PROVIDER_COLORS[p] || "#a78bfa"
              const label = PROVIDER_LABELS[p] || p
              const p50 = p50Map[p] ?? null
              return (
                <div
                  key={p}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    className="pulse-dot"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: "var(--ink-2)", flex: 1 }}>{label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "Geist Mono, monospace",
                      color,
                      fontWeight: 500,
                    }}
                  >
                    {p50 != null ? `${p50}ms` : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Activate Pro card — hidden when collapsed */}
      {!collapsed && (
        <div className="v3-card-gradient" style={{ padding: "16px", marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--lav-1)", marginBottom: 6 }}>
            Activate Pro
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: 12 }}>
            Unlock unlimited runs, advanced analytics, and team collaboration.
          </div>
          <button
            type="button"
            className="v3-btn v3-btn-primary"
            style={{ width: "100%", justifyContent: "center", fontSize: 12 }}
          >
            Upgrade Now
          </button>
        </div>
      )}
    </aside>
  )
}
