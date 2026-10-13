const express = require('express');
const router = express.Router();
const {
  getTestimonials,
  createTestimonial,
  getAdminTestimonials,
  moderateTestimonial,
} = require('../controllers/testimonialController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to view approved testimonials
router.get('/', getTestimonials);

// Authenticated route to submit feedback / testimonial
router.post('/', protect, createTestimonial);

// Admin moderation routes
router.get('/admin', protect, authorize('admin'), getAdminTestimonials);
router.put('/:id/moderate', protect, authorize('admin'), moderateTestimonial);

module.exports = router;
