const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priceQuoted: {
      type: Number,
      required: true,
    },
    deliveryDays: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const RequestBoardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a request title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a request description'],
    },
    category: {
      type: String,
      required: [true, 'Please specify the category of items required'],
    },
    quantityRequired: {
      type: Number,
      required: [true, 'Please specify the quantity required'],
      min: 1,
    },
    targetPrice: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Please set a deadline date'],
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
    quotations: [QuotationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('RequestBoard', RequestBoardSchema);
