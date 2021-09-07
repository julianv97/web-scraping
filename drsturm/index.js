const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://en.drsturm.com/sturm-joggers/");
  page.screenshot();

  //Cerrar modales al inicio
  const closeModal = await page.evaluate(() => {
    const node = document.querySelector(".subscriptionPopup-container");
    return (
      node &&
      window.getComputedStyle(node).getPropertyValue("display") !== "none"
    );
  });

  if (closeModal) {
    await page.click(".subscriptionPopup-close");
  }

  let products = [];

  //Consigo todas las variantes
  const sizesOptions = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll("label.form-option"));
    return list.map((li) => ({
      size: li.innerText.trim(),
      sizeId: li.getAttribute("data-product-attribute-value"),
      avalitiby: li.getAttribute("class"),
    }));
  });

  //Recorro las variantes y por cada una debería clickear en la opcion y luego recuperar la data
  for (option of sizesOptions) {
    const product = {};
    const { size, sizeId, avalitiby } = option;
    await page.click(`label[data-product-attribute-value="${sizeId}"]`);
    //page.screenshot({path:`size-${sizeId}.jpg`}) //Validar que se pueda clickear
    const getProductDescription = async () => {
      return await page.evaluate(() => {
        const description = document.querySelector(
          "#s-edc33359-4f6a-4ea6-91f8-6a1b55322041 > div > p:nth-child(1)"
        ).textContent;
        if (description) {
          return description;
        }
        return "";
      });
    };

    const getProductTitle = async () => {
      return await page.evaluate(() => {
        const title = document.querySelector(".productView-title").textContent;
        if (title) {
          return title;
        }
        return "No title";
      });
    };

    const getProductPrice = async () => {
      return await page.evaluate(() => {
        const price = document
          .querySelector(".price.price--withTax")
          .innerText.replace("€", "");
        return price;
      });
    };

    const getProductImages = async () => {
      await page.waitForSelector(".lazyautosizes.ls-is-cached");
      return await page.$$eval(".lazyautosizes.ls-is-cached", (imgs) =>
        imgs.map((img) => img.getAttribute("src"))
      );
    };

    const getProductAvailibity = async () => {
      if (avalitiby.includes("unavailable")) {
        return false;
      }
      return true;
    };

    product.id = sizeId;
    product.description = await getProductDescription();
    product.title = await getProductTitle();
    product.size = size;
    product.price = await getProductPrice();
    product.images = await getProductImages();
    product.avalitiby = await getProductAvailibity();

    products.push(product);
  }

  console.log(products, products.length);

  browser.close();
})();
