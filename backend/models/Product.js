const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a product price'],
      min: 0,
    },
    images: {
      type: [String],
      default: ['/assets/products/pinkrose.png'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock details'],
      min: 0,
      default: 10,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Plant Care Info (optional for non-plant categories)
    plantInfo: {
      waterRequirement: { type: String, enum: ['Low', 'Medium', 'High', ''], default: '' },
      sunlightRequirement: { type: String, enum: ['Full Sun', 'Partial Shade', 'Full Shade', ''], default: '' },
      difficultyLevel: { type: String, enum: ['Easy', 'Medium', 'Hard', ''], default: '' },
      indoorOutdoor: { type: String, enum: ['Indoor', 'Outdoor', 'Both', ''], default: '' },
      petFriendly: { type: Boolean, default: false },
      maintenanceLevel: { type: String, enum: ['Low', 'Medium', 'High', ''], default: '' },
      growthRate: { type: String, enum: ['Slow', 'Moderate', 'Fast', ''], default: '' },
    },
    // Badges
    isEcoFriendly: {
      type: Boolean,
      default: false,
    },
    // Yield & Profit Type
    yieldType: {
      type: String,
      enum: ['Long-Term Yield', 'Short-Term Yield', 'Decorative / Ornamental', 'Medicinal', 'None', ''],
      default: '',
    },
    // Product Source & Genuineness
    sourceVerification: {
      sourceType: {
        type: String,
        enum: ['Own Farm', 'SHG Production', 'Purchased from Farmer', 'Authorized Supplier', 'Other', ''],
        default: '',
      },
      sourceName: { type: String, default: '' },
      sourceLocation: { type: String, default: '' },
      description: { type: String, default: '' },
      declarationAccepted: { type: Boolean, default: false },
      isSourceVerified: { type: Boolean, default: false },
      verificationStatus: {
        type: String,
        enum: ['None', 'Pending', 'Verified', 'Rejected'],
        default: 'None',
      },
      adminNotes: { type: String, default: '' },
    },
    reviews: [ReviewSchema],
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Method to recalculate average rating
ProductSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.totalReviews = 0;
  } else {
    const total = this.reviews.reduce((acc, item) => acc + item.rating, 0);
    this.rating = (total / this.reviews.length).toFixed(1);
    this.totalReviews = this.reviews.length;
  }
  return this.save();
};

module.exports = mongoose.model('Product', ProductSchema);
