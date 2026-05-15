import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { TestResult, ProviderName, MetricKey } from "@/lib/types"
import { PROVIDER_LABELS, CATEGORY_COLORS, categoryLabel } from "@/lib/constants"

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
                        <audio
                          controls
                          src={`/${out.audio_path}`}
                          className="h-10 w-full min-w-[200px]"
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
