import { useState, useEffect, useCallback } from "react"
import type { RunResults, ProviderName, MetricKey } from "@/lib/types"
import { ALL_PROVIDERS } from "@/lib/constants"
import { Sidebar } from "@/components/Sidebar"
import { Topbar } from "@/components/Topbar"
import { PageHeader } from "@/components/PageHeader"
import { HeroCards } from "@/components/HeroCards"
import { FeaturedCard } from "@/components/FeaturedCard"
import { ActiveBenchPanel } from "@/components/ActiveBenchPanel"
import { UtterancePeek } from "@/components/UtterancePeek"
import { ProvidersView } from "@/components/ProvidersView"
import { CategoriesView } from "@/components/CategoriesView"
import { LatencyCalculatorView } from "@/components/LatencyCalculatorView"
import { DataApiView } from "@/components/DataApiView"
import { LiquidBenchView } from "@/components/LiquidBenchView"

function computeP50Map(data: RunResults): Record<string, number> {
  const map: Record<string, number> = {}
  for (const p of data.providers) {
    const vals = data.results
      .map((r) => r.outputs[p]?.ttfb?.p50)
      .filter((v): v is number => v != null && v > 0)
    if (vals.length > 0) {
      map[p] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    }
  }
  return map
}

export default function App() {
  const [data, setData] = useState<RunResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("dash")
  const [mode, setMode] = useState("Streaming")
  const [metric, setMetric] = useState<MetricKey>("p50")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [streamingFilter, setStreamingFilter] = useState<"all" | "streaming" | "non-streaming">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeProviders, setActiveProviders] = useState<ProviderName[]>([])

  // Always dark — add class so Tailwind dark: variants work in legacy components
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  async function loadData() {
    setRefreshing(true)
    try {
      const r = await fetch("/results.json")
      if (!r.ok) throw new Error(`Failed to load results.json: ${r.status}`)
      const d: RunResults = await r.json()
      setData(d)
      const avail = d.providers.filter((p): p is ProviderName =>
        (ALL_PROVIDERS as string[]).includes(p)
      )
      setActiveProviders(avail.length > 0 ? avail : (ALL_PROVIDERS as ProviderName[]))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function refreshData() {
    loadData()
  }

  function toggleProvider(p: ProviderName) {
    setActiveProviders((prev) =>
      prev.includes(p)
        ? prev.length > 1
          ? prev.filter((x) => x !== p)
          : prev
        : [...prev, p]
    )
  }

  const exportCsv = useCallback(() => {
    if (!data) return
    const filtered = data.results.filter(
      (r) => selectedCategory === "all" || r.category === selectedCategory
    )
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
    a.download = `lathe-${data.run_id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, activeProviders, selectedCategory])

  const p50Map = data ? computeP50Map(data) : {}
  const availableProviders = data
    ? data.providers.filter((p): p is ProviderName => (ALL_PROVIDERS as string[]).includes(p))
    : (ALL_PROVIDERS as ProviderName[])
  const categories = data ? [...new Set(data.results.map((r) => r.category))].sort() : []

  // Layer 1: category filter
  const categoryFiltered = data
    ? data.results.filter((r) => selectedCategory === "all" || r.category === selectedCategory)
    : []

  // Layer 2: streaming filter
  const streamingFiltered = categoryFiltered.filter((r) => {
    if (streamingFilter === "all") return true
    const hasStreaming = activeProviders.some((p) => r.outputs[p]?.is_streaming === true)
    if (streamingFilter === "streaming") return hasStreaming
    return !hasStreaming
  })

  // Layer 3: search filter
  const searchLower = searchQuery.toLowerCase().trim()
  const filteredResults = searchLower
    ? streamingFiltered.filter(
        (r) =>
          r.text.toLowerCase().includes(searchLower) ||
          r.test_id.toLowerCase().includes(searchLower)
      )
    : streamingFiltered

  const filteredData: RunResults | null = data ? { ...data, results: filteredResults } : null

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          background: "var(--bg-0)",
          color: "var(--ink)",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderRadius: 12,
            background: "rgba(248,113,113,0.10)",
            border: "1px solid rgba(248,113,113,0.30)",
            color: "#fca5a5",
            fontSize: 14,
            maxWidth: 480,
            textAlign: "center",
          }}
        >
          {error}
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
          Place a results.json file in the public/ directory to load benchmark data.
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "var(--bg-0)",
        color: "var(--ink)",
        fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <Sidebar
        activeTab={activeTab}
        mode={mode}
        onTabChange={setActiveTab}
        onModeChange={setMode}
        providers={availableProviders}
        p50Map={p50Map}
      />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar
          runId={data?.run_id}
          onRefresh={refreshData}
          refreshing={refreshing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          data={data}
        />
        {activeTab === "dash" && (
          <>
            <PageHeader
              totalProviders={availableProviders.length || 3}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              activeProviders={activeProviders}
              availableProviders={availableProviders}
              onProviderToggle={toggleProvider}
              metric={metric}
              onMetricChange={setMetric}
              streamingFilter={streamingFilter}
              onStreamingFilterChange={setStreamingFilter}
            />
            <div className="px-7 lg:px-9 pb-10">
              <div className="grid grid-cols-12 gap-4" style={{ marginTop: "1.25rem" }}>
                <div className="col-span-12 xl:col-span-9">
                  <HeroCards data={filteredData} activeProviders={activeProviders} metric={metric} />
                </div>
                <div className="col-span-12 xl:col-span-3">
                  <FeaturedCard />
                </div>
              </div>
              <ActiveBenchPanel
                data={filteredData}
                metric={metric}
                activeProviders={activeProviders}
                onExportCsv={exportCsv}
              />
              <UtterancePeek
                data={filteredData}
                activeProviders={activeProviders}
                metric={metric}
              />
            </div>
          </>
        )}
        {activeTab === "providers" && (
          <ProvidersView data={filteredData} activeProviders={activeProviders} metric={metric} />
        )}
        {activeTab === "categories" && (
          <CategoriesView data={filteredData} activeProviders={activeProviders} metric={metric} />
        )}
        {activeTab === "latency" && (
          <LatencyCalculatorView data={data} activeProviders={activeProviders} />
        )}
        {activeTab === "api" && <DataApiView data={data} />}
        {activeTab === "liquid" && (
          <LiquidBenchView data={data} activeProviders={activeProviders} />
        )}
      </main>
    </div>
  )
}
