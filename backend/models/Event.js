const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add an event title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add an event description'],
    },
    date: {
      type: Date,
      required: [true, 'Please add the event date'],
    },
    time: {
      type: String,
      required: [true, 'Please add the event time'],
    },
    locationType: {
      type: String,
      enum: ['Online', 'In-Person'],
      default: 'In-Person',
    },
    address: {
      type: String, // Link if Online, physical address if In-Person
      required: true,
    },
    image: {
      type: String,
      default: '/assets/products/product-placeholder.svg',
    },
    price: {
      type: Number,
      default: 0, // 0 means Free
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
