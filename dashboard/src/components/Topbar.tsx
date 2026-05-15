import { Icon } from "./icons"

interface TopbarProps {
  runId?: string
}

export function Topbar({ runId }: TopbarProps) {
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
        {/* gradient avatar */}
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
        style={{ borderRadius: 999, padding: "7px 16px", fontSize: 13 }}
      >
        <Icon.Sparkle style={{ width: 13, height: 13 }} />
        Run Bench
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
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #b69cff, #8b5cf6)",
            fontSize: 8,
            fontWeight: 700,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          2
        </span>
      </button>

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
          cursor: "text",
          minWidth: 160,
        }}
      >
        <Icon.Search style={{ width: 13, height: 13, flexShrink: 0 }} />
        <span>Search…</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            background: "var(--bg-3)",
            padding: "1px 5px",
            borderRadius: 5,
            fontFamily: "Geist Mono, monospace",
            color: "var(--ink-faint)",
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Settings */}
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
    </header>
  )
}
