const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessageHistory,
  getInboxConversations,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/inbox/list', getInboxConversations);
router.get('/:userId', getMessageHistory);

module.exports = router;
