const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getMyReviews,
  checkReviewEligibility,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .post(protect, authorize('buyer'), createReview);

router
  .route('/product/:productId')
  .get(getProductReviews);

router
  .route('/my-reviews')
  .get(protect, authorize('buyer'), getMyReviews);

router
  .route('/check-eligibility')
  .get(protect, authorize('buyer'), checkReviewEligibility);

router
  .route('/:id')
  .put(protect, authorize('buyer'), updateReview)
  .delete(protect, deleteReview);

module.exports = router;
