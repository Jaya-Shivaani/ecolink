const Testimonial = require('../models/Testimonial');

// @desc    Get all approved testimonials for public display
// @route   GET /api/testimonials
// @access  Public
exports.getTestimonials = async (req, res) => {
  try {
    const { testimonialType, eventId } = req.query;
    const query = { status: 'Approved' };

    if (testimonialType) {
      query.testimonialType = testimonialType;
    }
    if (eventId) {
      query.event = eventId;
    }

    const testimonials = await Testimonial.find(query)
      .populate('user', 'name')
      .populate('event', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: testimonials.length,
      testimonials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create / Submit a testimonial or workshop feedback
// @route   POST /api/testimonials
// @access  Private (Authenticated users)
exports.createTestimonial = async (req, res) => {
  try {
    const { rating, comment, testimonialType, role, event } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide feedback/comment' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const testimonial = new Testimonial({
      user: req.user._id,
      name: req.user.name || 'Community Member',
      role: role ? role.trim() : (testimonialType === 'Workshop Participant Experience' ? 'Workshop Participant' : 'Community Member'),
      testimonialType: testimonialType || 'Customer Experience',
      event: event || null,
      rating: numRating,
      comment: comment.trim(),
      status: 'Pending', // Requires Admin approval
      isFeatured: false,
    });

    const saved = await testimonial.save();
    res.status(201).json({
      success: true,
      message: 'Testimonial submitted successfully. It will appear publicly after moderation.',
      testimonial: saved,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all testimonials for Admin moderation
// @route   GET /api/testimonials/admin
// @access  Private (Admin only)
exports.getAdminTestimonials = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.status = status;
    }

    const testimonials = await Testimonial.find(query)
      .populate('user', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 });

    const counts = {
      total: await Testimonial.countDocuments(),
      pending: await Testimonial.countDocuments({ status: 'Pending' }),
      approved: await Testimonial.countDocuments({ status: 'Approved' }),
      rejected: await Testimonial.countDocuments({ status: 'Rejected' }),
    };

    res.json({
      success: true,
      counts,
      testimonials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Moderate testimonial (Approve / Reject)
// @route   PUT /api/testimonials/:id/moderate
// @access  Private (Admin only)
exports.moderateTestimonial = async (req, res) => {
  try {
    const { status, isFeatured } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    testimonial.status = status;
    if (typeof isFeatured === 'boolean') {
      testimonial.isFeatured = isFeatured;
    }

    await testimonial.save();

    res.json({
      success: true,
      message: `Testimonial marked as ${status}`,
      testimonial,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
