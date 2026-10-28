"use client";

import { useId, type ReactNode } from "react";

type PosterScene =
  | "bogaz"
  | "mahalle"
  | "mutfak"
  | "anadolu"
  | "cocuk"
  | "konser"
  | "motif";

function sceneFor(cardId: string): PosterScene {
  const id = cardId.toLocaleLowerCase("tr-TR");
  if (id.includes("bogaz") || id.includes("boğaz")) {
    return "bogaz";
  }
  if (id.includes("mahalle")) {
    return "mahalle";
  }
  if (id.includes("mutfak")) {
    return "mutfak";
  }
  if (id.includes("anadolu")) {
    return "anadolu";
  }
  if (id.includes("cocuk") || id.includes("çocuk")) {
    return "cocuk";
  }
  if (id.includes("konser")) {
    return "konser";
  }
  return "motif";
}

function hashId(id: string): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function PosterStill({
  cardId,
  title,
  meta,
}: {
  cardId: string;
  title?: string;
  meta?: string;
}) {
  const scene = sceneFor(cardId);
  return (
    <span className="absolute inset-0">
      <PosterSvg cardId={cardId} scene={scene} />
      {title ? (
        <span className="absolute inset-x-0 bottom-0 bg-black/80 px-[0.7cqw] py-[0.4cqw]">
          <span className="block truncate font-sans text-[1.12cqw] leading-tight font-medium text-white">
            {title}
          </span>
          {meta ? (
            <span className="mt-[0.1cqw] block truncate text-[0.9cqw] leading-tight font-light text-white/78">
              {meta}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function PosterSvg({ cardId, scene }: { cardId: string; scene: PosterScene }) {
  const id = useId().replace(/:/g, "");
  let body: ReactNode;
  switch (scene) {
    case "bogaz":
      body = <Bogaz id={id} />;
      break;
    case "mahalle":
      body = <Mahalle id={id} />;
      break;
    case "mutfak":
      body = <Mutfak id={id} />;
      break;
    case "anadolu":
      body = <Anadolu id={id} />;
      break;
    case "cocuk":
      body = <Cocuk id={id} />;
      break;
    case "konser":
      body = <Konser id={id} />;
      break;
    case "motif":
      body = <Motif id={id} cardId={cardId} />;
      break;
    default: {
      const exhaustive: never = scene;
      body = exhaustive;
    }
  }
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {body}
    </svg>
  );
}

function Wash({
  id,
  from,
  to,
}: {
  id: string;
  from: string;
  to: string;
}) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id})`} />
    </>
  );
}

function Bogaz({ id }: { id: string }) {
  const lights = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <>
      <Wash id={id} from="#071422" to="#1A4E86" />
      <circle cx="252" cy="36" r="16" fill="#F4E4BC" />
      <rect x="0" y="118" width="320" height="62" fill="#08283F" />
      <rect x="86" y="52" width="8" height="70" fill="#E4EAF1" />
      <rect x="214" y="52" width="8" height="70" fill="#E4EAF1" />
      <path
        d="M90 64 Q156 112 218 64"
        fill="none"
        stroke="#F7F8FA"
        strokeWidth="2.4"
      />
      {lights.map((index) => {
        const t = index / 7;
        const x = 96 + t * 116;
        const y = 66 + 4 * t * (1 - t) * 42;
        return <circle key={index} cx={x} cy={y} r="2.4" fill="#FFD36A" />;
      })}
    </>
  );
}

function Mahalle({ id }: { id: string }) {
  return (
    <>
      <Wash id={id} from="#5A3828" to="#1C100C" />
      <rect x="196" y="28" width="78" height="58" rx="4" fill="#16324C" />
      <path d="M235 28 V86 M196 57 H274" stroke="#D7C4A4" strokeWidth="3" />
      <ellipse cx="118" cy="128" rx="70" ry="16" fill="#3A2418" />
      <rect x="96" y="86" width="36" height="28" rx="4" fill="#F3E6D4" />
      <ellipse cx="114" cy="86" rx="18" ry="6" fill="#FFF8EE" />
      <path
        d="M128 92 h8 a10 10 0 0 1 0 16 h-8"
        fill="none"
        stroke="#F3E6D4"
        strokeWidth="3"
      />
      <path
        d="M104 74 q6 -12 4 -18 M122 74 q8 -14 2 -20"
        fill="none"
        stroke="#F7E7C8"
        strokeWidth="2"
      />
    </>
  );
}

function Mutfak({ id }: { id: string }) {
  return (
    <>
      <Wash id={id} from="#12352C" to="#071612" />
      <circle cx="64" cy="40" r="18" fill="#F0B45A" />
      <rect x="0" y="112" width="320" height="68" fill="#1A2E28" />
      <rect x="36" y="96" width="70" height="22" rx="3" fill="#C4A574" />
      <ellipse cx="196" cy="108" rx="34" ry="12" fill="#8C4A32" />
      <rect x="168" y="78" width="56" height="30" rx="8" fill="#D7DEE4" />
      <rect x="176" y="70" width="40" height="10" rx="4" fill="#F4F7F8" />
      <rect x="248" y="36" width="40" height="28" rx="3" fill="#163E4A" />
    </>
  );
}

function Anadolu({ id }: { id: string }) {
  return (
    <>
      <Wash id={id} from="#24365C" to="#C46A3A" />
      <circle cx="246" cy="48" r="18" fill="#FFD7A1" />
      <path d="M0 112 C70 78 120 130 190 104 C240 86 270 96 320 80 V180 H0 Z" fill="#1C3A28" />
      <path d="M0 132 C80 112 140 150 210 128 C260 114 290 124 320 112 V180 H0 Z" fill="#142818" />
      <path d="M138 180 L158 96 H176 L196 180 Z" fill="#E7D3B4" />
      <path d="M164 108 H170 V180 H164 Z" fill="#F8F1E4" />
    </>
  );
}

function Cocuk({ id }: { id: string }) {
  return (
    <>
      <Wash id={id} from="#3C2A68" to="#C9A6DE" />
      <path d="M70 78 L118 42 L166 78 Z" fill="#F2D7A2" />
      <rect x="82" y="78" width="72" height="58" fill="#F7F1E6" />
      <rect x="104" y="96" width="22" height="40" fill="#8C5A3C" />
      <rect x="90" y="88" width="16" height="14" fill="#F0B45A" />
      <polygon
        points="236,36 242,52 260,52 246,62 252,78 236,68 220,78 226,62 212,52 230,52"
        fill="#FFE08A"
      />
      <ellipse cx="168" cy="148" rx="86" ry="16" fill="#6E4C86" />
    </>
  );
}

function Konser({ id }: { id: string }) {
  return (
    <>
      <Wash id={id} from="#140814" to="#3A1248" />
      <path d="M40 180 L110 78 H210 L280 180 Z" fill="#241018" />
      <path d="M70 0 L150 150 H110 Z" fill="#FF4D6D" opacity="0.72" />
      <path d="M160 0 L210 156 H150 Z" fill="#F2C14E" opacity="0.7" />
      <path d="M250 0 L230 156 H270 Z" fill="#7AA2FF" opacity="0.7" />
      <circle cx="168" cy="112" r="14" fill="#F7F4EF" />
      <rect x="158" y="126" width="20" height="28" rx="6" fill="#F7F4EF" />
    </>
  );
}

function Motif({ id, cardId }: { id: string; cardId: string }) {
  const hash = hashId(cardId);
  const hue = hash % 360;
  const accent = `oklch(0.78 0.12 ${hue})`;
  const paper = `oklch(0.92 0.04 ${(hue + 40) % 360})`;
  return (
    <>
      <Wash
        id={id}
        from={`oklch(0.28 0.08 ${hue})`}
        to={`oklch(0.14 0.05 ${(hue + 24) % 360})`}
      />
      <circle cx="230" cy="62" r="36" fill={accent} />
      <rect x="36" y="40" width="92" height="58" rx="10" fill={paper} />
      <path d="M48 150 H200 L168 118 H80 Z" fill={accent} />
    </>
  );
}
