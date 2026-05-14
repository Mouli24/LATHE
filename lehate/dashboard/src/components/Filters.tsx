import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { ProviderName, MetricKey } from "@/lib/types"
import { ALL_PROVIDERS, PROVIDER_LABELS, categoryLabel } from "@/lib/constants"

interface FiltersProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (v: string) => void
  activeProviders: ProviderName[]
  onProviderToggle: (p: ProviderName) => void
  availableProviders: ProviderName[]
  metric: MetricKey
  onMetricChange: (m: MetricKey) => void
}

export function Filters({
  categories,
  selectedCategory,
  onCategoryChange,
  activeProviders,
  onProviderToggle,
  availableProviders,
  metric,
  onMetricChange,
}: FiltersProps) {
  const providers = ALL_PROVIDERS.filter((p) => availableProviders.includes(p))

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Category</label>
        <Select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-56"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Metric</label>
        <Select
          value={metric}
          onChange={(e) => onMetricChange(e.target.value as MetricKey)}
          className="w-36"
        >
          <option value="p50">p50 (median)</option>
          <option value="p95">p95</option>
          <option value="mean">mean</option>
        </Select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Providers</span>
        {providers.map((p) => {
          const active = activeProviders.includes(p)
          return (
            <button key={p} onClick={() => onProviderToggle(p)} type="button">
              <Badge
                variant={active ? "default" : "outline"}
                className={`cursor-pointer ${active ? "" : "opacity-60"}`}
              >
                {PROVIDER_LABELS[p]}
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}
