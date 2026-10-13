const mongoose = require('mongoose');

const PlantListingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Adoption', 'Exchange'],
    },
    name: {
      type: String,
      required: [true, 'Please specify the plant name'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description of the plant'],
    },
    image: {
      type: String,
      default: '/assets/products/product-placeholder.svg',
    },
    condition: {
      type: String,
      enum: ['Healthy', 'Good', 'Needs Care'],
      default: 'Healthy',
    },
    exchangeFor: {
      type: String, // E.g., "Looking for money plants or pots"
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [77.8700, 9.1700],
      },
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Completed', 'Expired'],
      default: 'Available',
    },
    validityDays: {
      type: Number,
      default: 30,
    },
    validUntil: {
      type: Date,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    deliveryOption: {
      type: String,
      enum: ['Pickup Only', 'Delivery Available', 'Pickup & Delivery'],
      default: 'Pickup Only',
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

PlantListingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PlantListing', PlantListingSchema);
