// routes/invoiceRoute.js  (or paste this handler into your existing orders router)
//
// GET /api/orders/:id/invoice
//   – Admin only  → streams PDF directly (no download prompt)
//   – or use ?download=1 to force "Save As" dialog
//
// Attach to your Express app:
//   const invoiceRoute = require("./routes/invoiceRoute");
//   app.use("/api/orders", invoiceRoute);

const express              = require("express");
const router               = express.Router();
const Order                = require("../models/Order");       // adjust path
const { generateInvoicePDF } = require("../Invoice/Generateinvoicepdf"); // adjust path
const { protect ,protectUser } = require('../middleware/authMiddleware'); // Aapka middleware
// ── Config – set these to match YOUR project ──────────────────────────────────
const LOGO_PATH = "src/assets/logo.jpg"; // relative to project root (where node runs)
const SHOP_NAME = "Ready Grocery";
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:id/invoice", protect, async (req, res) => {
  try {
    // 1. Fetch order with populated relations
    const order = await Order.findById(req.params.id)
      .populate("user",          "fullName email phone")
      .populate("assignedDriver", "fullName phone vehicleType")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // 2. (Optional) guard: only allow the customer who owns it OR an admin
    // const isOwner = order.user?._id?.toString() === req.user._id?.toString();
    // const isAdmin = req.user.role === "admin";
    // if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Forbidden." });

    // 3. Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(order, {
      logoPath: LOGO_PATH,
      shopName: SHOP_NAME,
    });

    // 4. Stream to client
    const filename   = `Invoice-${order.orderNumber || order._id}.pdf`;
    const forceDownload = req.query.download === "1";

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Length",      pdfBuffer.length);
    res.setHeader("Content-Disposition",
      forceDownload
        ? `attachment; filename="${filename}"`  // triggers Save-As dialog
        : `inline; filename="${filename}"`       // opens in browser/PDF viewer
    );

    return res.end(pdfBuffer);

  } catch (err) {
    console.error("Invoice generation error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate invoice." });
  }
});


router.get("/:id/invoice", protectUser, async (req, res) => {
  try {
    // 1. Fetch order with populated relations
    const order = await Order.findById(req.params.id)
      .populate("user",          "fullName email phone")
      .populate("assignedDriver", "fullName phone vehicleType")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // 2. (Optional) guard: only allow the customer who owns it OR an admin
    // const isOwner = order.user?._id?.toString() === req.user._id?.toString();
    // const isAdmin = req.user.role === "admin";
    // if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Forbidden." });

    // 3. Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(order, {
      logoPath: LOGO_PATH,
      shopName: SHOP_NAME,
    });

    // 4. Stream to client
    const filename   = `Invoice-${order.orderNumber || order._id}.pdf`;
    const forceDownload = req.query.download === "1";

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Length",      pdfBuffer.length);
    res.setHeader("Content-Disposition",
      forceDownload
        ? `attachment; filename="${filename}"`  // triggers Save-As dialog
        : `inline; filename="${filename}"`       // opens in browser/PDF viewer
    );

    return res.end(pdfBuffer);

  } catch (err) {
    console.error("Invoice generation error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate invoice." });
  }
});


module.exports = router;

