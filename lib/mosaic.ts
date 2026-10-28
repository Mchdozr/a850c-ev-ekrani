import type { DockApp, HomeDesign } from "@/lib/design";
import { appMarkKind, type AppMarkKind } from "@/lib/marks";

export type MosaicSlot = {
  app: DockApp;
  column: number;
  row: number;
  tall: boolean;
  featured: boolean;
};

const SMALL_PLACES: { column: number; row: number }[] = [
  { column: 3, row: 1 },
  { column: 2, row: 2 },
  { column: 4, row: 1 },
  { column: 3, row: 2 },
  { column: 4, row: 2 },
];

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
    const placed = youtube && netflix ? { column: index + 1, row: 2 } : SMALL_PLACES[index];
    if (placed && index < 4) {
      slots.push({
        app,
        column: placed.column,
        row: placed.row,
        tall: false,
        featured: false,
      });
      return;
    }
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
    return "#202A36";
  }
  if (logoColor === "tek") {
    return "#F4F4F5";
  }
  switch (kind) {
    case "netflix":
      return "#FFFFFF";
    case "youtube":
      return "#FFFFFF";
    case "disney":
      return "#0C1445";
    case "blutv":
      return "#087BCD";
    case "tabii":
      return "#00A66C";
    case "ayarlar":
      return "#303946";
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
    return tileInk(tileFill(kind, tiles, logoColor, ink));
  }
  if (tiles === "sade") {
    switch (kind) {
      case "youtube":
        return "#FF0000";
      case "netflix":
        return "#E50914";
      case "disney":
        return "#8EB6FF";
      case "blutv":
        return "#B9D4FF";
      case "tabii":
        return "#7DFFC3";
      case "ayarlar":
        return "#F4F4F6";
      case "letter":
        return ink;
      default: {
        const exhaustive: never = kind;
        return exhaustive;
      }
    }
  }
  switch (kind) {
    case "youtube":
      return "#FF0000";
    case "netflix":
      return "#E50914";
    case "disney":
    case "blutv":
    case "tabii":
    case "ayarlar":
      return "#FFFFFF";
    case "letter":
      return ink;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
