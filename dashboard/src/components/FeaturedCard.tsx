import { Icon } from "./icons"

export function FeaturedCard() {
  return (
    <div
      className="v3-card-gradient fade-up"
      style={{ padding: "24px", height: "100%", minHeight: 200, display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Icon */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: "rgba(167,139,250,0.20)",
          border: "1px solid rgba(167,139,250,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--lav-1)",
        }}
      >
        <Icon.Zap style={{ width: 20, height: 20 }} />
      </div>

      {/* Eyebrow */}
      <div>
        <div
          className="eyebrow"
          style={{ marginBottom: 6, color: "var(--lav-2)" }}
        >
          Featured
        </div>
        <h2
          className="font-serif"
          style={{
            fontSize: "clamp(18px, 2vw, 22px)",
            fontWeight: 400,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          Liquid Latency Portfolio
        </h2>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-dim)",
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
        }}
      >
        Intelligently route voice AI traffic across providers in real-time to minimize latency and maximize reliability for your production workloads.
      </p>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="v3-btn v3-btn-primary"
          style={{ fontSize: 12.5, padding: "7px 14px", borderRadius: 10 }}
        >
          <Icon.Sparkle style={{ width: 13, height: 13 }} />
          Try Now
        </button>
        <button
          type="button"
          className="v3-btn v3-btn-violet"
          style={{ fontSize: 12.5, padding: "7px 14px", borderRadius: 10 }}
        >
          Learn More
        </button>
      </div>
    </div>
  )
}
