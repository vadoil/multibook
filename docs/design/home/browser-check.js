async (page) => {
  const path = "docs/design/home";
  const results = [];
  for (const concept of ["paper", "journal", "play"]) {
    for (const width of [1366, 375]) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`http://127.0.0.1:3001/design-preview/${concept}`);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        );
      });
      const audit = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        choices: [...document.querySelectorAll(".mc-shop-choice")].map((a) => ({
          href: a.getAttribute("href"),
          height: a.getBoundingClientRect().height,
          text: a.innerText,
        })),
        sections: [...document.querySelectorAll(".mc-content section")].map(
          (s) => ({
            class: s.className,
            visual: !!s.querySelector("img,svg,video"),
          }),
        ),
        oldOverlap: document.querySelectorAll(".mc-stage").length,
        reducedVideos: [...document.querySelectorAll("video")].map((v) => ({
          paused: v.paused,
          src: v.getAttribute("src"),
        })),
      }));
      if (
        audit.scroll > width ||
        audit.choices.some((a) => a.height < 44) ||
        audit.sections.some((s) => !s.visual) ||
        audit.oldOverlap ||
        audit.reducedVideos.some((v) => !v.paused || v.src)
      )
        throw Error(JSON.stringify(audit));
      await page.screenshot({
        path: `${path}/${concept}-${width}.png`,
        fullPage: true,
      });
      await page.screenshot({ path: `${path}/${concept}-hero-${width}.png` });
      if (width === 375) {
        const menu = page.getByRole("button", { name: "Открыть меню" });
        await menu.click();
        if (
          !(await page
            .getByRole("navigation", { name: "Мобильное меню" })
            .isVisible())
        )
          throw Error("Menu not open");
        await page.keyboard.press("Escape");
        if ((await menu.getAttribute("aria-expanded")) !== "false")
          throw Error("Escape failed");
      }
      results.push({ concept, ...audit });
    }
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:3001/design-preview/journal");
  const video = page.locator(".mc-storefront-hero video");
  await video.evaluate((v) => v.play());
  await page.waitForFunction(() => {
    const v = document.querySelector(".mc-storefront-hero video");
    return v?.readyState >= 2 && v.currentTime > 0;
  });
  await video.evaluate((v) => {
    v.pause();
    v.currentTime = 2.1;
  });
  await page.waitForFunction(
    () =>
      Math.abs(
        document.querySelector(".mc-storefront-hero video").currentTime - 2.1,
      ) < 0.04,
  );
  await page.screenshot({ path: `${path}/journal-assembly-1366.png` });
  const pause = page
    .getByRole("button", { name: "Приостановить сборку блокнота" })
    .first();
  await pause.click();
  if (
    (await page
      .getByRole("button", { name: "Продолжить сборку блокнота" })
      .first()
      .getAttribute("aria-pressed")) !== "true"
  )
    throw Error("pause state");
  await page.mouse.move(20, 20);
  const paused = await video.evaluate((v) => v.paused);
  if (!paused) throw Error("not paused");
  await page
    .getByRole("button", { name: "Продолжить сборку блокнота" })
    .first()
    .click();
  await page.mouse.move(20, 20);
  await page.locator("h1").click();
  await page.waitForFunction(
    () => !document.querySelector(".mc-storefront-hero video").paused,
  );
  const videoState = await video.evaluate((v) => ({
    readyState: v.readyState,
    duration: v.duration,
    muted: v.muted,
    loop: v.loop,
    paused: v.paused,
    width: v.videoWidth,
    height: v.videoHeight,
  }));
  results.push({ video: videoState });
  return results;
};
