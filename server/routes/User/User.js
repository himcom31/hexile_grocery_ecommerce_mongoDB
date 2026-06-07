const express = require('express');
const router  = express.Router();
const { upload, uploadAvatar: avatarUpload } = require('../../config/cloudinary');
const {
  register, login, getMe,
  updateProfile, changePassword, uploadAvatar,
} = require('../../controllers/User/UserController');
const { protectUser } = require('../../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',    login);

router.get('/me',              protectUser, getMe);
router.put('/update-profile',  protectUser, updateProfile);          // JSON only, no multer
router.post('/upload-avatar',  protectUser, avatarUpload.single('avatar'), uploadAvatar); // file upload
router.put('/change-password', protectUser, changePassword);

module.exports = router;
