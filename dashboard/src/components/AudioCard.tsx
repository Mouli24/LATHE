import { useState } from "react"
import { Icon } from "./icons"
import { Waveform } from "./Waveform"

type ProviderRole = "smallest" | "sarvam" | "groq"

interface AudioCardProps {
  seed?: number
  p50: number
  p95: number
  total: number
  n?: number
  stream?: boolean
  role?: ProviderRole
}

const ROLE_COLORS: Record<ProviderRole, string> = {
  smallest: "#a78bfa",
  sarvam: "#7dd3c0",
  groq: "#fbbf24",
}

const ROLE_LABELS: Record<ProviderRole, string> = {
  smallest: "Smallest.ai",
  sarvam: "Sarvam AI",
  groq: "Groq PlayAI",
}

export function AudioCard({
  seed = 42,
  p50,
  p95,
  total,
  n,
  stream,
  role = "smallest",
}: AudioCardProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const accent = ROLE_COLORS[role]
  const label = ROLE_LABELS[role]

  function handlePlayPause() {
    setPlaying((v) => !v)
    if (!playing) setProgress(0)
  }

  function handleWaveformClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    setProgress(x / rect.width)
  }

  return (
    <div
      className="v3-card-2"
      style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: accent,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>{label}</span>
        {stream && (
          <span
            className="v3-badge"
            style={{ marginLeft: "auto", fontSize: 10, color: accent }}
          >
            stream
          </span>
        )}
        {n !== undefined && (
          <span
            className="v3-badge"
            style={{ marginLeft: stream ? 4 : "auto", fontSize: 10 }}
          >
            n={n}
          </span>
        )}
      </div>

      {/* waveform + play */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={handlePlayPause}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: accent + "22",
            border: `1px solid ${accent}44`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {playing ? (
            <Icon.Pause style={{ width: 12, height: 12 }} />
          ) : (
            <Icon.Play style={{ width: 12, height: 12 }} />
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Waveform
            seed={seed}
            playing={playing}
            progress={progress}
            accent={accent}
            height={32}
            bars={36}
            onClick={handleWaveformClick}
          />
        </div>
      </div>

      {/* metrics */}
      <div
        style={{
          display: "flex",
          gap: 12,
          paddingTop: 4,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              color: "var(--ink-faint)",
              fontFamily: "Geist Mono, monospace",
              letterSpacing: "0.08em",
              marginBottom: 2,
            }}
          >
            P50
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: accent,
              fontFamily: "Geist Mono, monospace",
            }}
          >
            {p50.toFixed(0)}
            <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-dim)", marginLeft: 1 }}>ms</span>
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              color: "var(--ink-faint)",
              fontFamily: "Geist Mono, monospace",
              letterSpacing: "0.08em",
              marginBottom: 2,
            }}
          >
            P95
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-2)",
              fontFamily: "Geist Mono, monospace",
            }}
          >
            {p95.toFixed(0)}
            <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-dim)", marginLeft: 1 }}>ms</span>
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              color: "var(--ink-faint)",
              fontFamily: "Geist Mono, monospace",
              letterSpacing: "0.08em",
              marginBottom: 2,
            }}
          >
            TOTAL
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-2)",
              fontFamily: "Geist Mono, monospace",
            }}
          >
            {total.toFixed(0)}
            <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-dim)", marginLeft: 1 }}>ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}
