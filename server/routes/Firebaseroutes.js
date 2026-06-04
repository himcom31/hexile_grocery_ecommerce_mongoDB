const express = require('express');
const router  = express.Router();

const {
  upload,
  getFirebaseStatus,
  uploadFirebaseConfig,
  registerFcmToken,
  sendPushNotification,
  broadcastNotification,
} = require('../controllers/dependenceController/Firebasecontroller');

const { protect, isAdmin } = require('../middleware/authMiddleware');

/* ── Admin-only routes ────────────────────────────────────────────────────── */

// GET  /api/firebase/status         — config status (no secrets)
router.get('/status', protect, isAdmin, getFirebaseStatus);

// POST /api/firebase/upload-config  — upload service-account JSON
//   Accepts: multipart file (field: serviceAccount) OR body.jsonContent string
router.post(
  '/upload-config',
  protect,
  isAdmin,
  upload.single('serviceAccount'),
  uploadFirebaseConfig
);

// POST /api/firebase/send           — targeted notification (tokens / userId / topic)
router.post('/send', protect, isAdmin, sendPushNotification);

// POST /api/firebase/broadcast      — send to all active devices
router.post('/broadcast', protect, isAdmin, broadcastNotification);

/* ── Authenticated-user route ─────────────────────────────────────────────── */

// POST /api/firebase/register-token — register this device's FCM token
router.post('/register-token', protect, registerFcmToken);

module.exports = router;