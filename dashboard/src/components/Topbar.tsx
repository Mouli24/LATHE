import { useState, useRef, useEffect } from "react"
import { Icon } from "./icons"
import type { RunResults } from "@/lib/types"

interface TopbarProps {
  runId?: string
  onRefresh?: () => void
  refreshing?: boolean
  searchQuery?: string
  onSearchChange?: (q: string) => void
  data?: RunResults | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ago`
  if (hrs > 0) return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return "just now"
}

function getFastestProviderName(data: RunResults): string {
  let best = data.providers[0] ?? "—"
  let bestVal = Infinity
  for (const p of data.providers) {
    const vals = data.results
      .map((r) => r.outputs[p]?.ttfb?.p50)
      .filter((v): v is number => v != null && v > 0)
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      if (avg < bestVal) { bestVal = avg; best = p }
    }
  }
  return best
}

function getFastestP50(data: RunResults): number {
  let bestVal = Infinity
  for (const p of data.providers) {
    const vals = data.results
      .map((r) => r.outputs[p]?.ttfb?.p50)
      .filter((v): v is number => v != null && v > 0)
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      if (avg < bestVal) bestVal = avg
    }
  }
  return bestVal === Infinity ? 0 : bestVal
}

export function Topbar({
  runId,
  onRefresh,
  refreshing = false,
  searchQuery = "",
  onSearchChange,
  data,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const totalErrors = data
    ? data.providers.reduce(
        (sum, p) => sum + data.results.reduce((s, r) => s + (r.outputs[p]?.errors ?? 0), 0),
        0
      )
    : 0

  const fastestProvider = data ? getFastestProviderName(data) : null
  const fastestP50 = data ? getFastestP50(data) : 0
  const showBadge = !notifDismissed && !showNotifications && !!data

  return (
    <header
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 28px 0 24px",
        borderBottom: "1px solid var(--line)",
        background: "var(--bg-1)",
        position: "sticky",
        top: 0,
        zIndex: 9,
      }}
    >
      {/* User pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 10px",
          borderRadius: 999,
          border: "1px solid var(--line-2)",
          background: "rgba(255,255,255,0.025)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #a78bfa 0%, #7dd3c0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          P
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1 }}>
            @priya.bench{" "}
            <span
              className="v3-badge v3-badge-pro"
              style={{ fontSize: 9, padding: "1px 4px", verticalAlign: "middle" }}
            >
              PRO
            </span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
            Priya Iyer
          </div>
        </div>
        <Icon.Chevron style={{ width: 14, height: 14, color: "var(--ink-faint)" }} />
      </div>

      {/* Run Bench button */}
      <button
        type="button"
        className="v3-btn v3-btn-primary"
        style={{ borderRadius: 999, padding: "7px 16px", fontSize: 13, opacity: refreshing ? 0.7 : 1 }}
        onClick={() => onRefresh?.()}
        disabled={refreshing}
      >
        {refreshing ? (
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.22-8.56" />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </svg>
        ) : (
          <Icon.Sparkle style={{ width: 13, height: 13 }} />
        )}
        {refreshing ? "Loading…" : "Run Bench"}
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {runId && (
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-faint)",
            fontFamily: "Geist Mono, monospace",
          }}
        >
          {runId.slice(0, 12)}…
        </div>
      )}

      {/* Bell */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button
          type="button"
          style={{
            position: "relative",
            background: "none",
            border: "1px solid var(--line-2)",
            borderRadius: 9,
            color: "var(--ink-dim)",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => {
            setShowNotifications((v) => !v)
            setNotifDismissed(true)
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {showBadge && (
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "linear-gradient(180deg, #b69cff, #8b5cf6)",
              }}
            />
          )}
        </button>

        {showNotifications && (
          <div
            className="v3-card"
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              zIndex: 50,
              minWidth: 280,
              padding: "16px",
              border: "1px solid var(--line-2)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                Recent Activity
              </span>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ✕
              </button>
            </div>

            {data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    icon: "✓",
                    iconColor: "#86efac",
                    title: "Benchmark complete",
                    sub: `${data.run_id?.slice(0, 14) ?? "—"} · ${timeAgo(data.generated_at)}`,
                  },
                  {
                    icon: "⚡",
                    iconColor: "#fbbf24",
                    title: `Fastest: ${fastestProvider ?? "—"}`,
                    sub: `P50 ${Math.round(fastestP50)} ms`,
                  },
                  {
                    icon: "◈",
                    iconColor: "var(--lav-2)",
                    title: `${data.providers.length} providers tested`,
                    sub: `${data.results.length} utterances`,
                  },
                  {
                    icon: totalErrors > 0 ? "✗" : "●",
                    iconColor: totalErrors > 0 ? "#fca5a5" : "#86efac",
                    title: `${totalErrors} errors`,
                    sub: totalErrors > 0 ? "Check provider outputs" : "All runs successful",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="v3-card-2"
                    style={{
                      padding: "9px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: item.iconColor,
                        width: 20,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-faint)",
                          fontFamily: "Geist Mono, monospace",
                        }}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", textAlign: "center", padding: "12px 0" }}>
                No runs loaded yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid var(--line-2)",
          background: "rgba(255,255,255,0.025)",
          color: "var(--ink-faint)",
          fontSize: 12.5,
          minWidth: 180,
        }}
      >
        <Icon.Search style={{ width: 13, height: 13, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search utterances…"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--ink)",
            fontSize: 12.5,
            flex: 1,
            minWidth: 0,
          }}
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-faint)",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              padding: 0,
              marginLeft: "auto",
            }}
          >
            ✕
          </button>
        ) : (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              background: "var(--bg-3)",
              padding: "1px 5px",
              borderRadius: 5,
              fontFamily: "Geist Mono, monospace",
              color: "var(--ink-faint)",
              flexShrink: 0,
            }}
          >
            ⌘K
          </span>
        )}
      </div>

      {/* Settings */}
      <div ref={settingsRef} style={{ position: "relative" }}>
        <button
          type="button"
          style={{
            background: "none",
            border: "1px solid var(--line-2)",
            borderRadius: 9,
            color: "var(--ink-dim)",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowSettings((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {showSettings && (
          <div
            className="v3-card"
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              zIndex: 50,
              minWidth: 240,
              padding: "16px",
              border: "1px solid var(--line-2)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Run Metadata</span>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ✕
              </button>
            </div>
            {data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Run ID", value: data.run_id },
                  {
                    label: "Generated",
                    value: new Date(data.generated_at).toLocaleString(),
                  },
                  { label: "Utterances", value: String(data.results.length) },
                  { label: "Providers", value: data.providers.join(", ") },
                  { label: "Runs/cell", value: String(data.runs_per_cell ?? 1) },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--ink-2)",
                        fontFamily: "Geist Mono, monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>No data loaded</div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
