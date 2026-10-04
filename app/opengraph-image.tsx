import { ImageResponse } from "next/og";
import portfolioJson from "@/data/portfolio.json";
import { normalizePortfolio } from "@/lib/portfolio";

const portfolio = normalizePortfolio(portfolioJson);

export const alt = `${portfolio.profile.name || "Portfolio"} — portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", alignItems: "center", background: "#080b10", color: "#eef4f5", fontFamily: "Arial, sans-serif" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.24, backgroundImage: "linear-gradient(rgba(142, 195, 208, .13) 1px, transparent 1px), linear-gradient(90deg, rgba(142, 195, 208, .13) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
        <div style={{ position: "absolute", right: 30, top: 55, width: 470, height: 470, display: "flex", border: "1px solid rgba(128,237,244,.23)", borderRadius: "50%", boxShadow: "inset 0 0 90px rgba(44,174,190,.1), 0 0 70px rgba(44,174,190,.07)" }} />
        <div style={{ position: "absolute", right: 91, top: 103, width: 350, height: 350, display: "flex", border: "1px dashed rgba(172,161,255,.23)", borderRadius: "50%", transform: "rotate(-25deg) scaleY(.63)" }} />
        <div style={{ position: "absolute", right: 203, top: 161, width: 131, height: 205, display: "flex", border: "1px solid rgba(143,240,246,.64)", borderRadius: "47% 47% 42% 42%", background: "linear-gradient(135deg, rgba(142,248,251,.19), rgba(78,143,166,.03))", boxShadow: "0 0 45px rgba(96,220,230,.15)" }} />
        <div style={{ position: "absolute", right: 240, top: 249, width: 53, height: 1, display: "flex", background: "#c0ffff", boxShadow: "0 0 14px #8df4f9" }} />
        <div style={{ position: "absolute", right: 300, top: 249, width: 53, height: 1, display: "flex", background: "#c0ffff", boxShadow: "0 0 14px #8df4f9" }} />
        <div style={{ position: "absolute", right: 259, top: 304, width: 42, height: 1, display: "flex", background: "rgba(192,255,255,.8)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", marginLeft: 86, width: 710 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 27, color: "#84e8ef", fontSize: 15, letterSpacing: 4 }}>✳ &nbsp; PERSONAL SYSTEM / ONLINE</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 77, lineHeight: 0.98, fontWeight: 600, letterSpacing: -5 }}>
            <span>{portfolio.profile.name}</span>
            <span style={{ marginTop: 17, color: "#a6f0f3", fontSize: 31, lineHeight: 1.2, fontWeight: 400, letterSpacing: -1 }}>{portfolio.profile.headline}</span>
          </div>
          <div style={{ display: "flex", width: 72, height: 2, marginTop: 36, background: "#80edf4" }} />
          <div style={{ display: "flex", marginTop: 17, color: "#8d9ca5", fontSize: 16 }}>{portfolio.profile.secondaryHeadline}</div>
        </div>
        <div style={{ position: "absolute", right: 65, bottom: 42, display: "flex", color: "#75848e", fontSize: 11, letterSpacing: 3 }}>AI / SECURITY / BUILD</div>
      </div>
    ),
    { ...size }
  );
}
