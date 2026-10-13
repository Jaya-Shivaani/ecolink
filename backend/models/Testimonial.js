const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'Community Member',
    },
    testimonialType: {
      type: String,
      enum: [
        'Customer Experience',
        'Farmer Experience',
        'SHG Member Experience',
        'Workshop Participant Experience',
      ],
      default: 'Customer Experience',
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please provide testimonial feedback'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', TestimonialSchema);
