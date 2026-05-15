import { useState } from "react"
import type { RunResults } from "@/lib/types"

interface DataApiViewProps {
  data: RunResults | null
}

const TYPE_DEFS = `type ProviderName = "smallest" | "groq" | "sarvam";

type LatencyStats = {
  mean: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
  stddev: number;
  samples: number[];
};

type ProviderOutput = {
  ttfb: LatencyStats | null;
  total: LatencyStats | null;
  runs: number;
  errors: number;
  last_error: string | null;
  is_streaming: boolean;
};

type TestResult = {
  test_id: string;
  category: string;
  text: string;
  outputs: Record<ProviderName, ProviderOutput>;
};

type RunResults = {
  run_id: string;
  generated_at: string;
  runs_per_cell?: number;
  providers: ProviderName[];
  results: TestResult[];
};`

function syntaxHighlight(code: string): string {
  return code
    .replace(/\b(type|const|string|number|boolean|null|Record|Array)\b/g, '<span style="color:#a78bfa">$1</span>')
    .replace(/"([^"]+)"/g, '<span style="color:#7dd3c0">"$1"</span>')
    .replace(/\b(true|false)\b/g, '<span style="color:#fbbf24">$1</span>')
    .replace(/\/\/[^\n]*/g, '<span style="color:#56525f">$&</span>')
}

export function DataApiView({ data }: DataApiViewProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const fileSize = data ? JSON.stringify(data).length : 0
  const fileSizeLabel =
    fileSize > 1024 * 1024
      ? `~${(fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `~${Math.round(fileSize / 1024)} KB`

  const preview = data
    ? JSON.stringify({ ...data, results: data.results.slice(0, 2) }, null, 2)
    : ""

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "28px 28px 0 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Access raw benchmark results</div>
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(24px, 2.5vw, 32px)",
            fontWeight: 400,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Data API
        </h1>
      </div>

      <div className="px-7 lg:px-9 pb-10" style={{ marginTop: 24 }}>
        {/* Two cards side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Run Metadata */}
          <div className="v3-card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>
              Run Metadata
            </div>
            {data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* run_id */}
                <div className="v3-card-2" style={{ padding: "10px 12px" }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--ink-faint)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: "Geist Mono, monospace",
                      marginBottom: 4,
                    }}
                  >
                    run_id
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "Geist Mono, monospace",
                        color: "var(--lav-1)",
                        wordBreak: "break-all",
                        flex: 1,
                      }}
                    >
                      {data.run_id}
                    </span>
                    <button
                      type="button"
                      className="v3-btn"
                      style={{ padding: "3px 8px", fontSize: 11, flexShrink: 0 }}
                      onClick={() => handleCopy(data.run_id, "run_id")}
                    >
                      {copied === "run_id" ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>

                {[
                  {
                    label: "generated_at",
                    value: new Date(data.generated_at).toLocaleString(),
                  },
                  { label: "utterances", value: String(data.results.length) },
                  { label: "providers", value: data.providers.join(", ") },
                  {
                    label: "runs_per_cell",
                    value: String(data.runs_per_cell ?? 1),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ink-faint)",
                        fontFamily: "Geist Mono, monospace",
                      }}
                    >
                      {row.label}
                    </span>
                    <span style={{ color: "var(--ink-2)", fontFamily: "Geist Mono, monospace" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--ink-faint)", fontSize: 13 }}>No data loaded</div>
            )}
          </div>

          {/* Download */}
          <div className="v3-card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>
              Download
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="v3-btn v3-btn-primary"
                style={{ justifyContent: "center", fontSize: 13 }}
                onClick={() => window.open("/results.json", "_blank")}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
                </svg>
                Download results.json
              </button>

              <button
                type="button"
                className="v3-btn v3-btn-violet"
                style={{ justifyContent: "center", fontSize: 13 }}
                onClick={() => {
                  if (!data) return
                  const providers = data.providers
                  const header = [
                    "test_id",
                    "category",
                    "text",
                    ...providers.flatMap((p) => [
                      `${p}_p50_ms`,
                      `${p}_p95_ms`,
                      `${p}_errors`,
                    ]),
                  ]
                  const escape = (v: unknown) => {
                    const s = v == null ? "" : String(v)
                    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
                  }
                  const rows = data.results.map((r) => {
                    const base = [r.test_id, r.category, r.text]
                    const cells = providers.flatMap((p) => {
                      const o = r.outputs[p]
                      return [o?.ttfb?.p50 ?? "", o?.ttfb?.p95 ?? "", o?.errors ?? ""]
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
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
                </svg>
                Download as CSV
              </button>

              {data && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-faint)",
                    textAlign: "center",
                    marginTop: 4,
                    fontFamily: "Geist Mono, monospace",
                  }}
                >
                  Estimated size: {fileSizeLabel}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schema reference */}
        <div className="v3-card" style={{ padding: "20px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>
            Schema Reference
          </div>
          <div
            style={{
              background: "#0a0810",
              borderRadius: 12,
              padding: "18px 20px",
              overflowX: "auto",
              border: "1px solid var(--line)",
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: "Geist Mono, monospace",
                fontSize: 12.5,
                lineHeight: 1.7,
                color: "var(--ink-2)",
              }}
              dangerouslySetInnerHTML={{ __html: syntaxHighlight(TYPE_DEFS) }}
            />
          </div>
        </div>

        {/* Live JSON Preview */}
        {data && (
          <div className="v3-card" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                Live JSON Preview
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                First 2 results shown
              </span>
            </div>
            <div
              style={{
                background: "#0a0810",
                borderRadius: 12,
                padding: "16px 18px",
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: 400,
                border: "1px solid var(--line)",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 11.5,
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {preview}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
