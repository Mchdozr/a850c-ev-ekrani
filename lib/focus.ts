import type { HomeDesign } from "@/lib/design";
import { appMarkKind } from "@/lib/marks";
import { mosaicSlots } from "@/lib/mosaic";

export type Direction = "up" | "down" | "left" | "right";

export type FocusTarget =
  | { kind: "app"; appId: string }
  | { kind: "card"; rowId: string; cardId: string }
  | { kind: "hero"; rowId: string; cardId: string };

export type FocusMap =
  | { mode: "rows"; rows: string[][] }
  | { mode: "columns"; columns: string[][] };

export function appKey(id: string): string {
  return `app:${id}`;
}

export function cardKey(rowId: string, cardId: string): string {
  return `card:${rowId}:${cardId}`;
}

export function heroKey(rowId: string, cardId: string): string {
  return `hero:${rowId}:${cardId}`;
}

export function parseFocusKey(key: string): FocusTarget | null {
  const [kind, first, second] = key.split(":");
  if (!first) {
    return null;
  }
  switch (kind) {
    case "app":
      return second ? null : { kind: "app", appId: first };
    case "card":
      if (!second) {
        return null;
      }
      return { kind: "card", rowId: first, cardId: second };
    case "hero":
      if (!second) {
        return null;
      }
      return { kind: "hero", rowId: first, cardId: second };
    default:
      return null;
  }
}

function mosaicFocusRows(design: HomeDesign): string[][] {
  const grouped = new Map<number, { column: number; key: string }[]>();
  for (const slot of mosaicSlots(design.apps)) {
    const row = grouped.get(slot.row) ?? [];
    row.push({ column: slot.column, key: appKey(slot.app.id) });
    grouped.set(slot.row, row);
  }
  return [...grouped.keys()]
    .sort((left, right) => left - right)
    .map((row) =>
      (grouped.get(row) ?? [])
        .sort((left, right) => left.column - right.column)
        .map((slot) => slot.key),
    );
}

function salonRows(design: HomeDesign): string[][] {
  return design.apps.length > 0
    ? [design.apps.map((app) => appKey(app.id))]
    : [];
}

function sinemaColumns(design: HomeDesign): string[][] {
  const cards = design.rows.flatMap((row) =>
    row.cards.map((card) => ({ rowId: row.id, cardId: card.id })),
  );
  const hero = cards[0];
  const columns: string[][] = [];
  if (hero) {
    columns.push([heroKey(hero.rowId, hero.cardId)]);
  }
  const side = cards.slice(1).map((card) => cardKey(card.rowId, card.cardId));
  if (side.length > 0) {
    columns.push(side);
  }
  if (design.apps.length > 0) {
    columns.push(design.apps.map((app) => appKey(app.id)));
  }
  return columns;
}

export function buildFocusMap(design: HomeDesign): FocusMap {
  switch (design.layout) {
    case "mozaik":
      return { mode: "rows", rows: mosaicFocusRows(design) };
    case "salon":
      return { mode: "rows", rows: salonRows(design) };
    case "sinema":
      return { mode: "columns", columns: sinemaColumns(design) };
    case "saat":
      return {
        mode: "rows",
        rows:
          design.apps.length > 0
            ? [design.apps.map((app) => appKey(app.id))]
            : [],
      };
    default: {
      const exhaustive: never = design.layout;
      return exhaustive;
    }
  }
}

export function firstFocusKey(map: FocusMap): string | null {
  switch (map.mode) {
    case "rows":
      for (const row of map.rows) {
        if (row[0]) {
          return row[0];
        }
      }
      return null;
    case "columns":
      for (const column of map.columns) {
        if (column[0]) {
          return column[0];
        }
      }
      return null;
    default: {
      const exhaustive: never = map;
      return exhaustive;
    }
  }
}

export function focusMapHas(map: FocusMap, key: string): boolean {
  switch (map.mode) {
    case "rows":
      return map.rows.some((row) => row.includes(key));
    case "columns":
      return map.columns.some((column) => column.includes(key));
    default: {
      const exhaustive: never = map;
      return exhaustive;
    }
  }
}

