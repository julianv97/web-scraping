const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();

  await page.goto("https://www.mercadolibre.com.ar/");

  await page.type(".nav-search-input", "nintendo switch");

  await page.click(".nav-search-btn");

  await page.waitForSelector("li.ui-search-layout__item");

  const hrefs = await page.evaluate(() => {
    const elements = document.querySelectorAll(
      ".ui-search-item__group--title a.ui-search-item__group__element"
    );

    const links = [];
    for (let element of elements) {
      links.push(element.href);
    }
    return links;
  });

  let Switches = [];

  for (let href of hrefs) {
    await page.goto(href);
    await page.waitForSelector(".ui-pdp-header__title-container");
    const consola = await page.evaluate(() => {
      const tmp = {};
      try {
        tmp.title =
          document
            .querySelector(".ui-pdp-title")
            .innerText.includes("Switch") &&
          !document.querySelector(".ui-pdp-title").innerText.includes("Lite")
            ? document.querySelector(".ui-pdp-title").innerText
            : null;
        tmp.price =
          parseFloat(document.querySelector(".price-tag-fraction").innerText) *
          1000;

        return tmp;
      } catch (error) {
        console.log(error);
      }
    });

    consola.link = href;

    if (consola.title && consola.price > 20000) Switches.push(consola);
  }
  Switches = Switches.sort((a, b) => (a.price > b.price ? 1 : -1));
  console.log(Switches, Switches.length);
  browser.close();
})();

