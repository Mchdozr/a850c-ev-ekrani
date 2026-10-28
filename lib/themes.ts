import type { HomeDesign } from "@/lib/design";

type ThemeAppearance = Pick<
  HomeDesign,
  "wallpaper" | "tiles" | "labels" | "logoColor" | "fontStyle" | "lamp"
>;

export type HomeTheme = {
  id: string;
  name: string;
  description: string;
  appearance: ThemeAppearance;
};

export const HOME_THEMES: readonly HomeTheme[] = [
  {
    id: "bogaz-cami",
    name: "Boğaz Camı",
    description: "Akşam ışıkları, canlı karolar",
    appearance: {
      wallpaper: { type: "preset", presetId: "istanbul-aksam" },
      tiles: "marka",
      labels: "logo-ad",
      logoColor: "marka",
      fontStyle: "modern",
      lamp: 12,
    },
  },
  {
    id: "amber-salon",
    name: "Amber Salon",
    description: "Sıcak ışık, yumuşak harfler",
    appearance: {
      wallpaper: { type: "preset", presetId: "bakir-lamba" },
      tiles: "sade",
      labels: "logo-ad",
      logoColor: "tek",
      fontStyle: "yumusak",
      lamp: 40,
    },
  },
  {
    id: "gece-mavisi",
    name: "Gece Mavisi",
    description: "Derin maviler, sade simgeler",
    appearance: {
      wallpaper: { type: "preset", presetId: "gece-cam" },
      tiles: "sade",
      labels: "logo",
      logoColor: "tek",
      fontStyle: "modern",
      lamp: 20,
    },
  },
  {
    id: "kis-sessizligi",
    name: "Kış Sessizliği",
    description: "Serin manzara, sakin bir ışık",
    appearance: {
      wallpaper: { type: "preset", presetId: "kis-aksami" },
      tiles: "sade",
      labels: "logo-ad",
      logoColor: "marka",
      fontStyle: "yumusak",
      lamp: 8,
    },
  },
];

export function applyTheme(design: HomeDesign, theme: HomeTheme): HomeDesign {
  return {
    ...design,
    ...theme.appearance,
    wallpaper: { ...theme.appearance.wallpaper },
  };
}

export function matchingTheme(design: HomeDesign): HomeTheme | undefined {
  return HOME_THEMES.find(
    ({ appearance }) =>
      design.wallpaper.type === "preset" &&
      appearance.wallpaper.type === "preset" &&
      design.wallpaper.presetId === appearance.wallpaper.presetId &&
      design.tiles === appearance.tiles &&
      design.labels === appearance.labels &&
      design.logoColor === appearance.logoColor &&
      design.fontStyle === appearance.fontStyle &&
      design.lamp === appearance.lamp,
  );
}
