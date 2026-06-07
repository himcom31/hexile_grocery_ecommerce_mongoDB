const express = require('express');
const router = express.Router();
const  { upload } = require('../config/cloudinary'); 
const { addBanner, getBanners, deleteBanner } = require('../controllers/Apperance/bannerController');
const { protect, isAdmin } = require('../middleware/authMiddleware');


// Routes
router.post('/add', protect, isAdmin, upload.single('bannerImage'), addBanner);
router.get('/list',protect,isAdmin, getBanners);
router.delete('/:id', protect, isAdmin, deleteBanner);

module.exports = router;
