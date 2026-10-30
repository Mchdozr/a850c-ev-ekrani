import type { DockApp, HomeDesign } from "@/lib/design";
import { appMarkKind, type AppMarkKind } from "@/lib/marks";

export type MosaicSlot = {
  app: DockApp;
  column: number;
  row: number;
  tall: boolean;
  featured: boolean;
};

export function mosaicSlots(apps: readonly DockApp[]): MosaicSlot[] {
  const netflix = apps.find((app) => appMarkKind(app.id, app.name) === "netflix");
  const youtube = apps.find((app) => appMarkKind(app.id, app.name) === "youtube");
  const rest = apps.filter((app) => app !== netflix && app !== youtube);
  if (!netflix && !youtube) {
    return apps.map((app, index) => ({
      app,
      column: (index % 4) + 1,
      row: Math.floor(index / 4) + 1,
      tall: false,
      featured: false,
    }));
  }
  const slots: MosaicSlot[] = [];
  let leadColumn = 1;
  if (youtube) {
    slots.push({
      app: youtube,
      column: leadColumn,
      row: 1,
      tall: false,
      featured: true,
    });
    leadColumn += 1;
  }
  if (netflix) {
    slots.push({
      app: netflix,
      column: leadColumn,
      row: 1,
      tall: false,
      featured: true,
    });
  }
  rest.forEach((app, index) => {
    const column = (index % 4) + 1;
    const row = Math.floor(index / 4) + 2;
    slots.push({
      app,
      column,
      row,
      tall: false,
      featured: false,
    });
  });
  return slots;
}

export function tileFill(
  kind: AppMarkKind,
  tiles: HomeDesign["tiles"],
  logoColor: HomeDesign["logoColor"],
  swatch: string,
): string {
  if (tiles === "sade") {
    return "rgba(255,255,255,0.10)";
  }
  if (logoColor === "tek") {
    return "#252C38";
  }
  switch (kind) {
    case "netflix":
      return "#141418";
    case "youtube":
      return "#FF0033";
    case "disney":
      return "#102657";
    case "blutv":
      return "#087BCD";
    case "tabii":
      return "#047A55";
    case "ayarlar":
      return "#39424F";
    case "canli-tv":
      return "#6A3D1B";
    case "letter":
      return swatch;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function tileInk(fill: string): string {
  if (fill === "#F4F4F5" || fill === "#FFFFFF") {
    return "#141414";
  }
  return "#FFFFFF";
}

export function glyphFill(
  kind: AppMarkKind,
  tiles: HomeDesign["tiles"],
  logoColor: HomeDesign["logoColor"],
  ink: string,
): string {
  if (logoColor === "tek") {
    return "#FFFFFF";
  }
  if (tiles === "sade") {
    switch (kind) {
      case "youtube":
        return "#FF0033";
      case "netflix":
        return "#E50914";
      case "disney":
        return "#8EB6FF";
      case "blutv":
        return "#6CCAFF";
      case "tabii":
        return "#7DFFC3";
      case "ayarlar":
        return "#F4F4F6";
      case "canli-tv":
        return "#FFD29B";
      case "letter":
        return "#FFFFFF";
      default: {
        const exhaustive: never = kind;
        return exhaustive;
      }
    }
  }
  switch (kind) {
    case "youtube":
    case "netflix":
    case "disney":
    case "blutv":
    case "tabii":
    case "ayarlar":
    case "canli-tv":
      return "#FFFFFF";
    case "letter":
      return ink;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
