const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.alumilite.com/resins/amazing-clear-cast/");

  /**
   *** - Product Data
   **/

  const title = await page.$eval(".productView-title.main-heading", (h1) =>
    h1.textContent?.trim()
  );

  const description = await page.$eval('div[itemprop="description"] p', (p) =>
    p.textContent?.trim()
  );

  const itemGroupId = await page.$eval(
    "[data-entity-id]",
    (el) => el.dataset.entityId
  );

  let bullets;
  if (await page.$('div[itemprop="description"] ul li')) {
    bullets = await page.$$eval('div[itemprop="description"] ul li', (list) =>
      list.map((item) => item.textContent?.trim())
    );
  }

  /**
   *** - Listing Variants
   **/

  const sizes = await page.evaluateHandle(() => {
    const container = [
      ...document.querySelectorAll(".productView-options-inner .form-field"),
    ].find((el) => el.textContent.toUpperCase().includes("SIZE"));

    return (
      container?.querySelectorAll("[data-product-attribute-value]") ?? [
        document,
      ]
    );
  });

  const colors = await page.evaluateHandle(() => {
    const container = [
      ...document.querySelectorAll(".productView-options-inner .form-field"),
    ].find((el) => el.textContent.toUpperCase().trim().startsWith("COLOR"));

    return (
      container?.querySelectorAll("[data-product-attribute-value]") ?? [
        document,
      ]
    );
  });

  /**
   *** - Variants
   **/
  const variants = await page.evaluate(
    async (sizes, colors) => {
      const variants = [];

      for (const size of sizes) {
        for (const color of colors) {
          const previousImage =
            document.querySelector("[data-zoom-image]")?.dataset?.zoomImage;

          if (color.tagName === "LABEL") color.click();
          if (color.tagName === "OPTION") {
            color.selected = true;
            const event = new Event("change", { bubbles: true });
            color.parentNode.dispatchEvent(event);
          }
          if (size.click) size.click();

          await new Promise(async (r) => {
            setTimeout(r, 15000);
            while (
              previousImage ===
              document.querySelector("[data-zoom-image]")?.dataset?.zoomImage
            ) {
              await new Promise((x) => setTimeout(x, 200));
            }
            r(true);
          });
          /**
           *** - Variant Data
           **/

          const id = `${size?.dataset?.productAttributeValue ?? ""} ${
            color?.dataset?.productAttributeValue ?? ""
          }`
            .trim()
            .replace(" ", "-");

          const price = Number(
            document
              .querySelector("[data-product-price-without-tax]")
              ?.textContent?.replace("$", "")
          );

          const image =
            document.querySelector("[data-zoom-image]")?.dataset?.zoomImage;

          const hasStock =
            document.querySelector(".productAttributes-message")?.style
              ?.display === "none";

          variants.push({
            id,
            size: size?.textContent?.trim(),
            color: color?.textContent?.trim(),
            options: {
              size: size?.textContent?.trim(),
              color: color?.textContent?.trim(),
            },
            price,
            image,
            hasStock,
          });
        }
      }
      return variants;
    },
    sizes,
    colors
  );

  const products = variants.map((variant) => {
    const variantId = itemGroupId + "-" + variant.id;
    const product = {};
    product.id = variantId;
    product.title = title;
    product.description = description;
    product.bullets = bullets;
    product.itemGroupId = itemGroupId;
    product.size = variant.size;
    product.color = variant.color ? variant.color : 'Color Único'
    product.options = variant.options;
    product.images = variant.image;
    product.avaibility = variant.hasStock;
    product.price = variant.price;
    product.currency = "USD";

    return product;
  });

  console.log(products);
  browser.close();
})();
