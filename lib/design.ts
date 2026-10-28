export const STORAGE_KEY = "a850c-ev-ekrani-v3";

export const LIMITS = {
  greeting: 80,
  profileName: 32,
  weatherLine: 80,
  appName: 24,
  rowTitle: 36,
  cardTitle: 42,
  cardMeta: 42,
  imageName: 80,
  apps: 12,
  rows: 4,
  cards: 8,
  imageChars: 1_200_000,
} as const;

export const LAYOUT_IDS = ["mozaik", "salon", "sinema", "saat"] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

export const PANEL_LAYOUT_IDS = LAYOUT_IDS;

export const TILE_IDS = ["marka", "sade"] as const;
export type TileId = (typeof TILE_IDS)[number];

export const LABEL_IDS = ["logo-ad", "logo", "ad"] as const;
export type LabelId = (typeof LABEL_IDS)[number];

export const LOGO_COLOR_IDS = ["marka", "tek"] as const;
export type LogoColorId = (typeof LOGO_COLOR_IDS)[number];

export const FONT_IDS = ["modern", "yumusak"] as const;
export type FontId = (typeof FONT_IDS)[number];

export const WALLPAPER_PRESET_IDS = [
  "istanbul-aksam",
  "sonbahar-bahce",
  "siyah",
  "bakir-lamba",
  "gece-cam",
  "somine",
  "zeytin-gece",
  "kis-aksami",
] as const;
export type WallpaperPresetId = (typeof WALLPAPER_PRESET_IDS)[number];

export const WALLPAPER_NAMES: Record<WallpaperPresetId, string> = {
  "istanbul-aksam": "İstanbul · Akşam",
  "sonbahar-bahce": "Sonbahar bahçesi",
  siyah: "Siyah",
  "bakir-lamba": "Bakır lamba",
  "gece-cam": "Gece camı",
  somine: "Şömine",
  "zeytin-gece": "Zeytin gece",
  "kis-aksami": "Kış akşamı",
};

export const APP_COLOR_IDS = [
  "bakir",
  "amber",
  "krem",
  "zeytin",
  "bordo",
  "gece",
  "tas",
] as const;
export type AppColorId = (typeof APP_COLOR_IDS)[number];

export const APP_COLORS: Record<
  AppColorId,
  { name: string; swatch: string; ink: string }
> = {
  bakir: {
    name: "Bakır",
    swatch: "oklch(0.62 0.12 55)",
    ink: "oklch(0.97 0.02 85)",
  },
  amber: {
    name: "Amber",
    swatch: "oklch(0.78 0.13 78)",
    ink: "oklch(0.22 0.04 50)",
  },
  krem: {
    name: "Krem",
    swatch: "oklch(0.9 0.03 85)",
    ink: "oklch(0.24 0.03 50)",
  },
  zeytin: {
    name: "Zeytin",
    swatch: "oklch(0.52 0.06 115)",
    ink: "oklch(0.96 0.02 90)",
  },
  bordo: {
    name: "Bordo",
    swatch: "oklch(0.57 0.22 27)",
    ink: "oklch(0.98 0.005 260)",
  },
  gece: {
    name: "Gece",
    swatch: "oklch(0.18 0.02 260)",
    ink: "oklch(0.97 0.005 260)",
  },
  tas: {
    name: "Taş",
    swatch: "oklch(0.68 0.02 70)",
    ink: "oklch(0.18 0.02 45)",
  },
};

export type Wallpaper =
  | { type: "preset"; presetId: WallpaperPresetId }
  | { type: "image"; dataUrl: string; name: string };

export type DockApp = {
  id: string;
  name: string;
  colorId: AppColorId;
};

export type ContentCard = {
  id: string;
  title: string;
  meta: string;
};

export type ContentRow = {
  id: string;
  title: string;
  cards: ContentCard[];
};

