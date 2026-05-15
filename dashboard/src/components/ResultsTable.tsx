import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import type { TestResult, ProviderName, MetricKey } from "@/lib/types"
import { PROVIDER_LABELS, PROVIDER_COLORS, CATEGORY_COLORS, categoryLabel } from "@/lib/constants"

function MiniAudioPlayer({ audioPath, accent }: { audioPath: string; accent: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errored, setErrored] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setErrored(false)
  }, [audioPath])

  function toggle() {
    const a = audioRef.current
    if (!a || errored) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().catch(() => { setErrored(true); setPlaying(false) })
      setPlaying(true)
    }
  }

  if (errored) {
    return (
      <span style={{ fontSize: 10.5, color: "#fca5a5" }}>unavailable</span>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {/* Play / Pause button */}
        <button
          type="button"
          onClick={toggle}
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: accent + "22",
            border: `1px solid ${accent}55`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1"/>
              <rect x="14" y="5" width="4" height="14" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <path d="M6 4.5v15l13-7.5z"/>
            </svg>
          )}
        </button>

        {/* Inline progress bar */}
        <div
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            minWidth: 60,
            cursor: "pointer",
          }}
          onClick={(e) => {
            const a = audioRef.current
            if (!a || !a.duration) return
            const rect = e.currentTarget.getBoundingClientRect()
            a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: accent,
              borderRadius: 2,
              transition: "width 0.1s linear",
            }}
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={`/${audioPath}`}
        preload="metadata"
        onTimeUpdate={() => {
          const a = audioRef.current
          if (a && a.duration > 0) setProgress(a.currentTime / a.duration)
        }}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onError={() => { setErrored(true); setPlaying(false) }}
      />
    </div>
  )
}

function ttfbVariant(ms: number | null | undefined): "green" | "yellow" | "red" | "gray" {
  if (ms === null || ms === undefined) return "gray"
  if (ms < 200) return "green"
  if (ms < 500) return "yellow"
  return "red"
}

type SortKey = "test_id" | "category" | ProviderName

interface ResultsTableProps {
  results: TestResult[]
  activeProviders: ProviderName[]
  metric: MetricKey
  baselineProvider?: ProviderName | null
}

export function ResultsTable({ results, activeProviders, metric, baselineProvider }: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("test_id")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = [...results].sort((a, b) => {
    let av: number | string = 0
    let bv: number | string = 0
    if (sortKey === "test_id") {
      av = a.test_id
      bv = b.test_id
    } else if (sortKey === "category") {
      av = a.category
      bv = b.category
    } else {
      av = a.outputs[sortKey]?.ttfb?.[metric] ?? Number.POSITIVE_INFINITY
      bv = b.outputs[sortKey]?.ttfb?.[metric] ?? Number.POSITIVE_INFINITY
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1
    if (av > bv) return sortDir === "asc" ? 1 : -1
    return 0
  })

  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : "")

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th
              className="px-4 py-3 text-left font-medium cursor-pointer select-none"
              onClick={() => toggleSort("test_id")}
            >
              Utterance{arrow("test_id")}
            </th>
            {activeProviders.map((p) => (
              <th
                key={p}
                className="px-4 py-3 text-left font-medium whitespace-nowrap cursor-pointer select-none"
                onClick={() => toggleSort(p)}
              >
                {PROVIDER_LABELS[p]} ({metric.toUpperCase()}){arrow(p)}
                {baselineProvider === p && (
                  <span className="ml-1.5 text-xs font-normal opacity-60">baseline</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.test_id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 max-w-xs">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex self-start items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      CATEGORY_COLORS[row.category] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {categoryLabel(row.category)}
                  </span>
                  <span className="text-sm leading-snug" title={row.expected_behavior}>
                    {row.text}
                  </span>
                  <span className="text-xs text-muted-foreground">{row.test_id}</span>
                </div>
              </td>
              {activeProviders.map((p) => {
                const out = row.outputs[p]
                if (!out) return <td key={p} className="px-4 py-3 text-muted-foreground">—</td>
                if (out.last_error && !out.ttfb) {
                  return (
                    <td key={p} className="px-4 py-3">
                      <Badge variant="red" title={out.last_error}>Error</Badge>
                    </td>
                  )
                }
                const metricVal = out.ttfb?.[metric] ?? null
                const baselineVal = baselineProvider && baselineProvider !== p
                  ? (row.outputs[baselineProvider]?.ttfb?.[metric] ?? null)
                  : null
                const delta = metricVal != null && baselineVal != null ? metricVal - baselineVal : null
                return (
                  <td key={p} className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      {out.audio_path && (
                        <MiniAudioPlayer
                          audioPath={out.audio_path}
                          accent={PROVIDER_COLORS[p] ?? "#a78bfa"}
                        />
                      )}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={ttfbVariant(metricVal)}>
                          {metric.toUpperCase()} {metricVal !== null ? `${Math.round(metricVal)}ms` : "—"}
                        </Badge>
                        {delta !== null && (
                          <Badge
                            variant={delta <= 0 ? "green" : "red"}
                            title={`vs ${PROVIDER_LABELS[baselineProvider!]} baseline`}
                          >
                            Δ {delta > 0 ? "+" : ""}{Math.round(delta)}ms
                          </Badge>
                        )}
                        {out.ttfb && metric !== "p95" && (
                          <Badge variant="secondary" title="p95 TTFB">
                            p95 {Math.round(out.ttfb.p95)}ms
                          </Badge>
                        )}
                        {out.total && (
                          <Badge variant="secondary" title={`${metric.toUpperCase()} total time`}>
                            {Math.round(out.total[metric])}ms total
                          </Badge>
                        )}
                        {out.runs > 1 && (
                          <Badge variant="outline" title="number of samples">
                            n={out.runs}
                          </Badge>
                        )}
                        {out.errors > 0 && (
                          <Badge variant="yellow" title={out.last_error ?? ""}>
                            {out.errors} err
                          </Badge>
                        )}
                        {!out.is_streaming && (
                          <Badge variant="outline" title="provider response is non-streaming; TTFB ~ total">
                            non-stream
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
