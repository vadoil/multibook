async (page) => {
  const base = "http://127.0.0.1:3001";
  const url =
    base + "/product/modulnaya-tetrad-a5-s-nabornym-blokom-multibook-7-106603";
  const results = [];
  for (const width of [1366, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    await page.goto(url);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((i) => {
          i.loading = "eager";
          return i.decode().catch(() => {});
        }),
      );
    });
    const section = page.getByRole("region", {
      name: "Дополните свой блокнот",
    });
    await section.waitFor();
    const headings = await section
      .getByRole("heading", { level: 3 })
      .allTextContents();
    const count = await section.locator('a[href^="/product/"]').count();
    const broken = await page.evaluate(
      () => [...document.images].filter((i) => !i.naturalWidth).length,
    );
    const scroll = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    if (
      count !== 8 ||
      broken ||
      scroll > width ||
      headings[0] !== "Блоки листов А5" ||
      headings[1] !== "Обложки А5"
    )
      throw Error(JSON.stringify({ count, broken, scroll, headings }));
    if (
      await page
        .getByRole("heading", { name: "Ещё в разделе «Тетради»" })
        .count()
    )
      throw Error("Old alternatives remain");
    await page.screenshot({
      path: `docs/design/catalog/product-${width}.png`,
      fullPage: true,
    });
    await section.getByRole("heading", { level: 2 }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/design/catalog/complements-${width}.png`,
    });
    results.push({ width, count, headings, scroll, broken });
  }
  await page.goto(base + "/product/mini-bloknot-multibook-kuba-685182");
  const mini = page.getByRole("region", { name: "Дополните свой блокнот" });
  const text = await mini.innerText();
  if (
    !text.includes("Блоки листов Мини куб") ||
    text.includes("Обложки А5") ||
    text.includes("Наборы по 8")
  )
    throw Error("Mini compatibility");
  results.push({
    mini: true,
    items: await mini.locator('a[href^="/product/"]').count(),
  });
  return results;
};