export type HomeDesign = {
  version: 1;
  layout: LayoutId;
  greeting: string;
  profileName: string;
  weatherLine: string;
  showClock: boolean;
  lamp: number;
  wallpaper: Wallpaper;
  tiles: TileId;
  labels: LabelId;
  logoColor: LogoColorId;
  fontStyle: FontId;
  apps: DockApp[];
  rows: ContentRow[];
};

export function createDefaultDesign(): HomeDesign {
  return {
    version: 1,
    layout: "mozaik",
    greeting: "İyi akşamlar",
    profileName: "Ev",
    weatherLine: "İstanbul · serin bir akşam",
    showClock: true,
    lamp: 35,
    wallpaper: { type: "preset", presetId: "istanbul-aksam" },
    tiles: "marka",
    labels: "logo-ad",
    logoColor: "marka",
    fontStyle: "modern",
    apps: [
      { id: "app-youtube", name: "YouTube", colorId: "bordo" },
      { id: "app-netflix", name: "Netflix", colorId: "gece" },
      { id: "app-disney", name: "Disney+", colorId: "tas" },
      { id: "app-blutv", name: "BluTV", colorId: "bakir" },
      { id: "app-tabii", name: "tabii", colorId: "zeytin" },
      { id: "app-ayarlar", name: "Ayarlar", colorId: "krem" },
    ],
    rows: [
      {
        id: "row-continue",
        title: "Kaldığın yer",
        cards: [
          { id: "card-bogaz", title: "Boğaz ışıkları", meta: "Film · 48. dk" },
          { id: "card-mahalle", title: "Mahalle kahvesi", meta: "Dizi · S2 B6" },
          { id: "card-mutfak", title: "Gece mutfağı", meta: "Program · 22 dk" },
        ],
      },
      {
        id: "row-evening",
        title: "Bu akşam salonda",
        cards: [
          { id: "card-anadolu", title: "Anadolu yolları", meta: "Belgesel" },
          { id: "card-cocuk", title: "Çocuk odası", meta: "Aile" },
          { id: "card-konser", title: "Cuma konseri", meta: "Müzik" },
        ],
      },
    ],
  };
}

export function layoutLabel(layout: LayoutId): string {
  switch (layout) {
    case "mozaik":
      return "Mozaik";
    case "salon":
      return "Salon";
    case "sinema":
      return "Sinema";
    case "saat":
      return "Saat";
    default: {
      const exhaustive: never = layout;
      return exhaustive;
    }
  }
}

export function layoutHint(layout: LayoutId): string {
  switch (layout) {
    case "mozaik":
      return "Tam ekran fotoğraf, saat ve büyük uygulama karoları.";
    case "salon":
      return "Altta tek sıra. YouTube ve Netflix büyük, diğerleri küçük.";
    case "sinema":
      return "Büyük afiş, yan liste ve sağda uygulama rayı. Sıralar tek akışta birleşir.";
    case "saat":
      return "Saat 160 piksel. Uygulama sırası bir yön tuşuna kadar gizli.";
    default: {
      const exhaustive: never = layout;
      return exhaustive;
    }
  }
}

export function wallpaperBackground(id: WallpaperPresetId): string {
  return `center / cover no-repeat url("/wallpapers/${id}.jpg")`;
}

export function wallpaperCss(wallpaper: Wallpaper): string {
  switch (wallpaper.type) {
    case "preset":
      return wallpaperBackground(wallpaper.presetId);
    case "image":
      return `center / cover no-repeat url("${wallpaper.dataUrl}")`;
    default: {
      const exhaustive: never = wallpaper;
      return exhaustive;
    }
  }
}

export function isLayoutId(value: string): value is LayoutId {
  return (LAYOUT_IDS as readonly string[]).includes(value);
}

export function isWallpaperPresetId(value: string): value is WallpaperPresetId {
  return (WALLPAPER_PRESET_IDS as readonly string[]).includes(value);
}

