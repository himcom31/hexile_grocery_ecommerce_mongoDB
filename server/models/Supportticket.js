// models/supportTicket.model.js
const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema(
  {
    sender:     { type: String, enum: ["user", "admin"], required: true },
    message:    { type: String, required: true },
    senderName: { type: String },
    avatar:     { type: String },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber:     { type: String, unique: true },
    user:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order:            { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    orderNumber:      { type: String },
    issueType:        { type: mongoose.Schema.Types.ObjectId, ref: "TicketIssueType" },
    issueTypeName:    { type: String },
    subject:          { type: String, required: true },
    email:            { type: String },
    phone:            { type: String },
    attachment:       { type: String },           // file URL
    status:           { type: String, enum: ["Pending", "Confirm", "Completed"], default: "Pending" },
    scheduledAt:      { type: Date },
    customerCanReply: { type: Boolean, default: false },
    messages:         [messageSchema],
  },
  { timestamps: true }
);

// Auto-generate ticket number before save
supportTicketSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
  }
  next();
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
