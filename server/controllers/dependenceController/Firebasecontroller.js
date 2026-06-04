const multer             = require('multer');
const { FirebaseConfig, FcmToken } = require('../../models/dependence/Firebasemodel');
const initFirebaseAdmin  = require('../../utils/Firebaseutil');

/* ─────────────────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────────────────── */

const REQUIRED_SA_FIELDS = ['project_id', 'private_key_id', 'private_key', 'client_email'];

/**
 * After a multicast send, mark tokens that Firebase flagged as invalid so
 * we never attempt to send to them again.
 */
const pruneInvalidTokens = async (tokens, responses) => {
  const INVALID_CODES = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
  ]);

  const dead = responses
    .map((r, i) => (!r.success && INVALID_CODES.has(r.error?.code) ? tokens[i] : null))
    .filter(Boolean);

  if (dead.length > 0) {
    await FcmToken.updateMany({ token: { $in: dead } }, { isActive: false });
  }

  return dead.length;
};

/**
 * Send a multicast message in chunks of ≤ 500 (Firebase hard limit).
 * Returns { successCount, failureCount, pruned }.
 */
const sendMulticast = async (messaging, tokens, notification, data, imageUrl) => {
  const CHUNK = 500;
  let successCount = 0, failureCount = 0, pruned = 0;

  const payload = {
    notification: { title: notification.title, body: notification.body,
                    ...(imageUrl ? { imageUrl } : {}) },
    data: Object.fromEntries(
      Object.entries(data || {}).map(([k, v]) => [k, String(v)])
    ),
    android: { priority: 'high' },
    apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    webpush: { notification: { icon: '/favicon.ico', badge: '/favicon.ico' } },
  };

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const chunk    = tokens.slice(i, i + CHUNK);
    const response = await messaging.sendEachForMulticast({ ...payload, tokens: chunk });

    successCount += response.successCount;
    failureCount += response.failureCount;
    pruned       += await pruneInvalidTokens(chunk, response.responses);
  }

  return { successCount, failureCount, pruned };
};