export function isAppColorId(value: string): value is AppColorId {
  return (APP_COLOR_IDS as readonly string[]).includes(value);
}

export function newId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // randomUUID requires HTTPS; getRandomValues also works on a local HTTP TV page.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function moveListItem<T>(
  items: readonly T[],
  index: number,
  direction: -1 | 1,
): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) {
    return [...items];
  }
  const next = [...items];
  const current = next[index];
  const swap = next[target];
  if (current === undefined || swap === undefined) {
    return [...items];
  }
  next[index] = swap;
  next[target] = current;
  return next;
}

export function cycleChoice<T extends string>(
  options: readonly T[],
  current: string,
  direction: -1 | 1,
): T {
  const index = options.indexOf(current as T);
  const next =
    index < 0
      ? 0
      : (index + direction + options.length) % options.length;
  return options[next] ?? options[0];
}

export function panelLayoutLabel(layout: LayoutId): string {
  switch (layout) {
    case "mozaik":
      return "Mozaik";
    case "salon":
      return "Dock";
    case "sinema":
      return "Sinema";
    case "saat":
      return "Saat";
    default: {
      const exhaustive: never = layout;
      return exhaustive;
    }
  }
}

export function tileLabel(id: TileId): string {
  switch (id) {
    case "marka":
      return "Marka renkleri";
    case "sade":
      return "Sade";
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function labelModeLabel(id: LabelId): string {
  switch (id) {
    case "logo-ad":
      return "Logo ve ad";
    case "logo":
      return "Yalnız logo";
    case "ad":
      return "Yalnız ad";
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function logoColorLabel(id: LogoColorId): string {
  switch (id) {
    case "marka":
      return "Marka renkleri";
    case "tek":
      return "Tek renk";
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function fontLabel(id: FontId): string {
  switch (id) {
    case "modern":
      return "Modern";
    case "yumusak":
      return "Yumuşak";
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

function parseChoice<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
  error: string,
): T {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === "string" && (options as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} metin olmalı.`);
  }
  if (value.length > max) {
    throw new Error(`${field} en fazla ${max} karakter olabilir.`);
  }
  return value;
}

function parseId(value: unknown, field: string, seen: Set<string>): string {
  if (typeof value !== "string" || !/^[\w-]{1,80}$/.test(value)) {
    throw new Error(`${field} kimliği geçersiz.`);
  }
  if (seen.has(value)) {
    throw new Error(`${field} kimliği yineleniyor.`);
  }
  seen.add(value);
  return value;
}

function parseWallpaper(value: unknown): Wallpaper {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error("Duvar kâğıdı eksik.");
  }
  switch (value.type) {
    case "preset": {
      if (
        typeof value.presetId !== "string" ||
        !isWallpaperPresetId(value.presetId)
      ) {
        throw new Error(
          "Duvar kâğıdı hazır bahçelerden biri olmalı.",
        );
      }
      return { type: "preset", presetId: value.presetId };
    }
    case "image": {
      if (
        typeof value.dataUrl !== "string" ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value.dataUrl)
      ) {
        throw new Error("Görsel duvar kâğıdı sıkıştırılmış JPEG olmalı.");
      }
      if (value.dataUrl.length > LIMITS.imageChars) {
        throw new Error("Görsel duvar kâğıdı çok büyük.");
      }
      return {
        type: "image",
        dataUrl: value.dataUrl,
        name: parseText(value.name, "Görsel adı", LIMITS.imageName),
      };
    }
    default:
      throw new Error("Duvar kâğıdı hazır renk ya da görsel olmalı.");
  }
}

function parseApp(value: unknown, seen: Set<string>): DockApp {
  if (!isRecord(value)) {
    throw new Error("Uygulama kaydı bozuk.");
  }
  if (typeof value.colorId !== "string" || !isAppColorId(value.colorId)) {
    throw new Error("Uygulama rengi hazır paletten seçilmeli.");
  }
  return {
    id: parseId(value.id, "Uygulama", seen),
    name: parseText(value.name, "Uygulama adı", LIMITS.appName),
    colorId: value.colorId,
  };
}

function parseCard(value: unknown, seen: Set<string>): ContentCard {
  if (!isRecord(value)) {
    throw new Error("Kart kaydı bozuk.");
  }
  return {
    id: parseId(value.id, "Kart", seen),
    title: parseText(value.title, "Kart başlığı", LIMITS.cardTitle),
    meta: parseText(value.meta, "Kart bilgisi", LIMITS.cardMeta),
  };
}

function parseRow(value: unknown, seen: Set<string>): ContentRow {
  if (!isRecord(value) || !Array.isArray(value.cards)) {
    throw new Error("İçerik sırası bozuk.");
  }
  if (value.cards.length > LIMITS.cards) {
    throw new Error(`Bir sırada en fazla ${LIMITS.cards} kart olabilir.`);
  }
  return {
    id: parseId(value.id, "Sıra", seen),
    title: parseText(value.title, "Sıra başlığı", LIMITS.rowTitle),
    cards: value.cards.map((card) => parseCard(card, seen)),
  };
}

export function parseDesign(input: unknown): HomeDesign {
  if (!isRecord(input)) {
    throw new Error("Dosya bir tasarım nesnesi değil.");
  }
  if (input.version !== 1) {
    throw new Error("Bu dosyanın sürümü desteklenmiyor. Sürüm 1 bekleniyor.");
  }
  if (typeof input.layout !== "string" || !isLayoutId(input.layout)) {
    throw new Error("Düzen mozaik, salon, sinema veya saat olmalı.");
  }
  if (typeof input.showClock !== "boolean") {
    throw new Error("Saat görünürlüğü açık ya da kapalı olmalı.");
  }
  if (
    typeof input.lamp !== "number" ||
    !Number.isFinite(input.lamp) ||
    input.lamp < 0 ||
    input.lamp > 100
  ) {
    throw new Error("Lamba yoğunluğu 0 ile 100 arasında olmalı.");
  }
  if (!Array.isArray(input.apps) || !Array.isArray(input.rows)) {
    throw new Error("Uygulamalar ve içerik sıraları liste olmalı.");
  }
  if (input.apps.length > LIMITS.apps) {
    throw new Error(`En fazla ${LIMITS.apps} uygulama olabilir.`);
  }
  if (input.rows.length > LIMITS.rows) {
    throw new Error(`En fazla ${LIMITS.rows} içerik sırası olabilir.`);
  }

  const seen = new Set<string>();
  return {
    version: 1,
    layout: input.layout,
    greeting: parseText(input.greeting, "Karşılama", LIMITS.greeting),
    profileName: parseText(input.profileName, "Profil adı", LIMITS.profileName),
    weatherLine: parseText(input.weatherLine, "Hava satırı", LIMITS.weatherLine),
    showClock: input.showClock,
    lamp: Math.round(input.lamp),
    wallpaper: parseWallpaper(input.wallpaper),
    tiles: parseChoice(input.tiles, TILE_IDS, "marka", "Karolar marka veya sade olmalı."),
    labels: parseChoice(
      input.labels,
      LABEL_IDS,
      "logo-ad",
      "Etiketler logo ve ad, yalnız logo veya yalnız ad olmalı.",
    ),
    logoColor: parseChoice(
      input.logoColor,
      LOGO_COLOR_IDS,
      "marka",
      "Logo rengi marka veya tek renk olmalı.",
    ),
    fontStyle: parseChoice(
      input.fontStyle,
      FONT_IDS,
      "modern",
      "Yazı tipi modern veya yumuşak olmalı.",
    ),
    apps: input.apps.map((app) => parseApp(app, seen)),
    rows: input.rows.map((row) => parseRow(row, seen)),
  };
}
