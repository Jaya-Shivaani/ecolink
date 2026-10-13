const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All notification routes are private

router.route('/')
  .get(getUserNotifications);

router.route('/read-all')
  .put(markAllNotificationsRead);

router.route('/:id/read')
  .put(markNotificationRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