function moveRows(
  rows: string[][],
  current: string | null,
  direction: Direction,
): string | null {
  const filled = rows.filter((row) => row.length > 0);
  if (filled.length === 0) {
    return null;
  }
  let rowIndex = 0;
  let columnIndex = 0;
  let found = false;
  if (current) {
    for (let index = 0; index < filled.length; index += 1) {
      const column = filled[index]?.indexOf(current) ?? -1;
      if (column >= 0) {
        rowIndex = index;
        columnIndex = column;
        found = true;
        break;
      }
    }
  }
  if (!found) {
    return filled[0]?.[0] ?? null;
  }
  const row = filled[rowIndex] ?? [];
  switch (direction) {
    case "left":
      return row[Math.max(0, columnIndex - 1)] ?? null;
    case "right":
      return row[Math.min(row.length - 1, columnIndex + 1)] ?? null;
    case "up": {
      const nextRow = filled[Math.max(0, rowIndex - 1)] ?? row;
      return nextRow[Math.min(columnIndex, nextRow.length - 1)] ?? null;
    }
    case "down": {
      const nextRow = filled[Math.min(filled.length - 1, rowIndex + 1)] ?? row;
      return nextRow[Math.min(columnIndex, nextRow.length - 1)] ?? null;
    }
    default: {
      const exhaustive: never = direction;
      return exhaustive;
    }
  }
}

function moveColumns(
  columns: string[][],
  current: string | null,
  direction: Direction,
): string | null {
  const filled = columns.filter((column) => column.length > 0);
  if (filled.length === 0) {
    return null;
  }
  let columnIndex = 0;
  let rowIndex = 0;
  let found = false;
  if (current) {
    for (let index = 0; index < filled.length; index += 1) {
      const row = filled[index]?.indexOf(current) ?? -1;
      if (row >= 0) {
        columnIndex = index;
        rowIndex = row;
        found = true;
        break;
      }
    }
  }
  if (!found) {
    return filled[0]?.[0] ?? null;
  }
  const column = filled[columnIndex] ?? [];
  switch (direction) {
    case "up":
      return column[Math.max(0, rowIndex - 1)] ?? null;
    case "down":
      return column[Math.min(column.length - 1, rowIndex + 1)] ?? null;
    case "left": {
      const nextColumn = filled[Math.max(0, columnIndex - 1)] ?? column;
      return nextColumn[Math.min(rowIndex, nextColumn.length - 1)] ?? null;
    }
    case "right": {
      const nextColumn =
        filled[Math.min(filled.length - 1, columnIndex + 1)] ?? column;
      return nextColumn[Math.min(rowIndex, nextColumn.length - 1)] ?? null;
    }
    default: {
      const exhaustive: never = direction;
      return exhaustive;
    }
  }
}

export function moveFocus(
  map: FocusMap,
  current: string | null,
  direction: Direction,
): string | null {
  switch (map.mode) {
    case "rows":
      return moveRows(map.rows, current, direction);
    case "columns":
      return moveColumns(map.columns, current, direction);
    default: {
      const exhaustive: never = map;
      return exhaustive;
    }
  }
}

export function focusKeyForMark(
  design: HomeDesign,
  mark: "youtube" | "netflix",
): string | null {
  const app = design.apps.find(
    (item) => appMarkKind(item.id, item.name) === mark,
  );
  if (!app) {
    return null;
  }
  const key = appKey(app.id);
  return focusMapHas(buildFocusMap(design), key) ? key : null;
}

export function focusTitle(design: HomeDesign, key: string): string {
  const target = parseFocusKey(key);
  if (!target) {
    return "Seçim";
  }
  switch (target.kind) {
    case "app":
      return (
        design.apps.find((app) => app.id === target.appId)?.name.trim() ||
        "Adsız uygulama"
      );
    case "card":
    case "hero": {
      const row = design.rows.find((item) => item.id === target.rowId);
      const card = row?.cards.find((item) => item.id === target.cardId);
      return card?.title.trim() || "Adsız kart";
    }
    default: {
      const exhaustive: never = target;
      return exhaustive;
    }
  }
}

export function focusKindLabel(key: string): string {
  const target = parseFocusKey(key);
  if (!target) {
    return "Öge";
  }
  switch (target.kind) {
    case "app":
      return "Uygulama";
    case "card":
      return "İçerik kartı";
    case "hero":
      return "Afiş";
    default: {
      const exhaustive: never = target;
      return exhaustive;
    }
  }
}
