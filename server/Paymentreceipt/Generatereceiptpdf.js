// utils/generateReceiptPDF.js
const puppeteer = require("puppeteer");
const { generatePaymentReceiptHTML } = require("./paymentReceiptTemplate");

/**
 * Generates a Payment Receipt PDF buffer for a given order.
 * @param {Object} order   - Populated Mongoose order document (.lean())
 * @param {string} logoPath - Relative path to logo file (e.g. "src/assets/logo.png")
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReceiptPDF(order, logoPath) {
  const html = generatePaymentReceiptHTML(order, logoPath);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    // Load HTML directly — no HTTP needed since images are base64 embedded
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generateReceiptPDF };