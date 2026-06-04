// routes/receiptRoute.js
const express  = require("express");
const path     = require("path");
const router   = express.Router();

const Order               = require("../models/Order");
const { generateReceiptPDF } = require("../Paymentreceipt/Generatereceiptpdf");
const { protect, isAdmin ,protectUser}   = require("../middleware/authMiddleware");

// ── Adjust this path to match where your logo actually is ──────────────────
const LOGO_PATH  = "src/assets/logo.jpg"; // relative to project root (where node runs)
const SHOP_NAME  = "Ready Grocery";
// ──────────────────────────────────────────────────────────────────────────

/**
 * GET /api/orders/:id/receipt
 * Download a Payment Receipt PDF for an order.
 * Protected — Admin only.
 */
router.get("/:id/receipt", protect ,async (req, res) => {
  try {
    // Fetch order and populate user + delivery driver
    const order = await Order.findById(req.params.id)
      .populate({ path: "user",           select: "fullName email phone", strictPopulate: false })
      .populate({ path: "assignedDriver", select: "fullName phone vehicleType", strictPopulate: false })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`[Receipt] Generating receipt for order: ${order.orderNumber}`);

    const pdfBuffer = await generateReceiptPDF(order, LOGO_PATH);

    const filename = `Receipt-${order.orderNumber || order._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");

    // ?download=1  → triggers browser Save dialog
    // no param     → opens PDF inline in browser tab
    if (req.query.download === "1") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (err) {
    console.error("[Receipt] Generation error:", err);
    res.status(500).json({ message: "Receipt generation failed", error: err.message });
  }
});




router.get("/:id/receipt", protectUser,async (req, res) => {
  try {
    // Fetch order and populate user + delivery driver
    const order = await Order.findById(req.params.id)
      .populate({ path: "user",           select: "fullName email phone", strictPopulate: false })
      .populate({ path: "assignedDriver", select: "fullName phone vehicleType", strictPopulate: false })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`[Receipt] Generating receipt for order: ${order.orderNumber}`);

    const pdfBuffer = await generateReceiptPDF(order, LOGO_PATH);

    const filename = `Receipt-${order.orderNumber || order._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");

    // ?download=1  → triggers browser Save dialog
    // no param     → opens PDF inline in browser tab
    if (req.query.download === "1") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (err) {
    console.error("[Receipt] Generation error:", err);
    res.status(500).json({ message: "Receipt generation failed", error: err.message });
  }
});

module.exports = router;