const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments'],
      trim: true,
      minlength: [3, 'Comment must be at least 3 characters'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getters for prompt field compatibility (userId, productId, orderId)
ReviewSchema.virtual('userId').get(function () {
  return this.user;
});
ReviewSchema.virtual('productId').get(function () {
  return this.product;
});
ReviewSchema.virtual('orderId').get(function () {
  return this.order;
});

// Prevent duplicate review: one user can review a specific product for a specific order only once
ReviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
ReviewSchema.index({ product: 1, createdAt: -1 });

// Static method to recalculate product average rating, review count, and sync embedded reviews
ReviewSchema.statics.calcAverageRating = async function (productId) {
  const Product = mongoose.model('Product');
  
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  // Fetch recent reviews to keep embedded product.reviews in sync
  const recentReviews = await this.find({ product: productId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  if (stats.length > 0) {
    const avg = Number(stats[0].avgRating.toFixed(1));
    const count = stats[0].reviewCount;

    await Product.findByIdAndUpdate(productId, {
      rating: avg,
      totalReviews: count,
      reviews: recentReviews.map((r) => ({
        _id: r._id,
        user: r.user,
        name: r.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    });

    return { avgRating: avg, reviewCount: count };
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      totalReviews: 0,
      reviews: [],
    });
    return { avgRating: 0, reviewCount: 0 };
  }
};

module.exports = mongoose.model('Review', ReviewSchema);
