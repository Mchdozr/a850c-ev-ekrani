import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TvScreen } from "../components/tv-screen";
import { createDefaultDesign, newId, PANEL_LAYOUT_IDS, wallpaperBackground, type HomeDesign, type WallpaperPresetId } from "../lib/design";
import { appKey, buildFocusMap, firstFocusKey } from "../lib/focus";
import { mosaicSlots } from "../lib/mosaic";

function render(design: HomeDesign) {
  return renderToStaticMarkup(createElement(TvScreen, { design, focusKey: null, onActivate: () => {} }));
}

function appButtons(markup: string) {
  return [...markup.matchAll(/<button\b[^>]*data-app-mark="[^"]+"[^>]*>[\s\S]*?<\/button>/g)].map((match) => match[0]);
}

test("new app IDs remain unique valid UUIDs on HTTP LAN pages without randomUUID", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis.crypto, "randomUUID");
  Object.defineProperty(globalThis.crypto, "randomUUID", { value: undefined, configurable: true });
  try {
    const ids = Array.from({ length: 100 }, () => newId());
    assert.equal(new Set(ids).size, 100);
    for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally {
    if (previous) Object.defineProperty(globalThis.crypto, "randomUUID", previous);
    else Reflect.deleteProperty(globalThis.crypto, "randomUUID");
  }
});

test("every selectable layout includes the cinema screen", () => {
  assert.ok((PANEL_LAYOUT_IDS as readonly string[]).includes("sinema"));
});

test("every wallpaper preset resolves to its own scene asset", () => {
  const expected: WallpaperPresetId[] = ["istanbul-aksam", "sonbahar-bahce", "siyah", "bakir-lamba", "gece-cam", "somine", "zeytin-gece", "kis-aksami"];
  for (const id of expected) {
    assert.equal(wallpaperBackground(id), `center / cover no-repeat url("/wallpapers/${id}.jpg")`);
  }
});

test("salon navigation only targets the visible app row", () => {
  const design = { ...createDefaultDesign(), layout: "salon" as const };
  const map = buildFocusMap(design);
  assert.deepEqual(map, { mode: "rows", rows: [["app:app-youtube", "app:app-netflix", "app:app-disney", "app:app-blutv", "app:app-tabii", "app:app-ayarlar"]] });
  assert.equal(firstFocusKey(map), "app:app-youtube");
});

test("mosaic keeps the two lead apps level and packs extra apps without overlapping cells", () => {
  const design = createDefaultDesign();
  const apps = [...design.apps, ...Array.from({ length: 6 }, (_, i) => ({ id: `custom-${i}`, name: `Custom ${i}`, colorId: "tas" as const }))];
  const slots = mosaicSlots(apps);
  assert.deepEqual(slots.slice(0, 2).map(({ app, row, column, tall }) => ({ id: app.id, row, column, tall })), [
    { id: "app-youtube", row: 1, column: 1, tall: false },
    { id: "app-netflix", row: 1, column: 2, tall: false },
  ]);
  assert.equal(new Set(slots.map(({ row, column }) => `${row}:${column}`)).size, 12);
  assert.deepEqual(slots.slice(2, 6).map(({ app, row }) => [app.id, row]), [["app-disney", 2], ["app-blutv", 2], ["app-tabii", 2], ["app-ayarlar", 2]]);
  assert.equal(slots[6]?.row, 3);
});

test("mosaic keeps secondary apps together when only one lead app remains", () => {
  const apps = createDefaultDesign().apps.filter((app) => app.id !== "app-netflix");
  assert.deepEqual(mosaicSlots(apps).map(({ app, row, column }) => [app.id, row, column]), [
    ["app-youtube", 1, 1], ["app-disney", 2, 1], ["app-blutv", 2, 2], ["app-tabii", 2, 3], ["app-ayarlar", 2, 4],
  ]);
});

for (const layout of ["mozaik", "salon", "sinema"] as const) {
  test(`${layout} applies app name, logo and both modes to every app`, () => {
    const design = { ...createDefaultDesign(), layout };
    const names = appButtons(render({ ...design, labels: "ad" }));
    const logos = appButtons(render({ ...design, labels: "logo" }));
    const both = appButtons(render({ ...design, labels: "logo-ad" }));
    assert.equal(names.length, 6);
    for (const [index, app] of design.apps.entries()) {
      assert.ok(names[index]?.includes(`>${app.name}</span>`), `${app.name} visible name`);
      assert.ok(!names[index]?.includes("<svg"), `${app.name} name only`);
      assert.ok(logos[index]?.includes("<svg"), `${app.name} visible vector logo`);
      assert.ok(!logos[index]?.includes(`>${app.name}</span>`), `${app.name} no repeated name`);
      assert.ok(both[index]?.includes(`>${app.name}</span>`), `${app.name} name with logo`);
      assert.ok(both[index]?.includes("<svg"), `${app.name} logo with name`);
    }
  });

  test(`${layout} applies simple tiles and monochrome logos without bitmap plates`, () => {
    const design = { ...createDefaultDesign(), layout, labels: "logo" as const };
    const brand = appButtons(render(design));
    const simple = appButtons(render({ ...design, tiles: "sade" }));
    const mono = appButtons(render({ ...design, tiles: "sade", logoColor: "tek" }));
    for (let i = 0; i < 6; i += 1) {
      assert.notEqual(brand[i]?.match(/style="([^"]+)"/)?.[1], simple[i]?.match(/style="([^"]+)"/)?.[1]);
      assert.ok(!brand[i]?.includes("<img"));
      assert.ok(mono[i]?.includes('fill="#FFFFFF"'));
    }
    assert.notEqual(simple[0], mono[0]);
  });
}

test("clock screen initially hides the app row", () => {
  assert.equal(appButtons(render({ ...createDefaultDesign(), layout: "saat" })).length, 0);
});

test("photo presets and uploaded backgrounds both retain ambient light and the same gentle scrim", () => {
  const design = createDefaultDesign();
  const preset = render(design);
  const image = render({ ...design, wallpaper: { type: "image", dataUrl: "data:image/png;base64,AAAA", name: "Room" } });
  assert.ok(preset.includes("lamp-glow"));
  assert.ok(image.includes("lamp-glow"));
  assert.equal(preset.match(/background:linear-gradient\(180deg[^\"]+/)?.[0], image.match(/background:linear-gradient\(180deg[^\"]+/)?.[0]);
});

test("mosaic renders every configured app exactly once", () => {
  const design = createDefaultDesign();
  design.apps = [...design.apps, ...Array.from({ length: 6 }, (_, i) => ({ id: `extra-${i}`, name: `Extra ${i}`, colorId: "tas" as const }))];
  const markup = render(design);
  for (const app of design.apps) assert.equal(markup.split(`data-focus-key="${appKey(app.id)}"`).length - 1, 1);
});