/* ─────────────────────────────────────────────────────────────────────────────
   multer — memory storage, JSON files only, 1 MB limit
   Export so the router can apply it per-route without a separate file.
───────────────────────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/json' || file.originalname.endsWith('.json');
    ok ? cb(null, true) : cb(new Error('Only .json files are accepted.'));
  },
});

exports.upload = upload; // consumed by firebaseRoutes.js

/* ─────────────────────────────────────────────────────────────────────────────
   1. GET STATUS
   Returns configuration status and non-sensitive metadata.
───────────────────────────────────────────────────────────────────────────── */
exports.getFirebaseStatus = async (req, res) => {
  try {
    const config = await FirebaseConfig.findOne().select(
      'project_id client_email isConfigured createdAt updatedAt'
    );
    res.status(200).json({
      success:      true,
      isConfigured: config?.isConfigured ?? false,
      data:         config ?? null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   2. UPLOAD / REPLACE SERVICE-ACCOUNT JSON
   Accepts either:
     a) multipart file upload  (field name: "serviceAccount")
     b) raw JSON string in     req.body.jsonContent
   Validates fields → persists to DB → test-inits Admin SDK to verify creds.
───────────────────────────────────────────────────────────────────────────── */

exports.uploadFirebaseConfig = async (req, res) => {
  try {
    let parsed;

    if (req.file) {
      try { parsed = JSON.parse(req.file.buffer.toString('utf-8')); }
      catch { return res.status(400).json({ success: false, error: 'Uploaded file is not valid JSON.' }); }
    } else if (req.body.jsonContent) {
      try { parsed = JSON.parse(req.body.jsonContent); }
      catch { return res.status(400).json({ success: false, error: 'jsonContent is not valid JSON.' }); }
    } else {
      return res.status(400).json({
        success: false,
        error: 'No JSON provided. Send a multipart file (field: serviceAccount) or jsonContent string.',
      });
    }

    const missing = REQUIRED_SA_FIELDS.filter((f) => !parsed[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid service-account JSON — missing required fields: ${missing.join(', ')}.`,
      });
    }

    // ── Verify credentials BEFORE saving to DB ──────────────────────────────
    // Pass parsed JSON directly so initFirebaseAdmin doesn't query the DB
    try {
      await initFirebaseAdmin({
        type:                        parsed.type,
        project_id:                  parsed.project_id,
        private_key_id:              parsed.private_key_id,
        private_key:                 parsed.private_key,   // newlines handled inside util
        client_email:                parsed.client_email,
        client_id:                   parsed.client_id,
        auth_uri:                    parsed.auth_uri,
        token_uri:                   parsed.token_uri,
        auth_provider_x509_cert_url: parsed.auth_provider_x509_cert_url,
        client_x509_cert_url:        parsed.client_x509_cert_url,
        universe_domain:             parsed.universe_domain,
      });
    } catch (sdkErr) {
      return res.status(422).json({
        success: false,
        error: `Admin SDK initialisation failed: ${sdkErr.message}`,
      });
    }

    // ── SDK verified → now persist with isConfigured: true ──────────────────
    const config = await FirebaseConfig.findOneAndUpdate(
      {},
      {
        type:                        parsed.type,
        project_id:                  parsed.project_id,
        private_key_id:              parsed.private_key_id,
        private_key:                 parsed.private_key,
        client_email:                parsed.client_email,
        client_id:                   parsed.client_id,
        auth_uri:                    parsed.auth_uri,
        token_uri:                   parsed.token_uri,
        auth_provider_x509_cert_url: parsed.auth_provider_x509_cert_url,
        client_x509_cert_url:        parsed.client_x509_cert_url,
        universe_domain:             parsed.universe_domain,
        isConfigured:                true,                 // ✅ set only after SDK passes
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Firebase configuration uploaded and verified.',
      data: {
        project_id:   config.project_id,
        client_email: config.client_email,
        isConfigured: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadFirebaseConfig1= async (req, res) => {
  try {
    let parsed;

    if (req.file) {
      try { parsed = JSON.parse(req.file.buffer.toString('utf-8')); }
      catch { return res.status(400).json({ success: false, error: 'Uploaded file is not valid JSON.' }); }
    } else if (req.body.jsonContent) {
      try { parsed = JSON.parse(req.body.jsonContent); }
      catch { return res.status(400).json({ success: false, error: 'jsonContent is not valid JSON.' }); }
    } else {
      return res.status(400).json({
        success: false,
        error:   'No JSON provided. Send a multipart file (field: serviceAccount) or jsonContent string.',
      });
    }

    const missing = REQUIRED_SA_FIELDS.filter((f) => !parsed[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error:   `Invalid service-account JSON — missing required fields: ${missing.join(', ')}.`,
      });
    }

    // Persist (upsert — only one config document)
    const config = await FirebaseConfig.findOneAndUpdate(
      {},
      {
        type:                        parsed.type,
        project_id:                  parsed.project_id,
        private_key_id:              parsed.private_key_id,
        private_key:                 parsed.private_key,
        client_email:                parsed.client_email,
        client_id:                   parsed.client_id,
        auth_uri:                    parsed.auth_uri,
        token_uri:                   parsed.token_uri,
        auth_provider_x509_cert_url: parsed.auth_provider_x509_cert_url,
        client_x509_cert_url:        parsed.client_x509_cert_url,
        universe_domain:             parsed.universe_domain,
        isConfigured:                false,
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Verify credentials by test-initialising the SDK
    try {
      await initFirebaseAdmin();
      config.isConfigured = true;
      await config.save();
    } catch (sdkErr) {
      return res.status(422).json({
        success: false,
        error:   `Credentials saved but Admin SDK initialisation failed: ${sdkErr.message}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Firebase configuration uploaded and verified.',
      data: {
        project_id:   config.project_id,
        client_email: config.client_email,
        isConfigured: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   3. REGISTER / REFRESH FCM TOKEN
   Called from the client after the user grants browser notification permission.
───────────────────────────────────────────────────────────────────────────── */
exports.registerFcmToken = async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'token is required.' });

    await FcmToken.findOneAndUpdate(
      { token },
      { userId: req.user._id, token, platform, isActive: true, lastUsed: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'FCM token registered successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   4. SEND PUSH NOTIFICATION
   Targets one of:
     • tokens  — explicit FCM token array
     • userId  — all active devices for a user
     • topic   — Firebase topic broadcast
───────────────────────────────────────────────────────────────────────────── */
exports.sendPushNotification = async (req, res) => {
  try {
    const { title, body, data, tokens, topic, userId, imageUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'title and body are required.' });
    }

    const messaging = await initFirebaseAdmin();

    // ── Topic send ────────────────────────────────────────────────────────────
    if (topic) {
      const messageId = await messaging.send({
        topic,
        notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
        data: Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)])),
        android: { priority: 'high' },
        apns:    { payload: { aps: { sound: 'default' } } },
      });
      return res.status(200).json({ success: true, messageId });
    }

    // ── Resolve token list ────────────────────────────────────────────────────
    let targetTokens = [];

    if (tokens?.length > 0) {
      targetTokens = tokens;
    } else if (userId) {
      const docs = await FcmToken.find({ userId, isActive: true }).select('token');
      targetTokens = docs.map((d) => d.token);
      if (targetTokens.length === 0) {
        return res.status(404).json({ success: false, error: 'No active FCM tokens found for this user.' });
      }
    } else {
      return res.status(400).json({
        success: false,
        error:   'Provide tokens (array), userId, or topic.',
      });
    }

    const result = await sendMulticast(messaging, targetTokens, { title, body }, data, imageUrl);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   5. BROADCAST — send to ALL registered active devices
───────────────────────────────────────────────────────────────────────────── */
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, body, data, imageUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'title and body are required.' });
    }

    const allDocs = await FcmToken.find({ isActive: true }).select('token');
    if (allDocs.length === 0) {
      return res.status(404).json({ success: false, error: 'No active device tokens found.' });
    }

    const messaging = await initFirebaseAdmin();
    const allTokens = allDocs.map((d) => d.token);
    const result    = await sendMulticast(messaging, allTokens, { title, body }, data, imageUrl);

    res.status(200).json({ success: true, totalDevices: allTokens.length, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};