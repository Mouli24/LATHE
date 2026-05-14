import { Card, CardContent } from "@/components/ui/card"
import { PROVIDER_LABELS, categoryLabel } from "@/lib/constants"
import type { TestResult, ProviderName, MetricKey } from "@/lib/types"

interface KpiCardsProps {
  results: TestResult[]
  activeProviders: ProviderName[]
  metric: MetricKey
}

function providerAvg(results: TestResult[], p: ProviderName, metric: MetricKey): number | null {
  const vals = results
    .map((r) => r.outputs[p]?.ttfb?.[metric])
    .filter((v): v is number => typeof v === "number" && v > 0)
  if (vals.length === 0) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export function KpiCards({ results, activeProviders, metric }: KpiCardsProps) {
  const rankings = activeProviders
    .map((p) => ({ p, v: providerAvg(results, p, metric) }))
    .filter((r): r is { p: ProviderName; v: number } => r.v !== null)
    .sort((a, b) => a.v - b.v)

  const fastest = rankings[0]
  const slowest = rankings[rankings.length - 1]

  const categories = [...new Set(results.map((r) => r.category))]
  const otpWinner = bestForCategory(results, "credit_card_otp_readback", activeProviders, metric)
  const hinglishWinner = bestForCategory(results, "hinglish_codeswitch", activeProviders, metric)
  const npnWinner = bestForCategory(results, "indian_proper_nouns_and_codes", activeProviders, metric)

  const totalErrors = activeProviders.reduce(
    (sum, p) => sum + results.reduce((s, r) => s + (r.outputs[p]?.errors ?? 0), 0),
    0
  )

  const cards: { label: string; value: string; sub: string }[] = []
  if (fastest) {
    cards.push({
      label: `Fastest overall (${metric})`,
      value: PROVIDER_LABELS[fastest.p],
      sub: `${fastest.v} ms TTFB`,
    })
  }
  if (slowest && rankings.length > 1) {
    cards.push({
      label: "Slowest overall",
      value: PROVIDER_LABELS[slowest.p],
      sub: `${slowest.v} ms TTFB`,
    })
  }
  for (const [cat, winner] of [
    ["hinglish_codeswitch", hinglishWinner],
    ["indian_proper_nouns_and_codes", npnWinner],
    ["credit_card_otp_readback", otpWinner],
  ] as const) {
    if (winner && categories.includes(cat)) {
      cards.push({
        label: `Best for ${categoryLabel(cat)}`,
        value: PROVIDER_LABELS[winner.p],
        sub: `${winner.v} ms TTFB`,
      })
    }
  }
  cards.push({
    label: "Total errors",
    value: String(totalErrors),
    sub: `across ${results.length} utterances × ${activeProviders.length} providers`,
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="text-lg font-semibold tracking-tight mt-1">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function bestForCategory(
  results: TestResult[],
  category: string,
  providers: ProviderName[],
  metric: MetricKey
): { p: ProviderName; v: number } | null {
  const inCat = results.filter((r) => r.category === category)
  if (inCat.length === 0) return null
  const ranked = providers
    .map((p) => ({ p, v: providerAvg(inCat, p, metric) }))
    .filter((r): r is { p: ProviderName; v: number } => r.v !== null)
    .sort((a, b) => a.v - b.v)
  return ranked[0] ?? null
}
