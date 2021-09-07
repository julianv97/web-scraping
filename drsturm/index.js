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

  //Consigo todas las variantes
  const sizesOptions = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll("label.form-option"));
    return list.map((li) => ({
      size: li.innerText.trim(),
      sizeId: li.getAttribute("data-product-attribute-value"),
    }));
  });

  //Recorro las variantes y por cada una debería clickear en la opcion y luego recuperar la data
  for (option of sizesOptions) {
    const { size, sizeId } = option;
    console.log(sizeId);
    await page.click(`label[data-product-attribute-value="${sizeId}"]`);
  }


  //Estas funciones se tienen que aplicar a cada variante option
  /* const getProductDescription = async () => {
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

  const description = await getProductDescription();
  const title = await getProductTitle(); */
  
  browser.close();
})();
