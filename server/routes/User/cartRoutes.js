const express  = require("express");
const router   = express.Router();
const Cart     = require("../../models/User/Cart");
const { protectUser } = require("../../middleware/authMiddleware");

// GET /api/cart — get user's cart
router.get("/", protectUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product");
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart/add — add or increment item
router.post("/add", protectUser, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }
    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/cart/update/:productId — change quantity
router.put("/update/:productId", protectUser, async (req, res) => {
  const { quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const item = cart.items.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart/remove/:productId — remove one item
router.delete("/remove/:productId", protectUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart/clear — empty entire cart
router.delete("/clear", protectUser, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;