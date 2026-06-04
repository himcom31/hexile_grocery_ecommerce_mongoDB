const mongoose = require('mongoose');

/* ─────────────────────────────────────────────────────────────────────────────
   FirebaseConfig
   Stores the parsed service-account JSON fields so the Admin SDK can be
   initialised without touching the filesystem (stateless / container-safe).
   Only ONE document exists at a time (upsert pattern).
───────────────────────────────────────────────────────────────────────────── */
const FirebaseConfigSchema = new mongoose.Schema(
  {
    type:                        { type: String },
    project_id:                  { type: String, required: true },
    private_key_id:              { type: String, required: true },
    private_key:                 { type: String, required: true },   // PEM string
    client_email:                { type: String, required: true },
    client_id:                   { type: String },
    auth_uri:                    { type: String },
    token_uri:                   { type: String },
    auth_provider_x509_cert_url: { type: String },
    client_x509_cert_url:        { type: String },
    universe_domain:             { type: String },
    // Whether Admin SDK was successfully test-initialised with this config
    isConfigured:                { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────────────────────────────────────────
   FcmToken
   One document per registered device. Tokens are deactivated automatically
   when Firebase reports them as invalid/unregistered.
───────────────────────────────────────────────────────────────────────────── */
const FcmTokenSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token:    { type: String, required: true, unique: true },
    platform: { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date,    default: Date.now },
  },
  { timestamps: true }
);

// Fast lookup: all active tokens for a given user
FcmTokenSchema.index({ userId: 1, isActive: 1 });

const FirebaseConfig = mongoose.model('FirebaseConfig', FirebaseConfigSchema);
const FcmToken       = mongoose.model('FcmToken',       FcmTokenSchema);

module.exports = { FirebaseConfig, FcmToken };