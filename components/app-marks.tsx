import { useId } from "react";

import type { AppMarkKind } from "@/lib/marks";

type MarkProps = {
  kind: AppMarkKind;
  letter: string;
  swatch: string;
  ink: string;
};

const BRAND_PLATES: Record<AppMarkKind, string> = {
  youtube: "#FF0033",
  netflix: "#141418",
  disney: "#102657",
  blutv: "#087BCD",
  tabii: "#047A55",
  ayarlar: "#39424F",
  "canli-tv": "#6A3D1B",
  letter: "transparent",
};

/** The same vector marks serve the TV tiles and the phone's app shortcuts. */
export function AppMark({ kind, letter, swatch, ink }: MarkProps) {
  return (
    <span
      className="flex h-full w-full items-center justify-center p-[12%]"
      style={{ background: kind === "letter" ? swatch : BRAND_PLATES[kind] }}
    >
      <AppGlyphMark kind={kind} fill={kind === "letter" ? ink : "#FFFFFF"} letter={letter} />
    </span>
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
      return (
        <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden="true">
          <path fill={fill} d="M58 19 111 50 58 81Z" />
        </svg>
      );
    case "netflix":
      return (
        <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden="true">
          <path fill={fill} d="M47 18H63V82L47 84ZM97 18H113V84L97 82Z" />
          <path fill={fill} d="M47 18H65L113 84L95 81Z" />
        </svg>
      );
    case "disney":
      return <DisneyGlyph fill={fill} />;
    case "blutv":
      return <Wordmark text="BluTV" fill={fill} />;
    case "tabii":
      return <Wordmark text="tabii" fill={fill} rounded />;
    case "ayarlar":
      return <GearGlyph fill={fill} />;
    case "canli-tv":
      return <TelevisionGlyph fill={fill} />;
    case "letter":
      return (
        <span
          className="flex h-full w-full items-center justify-center font-semibold"
          style={{ color: fill, fontSize: "2.4em" }}
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

function TelevisionGlyph({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 80 64" className="h-full w-full" aria-hidden="true">
      <rect x="8" y="10" width="64" height="40" rx="7" fill="none" stroke={fill} strokeWidth="5" />
      <path d="M31 56h18M40 50v6M30 3l10 8 10-8" fill="none" stroke={fill} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 24l15 7-15 7z" fill={fill} />
    </svg>
  );
}

function DisneyGlyph({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 240 100" className="h-full w-full" aria-hidden="true">
      <path d="M34 36C70 2 146 0 199 31" fill="none" stroke={fill} strokeWidth="4" strokeLinecap="round" />
      <text x="109" y="77" textAnchor="middle" fill={fill} fontSize="57" fontWeight="600" fontStyle="italic" fontFamily="Georgia, serif" letterSpacing="-3">
        Disney
      </text>
      <path fill={fill} d="M204 43H210V54H221V60H210V71H204V60H193V54H204Z" />
    </svg>
  );
}

function Wordmark({ text, fill, rounded }: { text: string; fill: string; rounded?: boolean }) {
  return (
    <svg viewBox="0 0 240 100" className="h-full w-full" aria-hidden="true">
      <text
        x="120" y="70" textAnchor="middle" fill={fill}
        fontSize={rounded ? 72 : 65} fontWeight={rounded ? "800" : "700"}
        fontFamily={rounded ? "var(--font-nunito-sans), Arial, sans-serif" : "Arial, sans-serif"}
        letterSpacing={rounded ? "-3" : "-2"}
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
        <circle cx="24" cy="24" r="5" fill="#000" />
      </mask>
      <g fill={fill} mask={`url(#${maskId})`}>
        {teeth.map((angle) => (
          <rect key={angle} x="21" y="6" width="6" height="10" rx="1.5" transform={`rotate(${angle} 24 24)`} />
        ))}
        <circle cx="24" cy="24" r="12" />
      </g>
    </svg>
  );
}
