const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Create a product review
// @route   POST /api/reviews
// @access  Private (Buyer)
exports.createReview = async (req, res) => {
  try {
    const targetOrderId = req.body.orderId || req.body.order;
    const targetProductId = req.body.productId || req.body.product;
    const { rating, comment, images } = req.body;

    // 1. Validate required fields
    if (!targetOrderId || !targetProductId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Product ID are required.',
      });
    }

    const orderId = targetOrderId;
    const productId = targetProductId;

    const numRating = Number(rating);
    if (!numRating || isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    if (!trimmedComment || trimmedComment.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 3 characters long.',
      });
    }

    if (trimmedComment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Review comment cannot exceed 2000 characters.',
      });
    }

    // Validate images (max 5)
    let validatedImages = [];
    if (images && Array.isArray(images)) {
      if (images.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'You can upload a maximum of 5 images per review.',
        });
      }
      validatedImages = images
        .filter((img) => typeof img === 'string' && img.trim().length > 0)
        .slice(0, 5);
    }

    // 2. Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // 3. Validate order exists and belongs to logged-in user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review products from an order that does not belong to you.',
      });
    }

    // 4. CRITICAL: Order status MUST be 'Delivered' or 'Completed'
    const isDelivered =
      order.status === 'Delivered' ||
      order.status === 'Completed' ||
      (order.status && order.status.toLowerCase() === 'delivered');

    if (!isDelivered) {
      return res.status(400).json({
        success: false,
        message: `You can only review products from delivered orders. Current order status: "${order.status}".`,
      });
    }

    // 5. Verify product was actually purchased in this order
    const orderItem = order.orderItems.find((item) => {
      const pId = item.product?._id || item.product;
      return pId && pId.toString() === productId.toString();
    });

    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'This product was not part of the specified order.',
      });
    }

    // 6. Check for duplicate review for this order + product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: orderId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product from this order.',
      });
    }

    // 7. Create Review in DB
    const review = await Review.create({
      user: req.user._id,
      product: productId,
      order: orderId,
      name: req.user.name || 'Verified Buyer',
      rating: Math.round(numRating),
      comment: trimmedComment,
      images: validatedImages,
    });

    // 8. Dynamically recalculate product's averageRating & reviewCount
    await Review.calcAverageRating(productId);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting review',
    });
  }
};

// @desc    Get all reviews for a specific product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId || req.params.id;

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .populate('user', 'name');

    // Compute dynamic rating distribution & summary
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (distribution[rounded] !== undefined) {
        distribution[rounded]++;
      }
      totalScore += r.rating;
    });

    const count = reviews.length;
    const averageRating = count > 0 ? Number((totalScore / count).toFixed(1)) : 0;

    return res.json({
      success: true,
      count,
      averageRating,
      ratingDistribution: distribution,
      reviews,
    });
  } catch (error) {
    console.error('Error getting product reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching reviews',
    });
  }
};

// @desc    Get all reviews written by logged-in buyer
// @route   GET /api/reviews/my-reviews
// @access  Private (Buyer)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('product', 'name images price');

    return res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Error getting my reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching your reviews',
    });
  }
};

// @desc    Check if buyer is eligible to review a product for an order
// @route   GET /api/reviews/check-eligibility
// @access  Private (Buyer)
exports.checkReviewEligibility = async (req, res) => {
  try {
    const { orderId, productId } = req.query;

    if (!orderId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Product ID required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order || order.buyer.toString() !== req.user._id.toString()) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Order not found or does not belong to you',
      });
    }

    const isDelivered = order.status === 'Delivered' || order.status === 'Completed';
    if (!isDelivered) {
      return res.json({
        success: true,
        eligible: false,
        reason: `Order is not delivered (Status: ${order.status})`,
      });
    }

    const inOrder = order.orderItems.some((item) => {
      const pId = item.product?._id || item.product;
      return pId && pId.toString() === productId.toString();
    });

    if (!inOrder) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Product was not in this order',
      });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: orderId,
    });

    if (existingReview) {
      return res.json({
        success: true,
        eligible: false,
        alreadyReviewed: true,
        review: existingReview,
        reason: 'Product already reviewed for this order',
      });
    }

    return res.json({
      success: true,
      eligible: true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Review owner)
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only owner can edit
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review',
      });
    }

    const { rating, comment, images } = req.body;

    if (rating !== undefined) {
      const num = Number(rating);
      if (isNaN(num) || num < 1 || num > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }
      review.rating = Math.round(num);
    }

    if (comment !== undefined) {
      const trimmed = comment.trim();
      if (trimmed.length < 3) {
        return res.status(400).json({ success: false, message: 'Comment must be at least 3 characters' });
      }
      review.comment = trimmed;
    }

    if (images !== undefined && Array.isArray(images)) {
      review.images = images.slice(0, 5);
    }

    await review.save();

    // Recalculate rating
    await Review.calcAverageRating(review.product);

    return res.json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Review owner or Admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.roles && req.user.roles.admin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate rating
    await Review.calcAverageRating(productId);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
