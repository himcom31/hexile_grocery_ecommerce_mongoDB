// controllers/supportTicket.controller.js
const SupportTicket = require('../models/Supportticket.js');

// ── User: Create ticket ──────────────────────────────────────────────────────
exports.createTicket = async (req, res) => {
  try {
    const { orderNumber, issueType, issueTypeName, subject, email, phone, message } = req.body;
    const attachment = req.file?.path || req.body.attachment || null;

    const ticket = await SupportTicket.create({
      user:          req.user._id,
      orderNumber,
      issueType,
      issueTypeName,
      subject,
      email,
      phone,
      attachment,
      messages: message
        ? [{ sender: "user", message, senderName: req.user.name || req.user.fullName }]
        : [],
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── User: Get my tickets ─────────────────────────────────────────────────────
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── User: Send message (if allowed) ─────────────────────────────────────────
exports.userSendMessage = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    if (!ticket.customerCanReply)
      return res.status(403).json({ success: false, message: "Messaging is disabled for this ticket" });

    ticket.messages.push({
      sender:     "user",
      message:    req.body.message,
      senderName: req.user.name || req.user.fullName,
    });
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Get all tickets ───────────────────────────────────────────────────
exports.adminGetAllTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "All" ? { status } : {};
    const tickets = await SupportTicket.find(filter)
      .populate("user", "name fullName email phone avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Get single ticket ─────────────────────────────────────────────────
exports.adminGetTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "name fullName email phone avatar");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Update status ─────────────────────────────────────────────────────
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name fullName email phone avatar");
    if (!ticket) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Set schedule ──────────────────────────────────────────────────────
exports.adminSetSchedule = async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { scheduledAt },
      { new: true }
    ).populate("user", "name fullName email phone avatar");
    if (!ticket) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Toggle customer messaging ────────────────────────────────────────
exports.adminToggleMessaging = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Not found" });
    ticket.customerCanReply = !ticket.customerCanReply;
    await ticket.save();
    res.json({ success: true, customerCanReply: ticket.customerCanReply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Send reply message ────────────────────────────────────────────────
exports.adminSendMessage = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Not found" });
    ticket.messages.push({
      sender:     "admin",
      message:    req.body.message,
      senderName: "Admin",
    });
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── User: Get my ticket counts ───────────────────────────────────────────────
exports.getMyTicketCounts = async (req, res) => {
  try {
    const userId = req.user._id;

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      SupportTicket.countDocuments({ user: userId }),
      SupportTicket.countDocuments({ user: userId, status: "Open" }),
      SupportTicket.countDocuments({ user: userId, status: "In Progress" }),
      SupportTicket.countDocuments({ user: userId, status: "Resolved" }),
      SupportTicket.countDocuments({ user: userId, status: "Closed" }),
    ]);

    res.json({ success: true, counts: { total, open, inProgress, resolved, closed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};