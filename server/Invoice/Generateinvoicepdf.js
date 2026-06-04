// utils/generateInvoicePDF.js
// Uses Puppeteer to render the HTML invoice template to a PDF buffer.
// Returns a Buffer – callers can stream it directly or save to disk/Cloudinary.

const puppeteer              = require("puppeteer");
const { generateInvoiceHTML } = require("./invoiceTemplate");

/**
 * @param {Object} order      Populated Mongoose order document
 * @param {Object} opts
 * @param {string} opts.logoPath   Path to logo, e.g. "src/assets/logo.png"
 * @param {string} opts.shopName   e.g. "Ready Grocery"
 * @returns {Promise<Buffer>}  PDF as a Buffer
 */
async function generateInvoicePDF(order, opts = {}) {
  const html = generateInvoiceHTML(order, opts);

  const browser = await puppeteer.launch({
    headless: "new",          // use new headless mode
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // avoids crashes on low-memory servers
    ],
  });

  try {
    const page = await browser.newPage();

    // Load HTML directly – base64 images in the template mean no HTTP needed
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,   // needed for the blue table header
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generateInvoicePDF };