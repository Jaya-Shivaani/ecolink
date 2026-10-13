const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Cancel Order Endpoint (Buyer)
router.route('/:id/cancel')
  .patch(protect, authorize('buyer'), cancelOrder)
  .post(protect, authorize('buyer'), cancelOrder);

// Razorpay Test Mode Endpoints
router.route('/razorpay/key')
  .get(protect, authorize('buyer'), getRazorpayKey);

router.route('/razorpay/create-order')
  .post(protect, authorize('buyer'), createRazorpayOrder);

router.route('/razorpay/verify-payment')
  .post(protect, authorize('buyer'), verifyRazorpayPayment);

router.route('/')
  .post(protect, authorize('buyer'), createOrder);

router.route('/myorders')
  .get(protect, authorize('buyer'), getMyOrders);

router.route('/sellerorders')
  .get(protect, authorize('seller', 'admin'), getSellerOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/status')
  .put(protect, authorize('seller', 'admin'), updateOrderStatus);

module.exports = router;
