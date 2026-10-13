const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
      },
    ],
    shippingAddress: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery',
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Failed', 'Refund Pending', 'Refunded'],
      default: 'Pending',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paidAmount: {
      type: Number,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'Placed',
        'Accepted',
        'Processing',
        'Dispatched',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Completed',
        'Cancelled',
      ],
      default: 'Placed',
    },
    // Cancellation tracking
    cancellationReason: {
      type: String,
      default: null,
    },
    cancellationNote: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
    // Gift specific fields
    isGift: {
      type: Boolean,
      default: false,
    },
    giftDetails: {
      recipientName: { type: String, default: '' },
      recipientPhone: { type: String, default: '' },
      message: { type: String, default: '' },
    },
    trackingUpdates: [
      {
        status: { type: String, required: true },
        comment: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deliveredAt: {
      type: Date,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    // Commission & SHG Benefit Tracking (Snapshot at order creation)
    isSHGOrder: {
      type: Boolean,
      default: false,
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    sellerEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
