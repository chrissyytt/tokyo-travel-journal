import { test, expect } from "@playwright/test";
test("mobile journal CRUD, photos, persistence, currency, backup and layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("已儲存於此瀏覽器").first()).toBeVisible();
  await expect(page.locator('.day-toggle[aria-expanded="false"]')).toHaveCount(
    5,
  );
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 2000;
      c.height = 1000;
      c.getContext("2d")!.fillRect(0, 0, 2000, 1000);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page.getByRole("button", { name: "新增行程", exact: true }).click();
  await page.getByLabel("名稱", { exact: true }).fill("測試散步");
  await page.getByLabel("地址", { exact: true }).fill("東京都新宿区");
  await page
    .getByLabel("上傳照片", { exact: true })
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("旅行照片預覽")).toBeVisible();
  await page.getByLabel("照片說明").fill("沿途風景");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await page.locator(".day-toggle").first().click();
  await expect(page.getByRole("heading", { name: "測試散步" })).toBeVisible();
  await page
    .getByRole("button", { name: "上移 測試散步", exact: true })
    .click();
  await page.reload();
  await page.locator(".day-toggle").first().click();
  await expect(page.getByAltText("沿途風景")).toBeVisible();
  await page
    .getByRole("button", { name: "編輯 測試散步", exact: true })
    .click();
  await page.getByLabel("名稱", { exact: true }).fill("散步已修改");
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await page.reload();
  await page.locator(".day-toggle").first().click();
  await expect(page.getByRole("heading", { name: "散步已修改" })).toBeVisible();
  await page
    .getByRole("button", { name: "口袋名單", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "新增收藏", exact: true }).click();
  await page.getByLabel("名稱", { exact: true }).fill("新宿咖啡");
  await page.getByLabel("區域").fill("新宿");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await page.getByPlaceholder("名稱、區域或備註").fill("新宿");
  await expect(page.getByRole("heading", { name: "新宿咖啡" })).toBeVisible();
  await page
    .getByRole("button", { name: "行李清單", exact: true })
    .last()
    .click();
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "新增物品", exact: true }).click();
  await page.getByLabel("名稱", { exact: true }).fill("測試圍巾");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await page.getByRole("button", { name: "記帳", exact: true }).last().click();
  await expect(page.locator(".budget strong")).toContainText("18,649");
  await page.getByRole("button", { name: "新增支出", exact: true }).click();
  await page.getByLabel("名稱", { exact: true }).fill("測試咖啡");
  await page.getByLabel("金額", { exact: true }).fill("1000");
  await page.getByLabel("幣別").selectOption("JPY");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(page.locator(".budget strong")).toContainText("18,869");
  await page.getByLabel("參考匯率", { exact: true }).fill("0.25");
  await expect(page.locator(".budget strong")).toContainText("18,899");
  await page.getByRole("button", { name: "設定與備份" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "完整匯出（含照片）" }).click();
  const backup = await download;
  const path = await backup.path();
  expect(path).toBeTruthy();
  await page.getByRole("button", { name: "關閉視窗" }).click();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "刪除 測試咖啡", exact: true })
    .click();
  await expect(page.locator(".budget strong")).toContainText("18,649");
  await page.getByRole("button", { name: "設定與備份" }).click();
  await page
    .locator('input[type=file][accept="application/json,.json"]')
    .setInputFiles(path!);
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "已儲存",
  );
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await page.reload();
  await page.getByRole("button", { name: "記帳", exact: true }).last().click();
  await expect(page.locator(".budget strong")).toContainText("18,899");
  await page
    .getByRole("button", { name: "行李清單", exact: true })
    .last()
    .click();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByText("測試圍巾", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "行程", exact: true }).last().click();
  await page.locator(".day-toggle").first().click();
  await expect(page.getByAltText("沿途風景")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("invalid backup never overwrites existing data", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "設定與備份" }).click();
  await page
    .locator('input[type=file][accept="application/json,.json"]')
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":1}'),
    });
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await expect(page.getByRole("alert")).toContainText("備份格式不正確");
  await page.reload();
  await expect(page.locator(".day")).toHaveCount(5);
});

test("photo compression and deletion, all tabs fit narrow phones", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新增行程", exact: true }).click();
  await page.getByLabel("名稱", { exact: true }).fill("照片測試");
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 2400;
      c.height = 1200;
      c.getContext("2d")!.fillRect(0, 0, 2400, 1200);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page
    .getByLabel("上傳照片", { exact: true })
    .setInputFiles({ name: "large.png", mimeType: "image/png", buffer: png });
  const image = page.getByAltText("旅行照片預覽");
  await expect(image).toBeVisible();
  expect(await image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(
    1600,
  );
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await page.locator(".day-toggle").first().click();
  await page
    .getByRole("button", { name: "編輯 照片測試", exact: true })
    .click();
  await page.getByRole("button", { name: "刪除照片", exact: true }).click();
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await page.reload();
  await page.locator(".day-toggle").first().click();
  await expect(page.locator(".photos img")).toHaveCount(0);
  for (const tab of ["行程", "口袋名單", "行李清單", "記帳"]) {
    await page.getByRole("button", { name: tab, exact: true }).last().click();
    await page.setViewportSize({ width: 320, height: 720 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});
