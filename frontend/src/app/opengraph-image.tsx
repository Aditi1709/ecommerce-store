import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Zenoo — Modern Essentials Store";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090B",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 112,
            height: 112,
            borderRadius: 28,
            border: "3px solid #27272A",
            backgroundColor: "#18181B",
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          Z
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          Zenoo
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#A1A1AA",
            marginTop: 14,
          }}
        >
          Everyday Apparel, Footwear &amp; Minimal Gear
        </div>
      </div>
    ),
    { ...size }
  );
}
