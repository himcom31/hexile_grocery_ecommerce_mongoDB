/**
 * notificationController.js
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Firebase Admin SDK is initialised dynamically from the service-account
 *    credentials stored in MongoDB (via initFirebaseAdmin from Firebaseutil.js).
 *    There is NO static firebase config file — credentials come from the DB.
 *
 * 2. FCM tokens are stored in the FcmToken collection (one per device).
 *    Each token is linked to a userId and a platform (web/android/ios).
 *
 * 3. sendToAll  → sends via Firebase topic "all_users" (fastest, no token loop)
 *    sendToUsers → resolves FCM tokens for selected userIds, uses multicast
 *
 * 4. Every send is persisted in the Notification collection for history.
 *
 * 5. Image is uploaded to Cloudinary via multer middleware before this
 *    controller runs; req.file.path holds the CDN URL.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const initFirebaseAdmin      = require('../utils/Firebaseutil');
const Notification           = require('../models/Notification');
const { FcmToken }           = require('../models/dependence/Firebasemodel');
const User                   = require('../models/User'); // adjust path to your User model

/* ─────────────────────────────────────────────────────────────────────────────
   INTERNAL: chunk multicast into ≤500-token batches (Firebase hard limit)
   and prune tokens Firebase reports as dead.
───────────────────────────────────────────────────────────────────────────── */
const INVALID_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const pruneDeadTokens = async (tokens, responses) => {
  const dead = responses
    .map((r, i) => (!r.success && INVALID_CODES.has(r.error?.code) ? tokens[i] : null))
    .filter(Boolean);

  if (dead.length > 0) {
    await FcmToken.updateMany({ token: { $in: dead } }, { isActive: false });
  }
  return dead.length;
};

const multicast = async (messaging, tokens, notification, imageUrl) => {
  const CHUNK = 500;
  let successCount = 0, failureCount = 0, pruned = 0;

  const base = {
    notification: {
      title: notification.title,
      body:  notification.body,
      ...(imageUrl ? { imageUrl } : {}),
    },
    android: { priority: 'high', notification: { imageUrl: imageUrl ?? undefined } },
    apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    webpush: { notification: { icon: '/favicon.ico' } },
  };

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const chunk    = tokens.slice(i, i + CHUNK);
    const response = await messaging.sendEachForMulticast({ ...base, tokens: chunk });

    successCount += response.successCount;
    failureCount += response.failureCount;
    pruned       += await pruneDeadTokens(chunk, response.responses);
  }

  return { successCount, failureCount, pruned };
};

/* ─────────────────────────────────────────────────────────────────────────────
   1. BROADCAST TO ALL  (topic: "all_users")
   POST /api/notifications/send-all
   Body: { title, body }  |  Optional: multipart image field "image"
───────────────────────────────────────────────────────────────────────────── */
exports.sendToAll = async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'title and body are required.' });
    }

    const imageUrl = req.file?.path ?? null;   // Cloudinary CDN URL from multer

    const messaging = await initFirebaseAdmin();

    await messaging.send({
      topic: 'all_users',
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      android: {
        priority: 'high',
        notification: { imageUrl: imageUrl ?? undefined },
      },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      webpush: { notification: { icon: '/favicon.ico' } },
    });

    // Persist to history
    await Notification.create({
      title,
      body,
      image:     imageUrl,
      sentTo:    'All',
      status:    'Sent',
      createdBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Notification broadcast to all users via topic.',
      imageUrl,
    });
  } catch (error) {
    console.error('[sendToAll]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   2. SEND TO SPECIFIC USERS
   POST /api/notifications/send-users
   Body: { title, body, userIds: ["id1","id2"] }  |  Optional: image
───────────────────────────────────────────────────────────────────────────── */
exports.sendToUsers = async (req, res) => {
  try {
    const { title, body, userIds } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'title and body are required.' });
    }
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required.' });
    }

    const imageUrl = req.file?.path ?? null;

    // Resolve active FCM tokens for the selected users
    const tokenDocs    = await FcmToken.find({ userId: { $in: userIds }, isActive: true }).select('token');
    const targetTokens = tokenDocs.map((d) => d.token);

    if (targetTokens.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'None of the selected users have active FCM tokens registered.',
      });
    }

    const messaging = await initFirebaseAdmin();
    const result    = await multicast(messaging, targetTokens, { title, body }, imageUrl);

    // Persist
    await Notification.create({
      title,
      body,
      image:     imageUrl,
      sentTo:    'Specific',
      userIds,
      status:    'Sent',
      createdBy: req.user._id,
      ...result,
    });

    res.status(200).json({
      success: true,
      message: `Notification sent to ${userIds.length} user(s).`,
      totalDevices: targetTokens.length,
      ...result,
    });
  } catch (error) {
    console.error('[sendToUsers]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   3. GET NOTIFICATION HISTORY
   GET /api/notifications/all?page=1&limit=10
───────────────────────────────────────────────────────────────────────────── */
exports.getAllNotifications = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const [notifications, total] = await Promise.all([
      Notification.find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      count:        notifications.length,
      total,
      totalPages:   Math.ceil(total / limit),
      currentPage:  page,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   4. GET USERS WITH TOKEN STATUS  (for the customer table in the UI)
   GET /api/notifications/users?platform=all&page=1&limit=50
   Returns users with a flag indicating whether they have an active FCM token.
───────────────────────────────────────────────────────────────────────────── */
exports.getUsersWithTokenStatus = async (req, res) => {
  try {
    const { platform = 'all' } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 50);

    // Build token query
    const tokenQuery = { isActive: true };
    if (platform && platform !== 'all') tokenQuery.platform = platform;

    // Get all active token userIds for quick lookup
    const activeTokenDocs = await FcmToken.find(tokenQuery).select('userId platform').lean();
    const tokenMap = {};   // userId → platform[]
    for (const doc of activeTokenDocs) {
      const id = doc.userId.toString();
      if (!tokenMap[id]) tokenMap[id] = [];
      tokenMap[id].push(doc.platform);
    }

    // If platform filter is set, restrict to users who have that token
    const userQuery = {};
    if (platform && platform !== 'all') {
      const eligibleIds = Object.keys(tokenMap);
      if (eligibleIds.length === 0) {
        return res.status(200).json({ success: true, users: [], total: 0, totalPages: 0, currentPage: page });
      }
      userQuery._id = { $in: eligibleIds };
    }

    const [users, total] = await Promise.all([
      User.find(userQuery)
        .select('name email phone image avatar profileImage')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(userQuery),
    ]);

    const enriched = users.map((u) => ({
      ...u,
      hasToken:  !!tokenMap[u._id.toString()],
      platforms: tokenMap[u._id.toString()] ?? [],
    }));

    res.status(200).json({
      success: true,
      users:      enriched,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};