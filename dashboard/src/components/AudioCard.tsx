import { useState, useRef, useEffect } from "react"
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
  audioPath?: string | null
  errors?: number
  errorMsg?: string | null
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
  audioPath,
  errors = 0,
  errorMsg,
}: AudioCardProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const accent = ROLE_COLORS[role]
  const label = ROLE_LABELS[role]
  const hasAudio = !!audioPath && !loadError

  useEffect(() => {
    setLoadError(false)
    setPlaying(false)
    setProgress(0)
  }, [audioPath])

  function handlePlayPause() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => {
        setLoadError(true)
        setPlaying(false)
      })
      setPlaying(true)
    }
  }

  function handleWaveformClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const audio = audioRef.current
    if (audio && audio.duration) {
      audio.currentTime = pct * audio.duration
      setProgress(pct)
    }
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
          onClick={hasAudio ? handlePlayPause : undefined}
          disabled={!hasAudio}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: hasAudio ? accent + "22" : "var(--bg-3)",
            border: `1px solid ${hasAudio ? accent + "44" : "var(--line)"}`,
            color: hasAudio ? accent : "var(--ink-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: hasAudio ? "pointer" : "not-allowed",
            flexShrink: 0,
            opacity: hasAudio ? 1 : 0.45,
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
            accent={hasAudio ? accent : "var(--bg-3)"}
            height={32}
            bars={36}
            onClick={hasAudio ? handleWaveformClick : undefined}
          />
        </div>
      </div>

      {/* Hidden audio element — drives actual playback */}
      {audioPath && (
        <audio
          ref={audioRef}
          src={`/${audioPath}`}
          onTimeUpdate={() => {
            const a = audioRef.current
            if (a && a.duration > 0) setProgress(a.currentTime / a.duration)
          }}
          onEnded={() => {
            setPlaying(false)
            setProgress(0)
          }}
          onError={() => {
            setLoadError(true)
            setPlaying(false)
          }}
        />
      )}

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
              color: p50 > 0 ? accent : "var(--ink-faint)",
              fontFamily: "Geist Mono, monospace",
            }}
          >
            {p50 > 0 ? (
              <>
                {p50.toFixed(0)}
                <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-dim)", marginLeft: 1 }}>ms</span>
              </>
            ) : "—"}
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
            {p95 > 0 ? (
              <>
                {p95.toFixed(0)}
                <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-dim)", marginLeft: 1 }}>ms</span>
              </>
            ) : "—"}
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
            {total > 0 ? (
              <>
                {total.toFixed(0)}
                <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-dim)", marginLeft: 1 }}>ms</span>
              </>
            ) : "—"}
          </div>
        </div>
      </div>

      {/* No audio state */}
      {!audioPath && errors === 0 && (
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--line)",
            fontSize: 10.5,
            color: "var(--ink-faint)",
          }}
        >
          No audio recorded
        </div>
      )}

      {/* Load error (file missing / codec issue) */}
      {audioPath && loadError && (
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.20)",
            fontSize: 10.5,
            color: "#fca5a5",
          }}
        >
          Audio file unavailable
        </div>
      )}

      {/* Provider error indicator */}
      {errors > 0 && (() => {
        const isTerms = errorMsg?.includes("terms acceptance") || errorMsg?.includes("terms at")
        const termsUrl = (() => {
          if (!errorMsg) return null
          const m = errorMsg.match(/https?:\/\/[^\s"\\]+/)
          return m ? m[0].replace(/\\"/g, "") : null
        })()

        return (
          <div
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.22)",
              fontSize: 10.5,
              color: "#fca5a5",
              lineHeight: 1.5,
            }}
          >
            {isTerms ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Model terms not accepted</div>
                {termsUrl && (
                  <a
                    href={termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#fbbf24",
                      textDecoration: "underline",
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    Accept terms on Groq Console →
                  </a>
                )}
              </>
            ) : (
              <>
                {errors} error{errors > 1 ? "s" : ""}
                {errorMsg ? ` · ${errorMsg.replace(/\{.*\}/s, "").slice(0, 60).trim()}` : ""}
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}
