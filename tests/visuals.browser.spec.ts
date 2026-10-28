import { expect, test, type Page } from "@playwright/test";

import { createDefaultDesign, STORAGE_KEY, WALLPAPER_PRESET_IDS, type HomeDesign } from "../lib/design";

async function openDesign(page: Page, design: HomeDesign) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: design });
  await page.goto("/tv");
  await expect(page.locator("[data-font]")).toBeVisible();
}

async function updateDesign(page: Page, design: HomeDesign) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("a850c-design-change"));
  }, { key: STORAGE_KEY, value: design });
}

test("clock reveals its app row for a phone direction event", async ({ page }) => {
  await openDesign(page, { ...createDefaultDesign(), layout: "saat" });
  await expect(page.locator("[data-app-mark]")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("tv-reveal-apps")));
  await expect(page.locator("[data-app-mark]")).toHaveCount(6);
});

test("clock waits for a direction and ignores unrelated keys", async ({ page }) => {
  await openDesign(page, { ...createDefaultDesign(), layout: "saat" });
  await page.keyboard.press("a");
  await expect(page.locator("[data-app-mark]")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-app-mark]")).toHaveCount(6);
  await expect(page.locator('[data-focused="true"]')).toHaveAttribute("data-focus-key", "app:app-youtube");
});

test("changing tile style retains the frosted glass highlight", async ({ page }) => {
  const design = createDefaultDesign();
  await openDesign(page, design);
  const tile = page.locator("[data-app-mark]").first();
  await expect(tile).toHaveCSS("background-image", /linear-gradient/);
  await updateDesign(page, { ...design, tiles: "sade" });
  await expect(tile).toHaveCSS("background-color", "rgba(255, 255, 255, 0.1)");
  await expect(tile).toHaveCSS("background-image", /linear-gradient/);
});

for (const layout of ["mozaik", "salon", "sinema", "saat"] as const) {
  test(`${layout} renders all appearance choices and keeps the default tiles visible`, async ({ page }) => {
    const design = { ...createDefaultDesign(), layout };
    await openDesign(page, design);
    if (layout === "saat") await page.keyboard.press("ArrowRight");
    const apps = page.locator("[data-app-mark]");
    await expect(apps).toHaveCount(6);
    for (const app of await apps.all()) await expect(app).toBeInViewport();
    for (const labels of ["logo", "ad", "logo-ad"] as const) {
      await updateDesign(page, { ...design, labels });
      for (const app of await apps.all()) {
        await expect(app.locator("svg")).toHaveCount(labels === "ad" ? 0 : 1);
        const label = await app.getAttribute("aria-label");
        const visibleName = app.locator(":scope > span > span:not(:has(svg))");
        await expect(visibleName).toHaveCount(labels === "logo" ? 0 : 1);
        if (labels !== "logo") await expect(visibleName).toHaveText(label!);
      }
    }
    await updateDesign(page, { ...design, tiles: "marka", logoColor: "marka" });
    await expect(apps.first()).toHaveCSS("background-color", "rgb(255, 0, 51)");
    await updateDesign(page, { ...design, tiles: "marka", logoColor: "tek" });
    await expect(apps.first()).toHaveCSS("background-color", "rgb(37, 44, 56)");
    await updateDesign(page, { ...design, tiles: "sade", logoColor: "marka" });
    await expect(apps.first()).toHaveCSS("background-color", "rgba(255, 255, 255, 0.1)");
    await expect(apps.first().locator("svg path").first()).toHaveAttribute("fill", "#FF0033");
    await updateDesign(page, { ...design, tiles: "sade", logoColor: "tek" });
    await expect(apps.first().locator("svg path").first()).toHaveAttribute("fill", "#FFFFFF");
    await updateDesign(page, { ...design, fontStyle: "yumusak" });
    await expect(page.locator("[data-font]")).toHaveAttribute("data-font", "yumusak");
    const softFont = await apps.first().evaluate((node) => getComputedStyle(node).fontFamily);
    await updateDesign(page, { ...design, fontStyle: "modern" });
    await expect(page.locator("[data-font]")).toHaveAttribute("data-font", "modern");
    expect(await apps.first().evaluate((node) => getComputedStyle(node).fontFamily)).not.toEqual(softFont);
    await page.screenshot({ path: `/tmp/a850c-${layout}.png` });
  });
}

test("all wallpaper scenes are available as distinct image resources", async ({ page }) => {
  await openDesign(page, createDefaultDesign());
  const signatures: string[] = [];
  for (const presetId of WALLPAPER_PRESET_IDS) {
    const response = await page.request.get(`/wallpapers/${presetId}.jpg`);
    expect(response.ok(), presetId).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/");
    const image = await response.body();
    expect(image.byteLength).toBeGreaterThan(1000);
    signatures.push(image.toString("base64"));
    await updateDesign(page, { ...createDefaultDesign(), wallpaper: { type: "preset", presetId } });
    await expect(page.locator("[data-font] > div").first()).toHaveCSS("background-image", new RegExp(`/wallpapers/${presetId}.jpg`));
  }
  expect(new Set(signatures).size).toBe(8);
});

test("mosaic scrolls additional apps into view with matching remote navigation", async ({ page }) => {
  const design = createDefaultDesign();
  design.apps = [...design.apps, ...Array.from({ length: 6 }, (_, i) => ({ id: `extra-${i}`, name: `Extra ${i}`, colorId: "tas" as const }))];
  await openDesign(page, design);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-focus-key="app:extra-0"]')).toHaveAttribute("data-focused", "true");
  await expect(page.locator('[data-focus-key="app:extra-0"]')).toBeInViewport();
});

for (const viewport of [{ width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
  test(`appearance panel applies a theme and its controls at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const original = createDefaultDesign();
    await openDesign(page, original);
    await page.goto("/");
    const theme = page.getByRole("button", { name: "Amber Salon temasını uygula" });
    await theme.click();
    await expect(theme).toHaveAttribute("aria-pressed", "true");
    const saved = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
    await expect.poll(async () => (await saved()).fontStyle).toBe("yumusak");
    const themed = await saved();
    expect(themed.wallpaper).toEqual({ type: "preset", presetId: "bakir-lamba" });
    expect(themed.tiles).toBe("sade");
    expect(themed.logoColor).toBe("tek");
    expect(themed.lamp).toBe(40);
    expect(themed.apps).toEqual(original.apps);
    expect(themed.rows).toEqual(original.rows);
    expect(themed.layout).toBe("mozaik");
    await page.screenshot({ path: `/tmp/a850c-theme-${viewport.width}.png`, fullPage: true });
    for (const layout of ["salon", "sinema", "saat", "mozaik"]) {
      await page.getByRole("button", { name: "Tasarım sonraki" }).click();
      await expect.poll(async () => (await saved()).layout).toBe(layout);
    }
    const lamp = page.getByRole("slider", { name: "Lamba yoğunluğu" });
    await lamp.focus();
    await lamp.press("End");
    await lamp.press("ArrowLeft");
    await expect.poll(async () => (await saved()).lamp).toBe(99);
    const fixture = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#dfb366";
      context.fillRect(0, 0, 640, 360);
      return canvas.toDataURL("image/png").split(",")[1]!;
    });
    await page.getByLabel("Duvar fotoğrafı seç").setInputFiles({ name: "salon.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") });
    await expect.poll(async () => (await saved()).wallpaper.type).toBe("image");
    await page.getByRole("button", { name: "Uygulamalar" }).click();
    await expect(page.locator("#panel-apps")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  });
}
