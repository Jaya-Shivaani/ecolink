const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getCategories,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/categories', getCategories);

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('seller', 'admin'), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

const { getProductReviews, createReview } = require('../controllers/reviewController');

router
  .route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, authorize('buyer'), (req, res, next) => {
    if (!req.body.productId) req.body.productId = req.params.id;
    createReview(req, res, next);
  });

module.exports = router;
