import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filters } from "@/components/Filters"
import { LatencyChart } from "@/components/LatencyChart"
import { ResultsTable } from "@/components/ResultsTable"
import { KpiCards } from "@/components/KpiCards"
import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { ALL_PROVIDERS } from "@/lib/constants"

const THEME_KEY = "lathe.theme"

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement
  if (theme === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
}

export default function App() {
  const [data, setData] = useState<RunResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeProviders, setActiveProviders] = useState<ProviderName[]>(ALL_PROVIDERS)
  const [metric, setMetric] = useState<MetricKey>("p50")
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light"
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === "dark" || saved === "light") return saved
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    fetch("/results.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load results.json: ${r.status}`)
        return r.json()
      })
      .then((d: RunResults) => {
        setData(d)
        const avail = d.providers.filter((p): p is ProviderName =>
          (ALL_PROVIDERS as string[]).includes(p)
        )
        setActiveProviders(avail.length > 0 ? avail : ALL_PROVIDERS)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-72 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  const categories = [...new Set(data.results.map((r) => r.category))].sort()
  const availableProviders = data.providers.filter((p): p is ProviderName =>
    (ALL_PROVIDERS as string[]).includes(p)
  )

  const filtered = data.results.filter(
    (r) => selectedCategory === "all" || r.category === selectedCategory
  )

  function toggleProvider(p: ProviderName) {
    setActiveProviders((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    )
  }

  function exportCsv() {
    const header = [
      "test_id",
      "category",
      "text",
      ...activeProviders.flatMap((p) => [
        `${p}_p50_ttfb_ms`,
        `${p}_p95_ttfb_ms`,
        `${p}_mean_ttfb_ms`,
        `${p}_p50_total_ms`,
        `${p}_runs`,
        `${p}_errors`,
      ]),
    ]
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = filtered.map((r) => {
      const base = [r.test_id, r.category, r.text]
      const cells = activeProviders.flatMap((p) => {
        const o = r.outputs[p]
        return [
          o?.ttfb?.p50 ?? "",
          o?.ttfb?.p95 ?? "",
          o?.ttfb?.mean ?? "",
          o?.total?.p50 ?? "",
          o?.runs ?? "",
          o?.errors ?? "",
        ]
      })
      return [...base, ...cells].map(escape).join(",")
    })
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lathe-${data!.run_id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const runDate = new Date(data.generated_at).toLocaleString()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 text-foreground">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LATHE</h1>
          <p className="text-muted-foreground text-sm">
            Latency-Aware Test Harness for Voice AI · Indian-language benchmark
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Run {data.run_id} · {runDate} · {data.results.length} utterances
            {data.runs_per_cell ? ` · n=${data.runs_per_cell} per cell` : ""}
          </p>
          {data.skipped_providers && data.skipped_providers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Skipped: {data.skipped_providers.join(", ")} (missing API keys)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="inline-flex items-center rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      <KpiCards results={filtered} activeProviders={activeProviders} metric={metric} />

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">TTFB by Category</CardTitle>
          <Badge variant="secondary">{metric.toUpperCase()}</Badge>
        </CardHeader>
        <CardContent>
          <LatencyChart results={filtered} activeProviders={activeProviders} metric={metric} />
        </CardContent>
      </Card>

      <Filters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        activeProviders={activeProviders}
        onProviderToggle={toggleProvider}
        availableProviders={availableProviders}
        metric={metric}
        onMetricChange={setMetric}
      />

      <ResultsTable results={filtered} activeProviders={activeProviders} metric={metric} />
    </div>
  )
}
