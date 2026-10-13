const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a chat message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'Receiver and message content are required' });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
    });

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat message history with a user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessageHistory = async (req, res) => {
  try {
    const chatPartnerId = req.params.userId;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: chatPartnerId },
        { sender: chatPartnerId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of unique users the current user has chatted with (Inbox list)
// @route   GET /api/messages/inbox/list
// @access  Private
exports.getInboxConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    }).sort({ createdAt: -1 });

    // Extract unique partner IDs
    const partnerIds = new Set();
    messages.forEach((msg) => {
      if (msg.sender.toString() !== currentUserId.toString()) {
        partnerIds.add(msg.sender.toString());
      }
      if (msg.receiver.toString() !== currentUserId.toString()) {
        partnerIds.add(msg.receiver.toString());
      }
    });

    const partners = await User.find({ _id: { $in: Array.from(partnerIds) } })
      .select('name email role sellerProfile');

    res.json({ success: true, conversations: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
