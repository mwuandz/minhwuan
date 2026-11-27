import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "Minh Wuan Store - App Pro/Premium";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function OgImage() {
  let logoSrc: string | null = null;
  try {
    const data = await readFile(join(process.cwd(), "public/logo.png"));
    logoSrc = `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    logoSrc = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #4c1d95 100%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36 }}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              width={100}
              height={100}
              style={{ objectFit: "contain", borderRadius: 20, background: "white", padding: 8 }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 20,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1e3a8a",
                fontSize: 36,
                fontWeight: 900,
              }}
            >
              MW
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "white", fontSize: 36, fontWeight: 900 }}>Minh Wuan Store</div>
            <div style={{ color: "#93c5fd", fontSize: 20 }}>minhwuan.com</div>
          </div>
        </div>
        <div style={{ color: "white", fontSize: 52, fontWeight: 900, lineHeight: 1.15, maxWidth: 900 }}>
          Mua App Pro / Premium
        </div>
        <div style={{ color: "#cbd5e1", fontSize: 26, marginTop: 16, maxWidth: 800 }}>
          ChatGPT · CapCut · Netflix · YouTube · Gemini
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {["VietQR tự động", "Bảo hành rõ ràng", "Kích hoạt 1–5 phút"].map((t) => (
            <div
              key={t}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "white",
                padding: "10px 20px",
                borderRadius: 999,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
