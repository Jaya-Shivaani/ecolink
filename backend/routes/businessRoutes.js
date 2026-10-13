const express = require('express');
const router = express.Router();
const {
  postRequest,
  getRequests,
  submitQuote,
  updateQuoteStatus,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/requests')
  .post(protect, authorize('buyer'), postRequest)
  .get(protect, getRequests);

router.route('/requests/:id/quotes')
  .post(protect, authorize('seller'), submitQuote);

router.route('/requests/:id/quotes/:quoteId')
  .put(protect, authorize('buyer'), updateQuoteStatus);

module.exports = router;
