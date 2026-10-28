import { test, expect } from "@playwright/test";

test("the designer's Kumanda link controls the same browser session", async ({ context, page }) => {
  const tv = await context.newPage();
  await tv.goto("/tv");
  await page.goto("/");
  await page.getByRole("link", { name: "Kumanda", exact: true }).click();
  await expect(page.locator("[data-kumanda-status]")).toHaveText("Bağlı", { timeout: 6000 });
  await page.getByRole("button", { name: "Sağ", exact: true }).click();
  await expect(tv.locator('[data-focused="true"]')).toHaveAttribute("data-focus-key", "app:app-netflix");
});

test("paired phone controls only its preview and reveals clock applications", async ({ browser, baseURL }) => {
  const screen = await browser.newContext();
  const tv = await screen.newPage();
  await tv.goto(`${baseURL}/tv`);
  await expect(tv.locator('[data-focus-key="app:app-youtube"]')).toBeVisible();
  const session = await tv.evaluate(() => localStorage.getItem("a850c-remote-session-v1"));
  expect(session).toMatch(/^[a-f0-9]{32}$/);
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const phone = await phoneContext.newPage();
  await phone.goto(`${baseURL}/kumanda?session=${session}`);
  await expect(phone.locator("[data-kumanda-status]")).toHaveText("Bağlı");
  await phone.getByRole("button", { name: "Sağ", exact: true }).click();
  await expect(tv.locator('[data-focused="true"]')).toHaveAttribute("data-focus-key", "app:app-netflix");

  const other = await browser.newContext();
  const otherTv = await other.newPage();
  await otherTv.goto(`${baseURL}/tv`);
  await expect(otherTv.locator('[data-focused="true"]')).toHaveAttribute("data-focus-key", "app:app-youtube");
  await phone.getByRole("button", { name: "YouTube", exact: true }).click();
  await expect(tv.locator('[data-focused="true"]')).toHaveAttribute("data-focus-key", "app:app-youtube");
  await expect(otherTv.locator('[data-focused="true"]')).toHaveAttribute("data-focus-key", "app:app-youtube");

  await tv.evaluate(() => {
    const key = "a850c-ev-ekrani-v3";
    const value = localStorage.getItem(key);
    if (value) localStorage.setItem(key, JSON.stringify({ ...JSON.parse(value), layout: "saat" }));
  });
  // The default design is not persisted until edited; get a real export through designer.
  await tv.goto(`${baseURL}/`);
  const layoutRow = tv.getByRole("group", { name: "Tasarım", exact: true });
  await expect(layoutRow).toBeVisible();
  for (let i = 0; i < 3; i++) {
    if ((await layoutRow.textContent())?.includes("Saat")) break;
    await layoutRow.getByRole("button", { name: "Tasarım sonraki" }).click();
  }
  await tv.goto(`${baseURL}/tv`);
  await expect(tv.locator("[data-tv-item]")).toHaveCount(0);
  await expect(phone.locator("[data-kumanda-status]")).toHaveText("Bağlı");
  await phone.getByRole("button", { name: "Aşağı", exact: true }).click();
  await expect(tv.locator("[data-tv-item]")).toHaveCount(6);
  await phoneContext.close();
  await other.close();
  await screen.close();
});

test("pairing QR uses a reachable address and updates without retaining old code", async ({ page }) => {
  await page.goto("/tv");
  await page.getByRole("button", { name: "Telefonla bağlan" }).click();
  const origin = page.getByLabel("Sunucu adresi");
  await origin.fill("http://192.168.1.20:3000");
  await expect(page.getByAltText("Tarayıcı ekranı kumandasını açan QR kod")).toBeVisible();
  await expect(page.locator("[data-pairing-url]")).toHaveText(/^http:\/\/192\.168\.1\.20:3000\/kumanda\?session=[a-f0-9]{32}$/);
  await origin.fill("http://localhost:3000");
  await expect(page.getByAltText("Tarayıcı ekranı kumandasını açan QR kod")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Kumanda bağlantısını kopyala" })).toBeDisabled();
});

test("remote API rejects invalid channels, cross-origin commands and invalid commands", async ({ request, baseURL }) => {
  expect((await request.get("/api/kumanda?session=bad")).status()).toBe(400);
  expect((await request.post("/api/kumanda", { data: { command: "shell" } })).status()).toBe(400);
  expect((await request.post("/api/kumanda", { headers: { origin: "https://unrelated.example" }, data: { command: "left" } })).status()).toBe(403);
  expect((await request.post(`${baseURL}/api/kumanda`, { data: { command: "left" } })).status()).toBe(200);
});
