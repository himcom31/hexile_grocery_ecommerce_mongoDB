const express   = require("express");
const router    = express.Router();
const Wishlist  = require("../../models/User/Wishlist");
const { protectUser } = require("../../middleware/authMiddleware");

// GET /api/wishlist — get user's wishlist
router.get("/", protectUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate("products");
    res.json(wishlist || { products: [] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/wishlist/add — add product
router.post("/add", protectUser, async (req, res) => {
  const { productId } = req.body;
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }
    await wishlist.populate("products");
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/wishlist/remove/:productId — remove product
router.delete("/remove/:productId", protectUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });
    wishlist.products = wishlist.products.filter(
      p => p.toString() !== req.params.productId
    );
    await wishlist.save();
    await wishlist.populate("products");
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;