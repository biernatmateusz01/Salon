import { ImageResponse } from "next/og";

// App icon rendered at build time — a pair of scissors on the brand colour.
export function renderIcon(size: number) {
  const s = size;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f1a17",
        }}
      >
        <svg width={s * 0.56} height={s * 0.56} viewBox="0 0 24 24" fill="none" stroke="#e8c39e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M20 4 8.12 15.88" />
          <path d="M14.47 14.48 20 20" />
          <path d="M8.12 8.12 12 12" />
        </svg>
      </div>
    ),
    { width: s, height: s },
  );
}
