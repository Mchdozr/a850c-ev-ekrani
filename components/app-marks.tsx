import { useId } from "react";

import type { AppMarkKind } from "@/lib/marks";

type MarkProps = {
  kind: AppMarkKind;
  letter: string;
  swatch: string;
  ink: string;
};

export function AppMark({ kind, letter, swatch, ink }: MarkProps) {
  switch (kind) {
    case "youtube":
      return <YoutubeMark />;
    case "netflix":
      return <NetflixMark />;
    case "disney":
      return <DisneyMark />;
    case "blutv":
      return <BluMark />;
    case "tabii":
      return <TabiiMark />;
    case "ayarlar":
      return <SettingsMark />;
    case "letter":
      return (
        <span
          className="flex h-full w-full items-center justify-center font-medium"
          style={{ background: swatch, color: ink }}
        >
          {letter}
        </span>
      );
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function YoutubeMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect width="48" height="48" fill="#FF0000" />
      <path fill="#FFFFFF" d="M20 16 L34 24 L20 32 Z" />
    </svg>
  );
}

function NetflixMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect width="48" height="48" fill="#E50914" />
      <path fill="#FFFFFF" d="M16 12h6v24h-6z" />
      <path fill="#FFFFFF" d="M32 12h6v24h-6z" />
      <path fill="#FFFFFF" d="M19 12h6L35 36h-6z" />
    </svg>
  );
}

function DisneyMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect width="48" height="48" fill="#1236C9" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M8 12h11.2C26.6 12 31 16.2 31 24S26.6 36 19.2 36H8zm5.2 5.2V30.8h5.4c4.2 0 7-2.6 7-6.8s-2.8-6.8-7-6.8z"
      />
      <path
        fill="#FFFFFF"
        d="M34.2 20.4h3.1V17h3.2v3.4H43.6v3.1h-3.1V26.6h-3.2v-3.1h-3.1z"
      />
    </svg>
  );
}

function BluMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect width="48" height="48" fill="#0A4DFF" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M11 11h12.2C29.6 11 33 14 33 18.1c0 3.1-2.2 5.3-5.3 5.9 3.8.6 6.4 3.1 6.4 6.8 0 4.4-3.9 7.7-9.8 7.7H11zm5.1 5v6.1h6.2c2.9 0 4.6-1.4 4.6-3.05S25.2 16 22.3 16zm0 10.2v7.1h6.8c3.1 0 5-1.4 5-3.55s-1.9-3.55-5-3.55z"
      />
      <circle cx="38.5" cy="13.5" r="2.3" fill="#B9D4FF" />
    </svg>
  );
}

function TabiiMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect width="48" height="48" fill="#0E8F62" />
      <path fill="#FFFFFF" d="M13 18.5h22v5.2H27.2V36h-6.4V23.7H13z" />
      <circle cx="24" cy="12.4" r="2.5" fill="#D9FFE9" />
    </svg>
  );
}

export function AppGlyphMark({
  kind,
  fill,
  letter,
}: {
  kind: AppMarkKind;
  fill: string;
  letter: string;
}) {
  switch (kind) {
    case "youtube":
      return <Wordmark text="YouTube" fill={fill} mark="play" />;
    case "netflix":
      return <Wordmark text="NETFLIX" fill={fill} />;
    case "disney":
      return <Wordmark text="Disney+" fill={fill} />;
    case "blutv":
      return <Wordmark text="BluTV" fill={fill} />;
    case "tabii":
      return <Wordmark text="tabii" fill={fill} />;
    case "ayarlar":
      return <GearGlyph fill={fill} />;
    case "letter":
      return (
        <span
          className="flex h-full w-full items-center justify-center font-semibold"
          style={{ color: fill, fontSize: "62%" }}
        >
          {letter}
        </span>
      );
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function Wordmark({
  text,
  fill,
  mark,
}: {
  text: string;
  fill: string;
  mark?: "play";
}) {
  return (
    <svg viewBox="0 0 240 72" className="h-full w-full" aria-hidden="true">
      {mark === "play" ? (
        <path fill={fill} d="M8 18h28a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8zm10 6 16 12-16 12z" />
      ) : null}
      <text
        x={mark === "play" ? 58 : 120}
        y="48"
        textAnchor={mark === "play" ? "start" : "middle"}
        fill={fill}
        fontSize={text.length > 8 ? 36 : 44}
        fontWeight="800"
        fontFamily="Arial Black, Arial, sans-serif"
      >
        {text}
      </text>
    </svg>
  );
}

function GearGlyph({ fill }: { fill: string }) {
  const maskId = useId().replace(/:/g, "");
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <mask id={maskId}>
        <rect width="48" height="48" fill="#fff" />
        <circle cx="24" cy="24" r="3.4" fill="#000" />
      </mask>
      <g fill={fill} mask={`url(#${maskId})`}>
        {teeth.map((angle) => (
          <rect
            key={angle}
            x="21.15"
            y="6.2"
            width="5.7"
            height="9.6"
            rx="1.1"
            transform={`rotate(${angle} 24 24)`}
          />
        ))}
        <circle cx="24" cy="24" r="8.6" />
      </g>
    </svg>
  );
}

function SettingsMark() {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect width="48" height="48" fill="#2C2C30" />
      <g fill="#F4F4F6">
        {teeth.map((angle) => (
          <rect
            key={angle}
            x="21.15"
            y="6.2"
            width="5.7"
            height="9.6"
            rx="1.1"
            transform={`rotate(${angle} 24 24)`}
          />
        ))}
        <circle cx="24" cy="24" r="8.6" />
      </g>
      <circle cx="24" cy="24" r="3.5" fill="#2C2C30" />
    </svg>
  );
}
