import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { TestResult, ProviderName, MetricKey } from "@/lib/types"
import { PROVIDER_COLORS, PROVIDER_LABELS, categoryLabel } from "@/lib/constants"

interface LatencyChartProps {
  results: TestResult[]
  activeProviders: ProviderName[]
  metric: MetricKey
}

export function LatencyChart({ results, activeProviders, metric }: LatencyChartProps) {
  const categories = [...new Set(results.map((r) => r.category))].sort()

  const data = categories.map((cat) => {
    const catResults = results.filter((r) => r.category === cat)
    const row: Record<string, string | number> = { category: categoryLabel(cat) }
    for (const p of activeProviders) {
      const vals = catResults
        .map((r) => r.outputs[p]?.ttfb?.[metric])
        .filter((v): v is number => typeof v === "number" && v > 0)
      row[p] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, categories.length * 80 + 60)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
        <XAxis type="number" unit="ms" tick={{ fontSize: 12 }} stroke="currentColor" />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={180} stroke="currentColor" />
        <Tooltip
          formatter={(v) => [`${v}ms`, `${metric.toUpperCase()} TTFB`]}
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
        />
        <Legend formatter={(v) => PROVIDER_LABELS[v as ProviderName] ?? v} />
        {activeProviders.map((p) => (
          <Bar key={p} dataKey={p} name={p} fill={PROVIDER_COLORS[p]} radius={[0, 4, 4, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
