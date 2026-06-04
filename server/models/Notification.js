/**
 * Notification.js — Mongoose model
 *
 * Stores every push notification ever sent, for the admin history view.
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    body: {
      type:     String,
      required: true,
      trim:     true,
    },
    image: {
      type:    String,   // Cloudinary CDN URL (optional)
      default: null,
    },
    sentTo: {
      type: String,
      enum: ['All', 'Specific'],
      default: 'All',
    },
    // Populated only when sentTo === 'Specific'
    userIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    status: {
      type:    String,
      enum:    ['Sent', 'Failed', 'Partial'],
      default: 'Sent',
    },
    // Multicast stats (populated for Specific sends)
    successCount: { type: Number, default: null },
    failureCount: { type: Number, default: null },
    pruned:       { type: Number, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Admin',
    },
  },
  { timestamps: true }
);

// Index for fast paginated history queries
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);