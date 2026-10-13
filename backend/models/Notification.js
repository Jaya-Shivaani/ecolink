const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['adoption_request', 'exchange_request', 'adoption_completed', 'order_update', 'general'],
      default: 'adoption_request',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    plantListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlantListing',
    },
    link: {
      type: String,
      default: '/adoption',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      senderName: String,
      senderPhone: String,
      senderEmail: String,
      plantName: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
