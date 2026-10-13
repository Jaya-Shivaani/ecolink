const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  addComment,
  likePost,
  createPlantListing,
  getPlantListings,
  requestPlant,
  completePlantListing,
  extendPlantListingValidity,
  deletePlantListing,
  createEvent,
  getEvents,
  registerEvent,
  deleteEvent,
  cleanupExpiredEvents,
} = require('../controllers/communityController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

// Forum Posts routes
router.route('/posts')
  .post(protect, createPost)
  .get(optionalProtect, getPosts);

router.route('/posts/:id/comments')
  .post(protect, addComment);

router.route('/posts/:id/like')
  .put(protect, likePost);

// Plant exchange/adoption listings routes
router.route('/plants')
  .post(protect, createPlantListing)
  .get(optionalProtect, getPlantListings);

router.route('/plants/:id')
  .delete(protect, deletePlantListing);

router.route('/plants/:id/request')
  .put(protect, requestPlant);

router.route('/plants/:id/complete')
  .put(protect, completePlantListing);

router.route('/plants/:id/extend')
  .put(protect, extendPlantListingValidity);

// Events routes
router.route('/events')
  .post(protect, authorize('seller', 'admin'), createEvent)
  .get(optionalProtect, getEvents);

router.route('/events/expired/cleanup')
  .delete(protect, cleanupExpiredEvents);

router.route('/events/:id')
  .delete(protect, deleteEvent);

router.route('/events/:id/register')
  .put(protect, registerEvent);

module.exports = router;

