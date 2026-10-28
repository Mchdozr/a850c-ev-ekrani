import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultDesign, parseDesign } from "../lib/design";
import { HOME_THEMES, applyTheme, matchingTheme } from "../lib/themes";

test("a theme changes the screen's appearance while keeping its content and layout", () => {
  const original = {
    ...createDefaultDesign(),
    layout: "sinema" as const,
    profileName: "Deniz",
    greeting: "Hoş geldin",
    weatherLine: "Evde sakin bir akşam",
    showClock: false,
  };
  const before = structuredClone(original);
  const amber = HOME_THEMES.find((theme) => theme.id === "amber-salon");
  assert.ok(amber);

  const changed = applyTheme(original, amber);

  assert.equal(changed.layout, "sinema");
  assert.equal(changed.profileName, "Deniz");
  assert.equal(changed.greeting, "Hoş geldin");
  assert.equal(changed.weatherLine, "Evde sakin bir akşam");
  assert.equal(changed.showClock, false);
  assert.deepEqual(changed.apps, before.apps);
  assert.deepEqual(changed.rows, before.rows);
  assert.deepEqual(changed.wallpaper, {
    type: "preset",
    presetId: "bakir-lamba",
  });
  assert.equal(changed.fontStyle, "yumusak");
  assert.equal(changed.tiles, "sade");
  assert.notEqual(changed.lamp, before.lamp);
  assert.deepEqual(original, before);
  assert.deepEqual(parseDesign(changed), changed);
});

test("the gallery recognizes the applied theme and becomes custom after an appearance edit", () => {
  for (const theme of HOME_THEMES) {
    const applied = applyTheme(createDefaultDesign(), theme);
    assert.equal(matchingTheme(applied)?.id, theme.id);
    assert.equal(
      matchingTheme({ ...applied, lamp: applied.lamp + 1 }),
      undefined,
    );
    assert.equal(
      matchingTheme({ ...applied, greeting: "Farklı bir karşılama" })?.id,
      theme.id,
    );
    assert.deepEqual(parseDesign(applied), applied);
  }
});

test("editing an applied wallpaper cannot alter the shared gallery presets", () => {
  const theme = HOME_THEMES[0];
  assert.ok(theme);
  const applied = applyTheme(createDefaultDesign(), theme);
  assert.notEqual(applied.wallpaper, theme.appearance.wallpaper);
});
