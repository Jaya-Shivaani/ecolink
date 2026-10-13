const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  getPublicSellerProfile,
  getPublicSellers,
  toggleWishlist,
  applyForSeller,
  googleAuth,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/apply-seller', protect, applyForSeller);
router.get('/sellers', getPublicSellers);
router.get('/seller/:id', getPublicSellerProfile);
router.post('/wishlist/:productId', protect, toggleWishlist);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
