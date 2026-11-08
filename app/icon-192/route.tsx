import { ImageResponse } from "next/og";

export function GET() {
  const s = 192;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, background: "#00A6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: s * 0.56, height: s * 0.4, background: "#fff", borderRadius: s * 0.1, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: s * 0.04 }}>
          <div style={{ width: s * 0.1, height: s * 0.1, borderRadius: s, background: "#00A6FF" }} />
          <div style={{ width: s * 0.1, height: s * 0.1, borderRadius: s, background: "#00A6FF" }} />
        </div>
      </div>
    ),
    { width: s, height: s },
  );
}
