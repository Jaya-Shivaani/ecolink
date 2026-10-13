const RequestBoard = require('../models/RequestBoard');

// @desc    Post a bulk requirement
// @route   POST /api/business/requests
// @access  Private (Buyer)
exports.postRequest = async (req, res) => {
  try {
    let { title, description, category, quantityRequired, targetPrice, deadline } = req.body;
    title = title ? title.trim() : '';
    description = description ? description.trim() : '';
    category = category ? category.trim() : '';

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required' });
    }

    const numQty = Number(quantityRequired);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity required must be greater than 0' });
    }

    const request = new RequestBoard({
      user: req.user._id,
      title,
      description,
      category,
      quantityRequired: numQty,
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      deadline,
      status: 'Open',
    });

    const createdRequest = await request.save();
    res.status(201).json({ success: true, request: createdRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all bulk requests
// @route   GET /api/business/requests
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    const requests = await RequestBoard.find()
      .populate('user', 'name email address')
      .populate('quotations.seller', 'name email sellerProfile')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit a quotation for a request
// @route   POST /api/business/requests/:id/quotes
// @access  Private (Seller only)
exports.submitQuote = async (req, res) => {
  try {
    let { priceQuoted, deliveryDays, notes } = req.body;
    const numPrice = Number(priceQuoted);
    const numDays = Number(deliveryDays);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Quoted price must be greater than 0' });
    }

    if (isNaN(numDays) || numDays <= 0) {
      return res.status(400).json({ success: false, message: 'Delivery days must be greater than 0' });
    }

    const request = await RequestBoard.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Request is closed for quotes' });
    }

    // Check if seller already quoted
    const alreadyQuoted = request.quotations.find(
      (q) => q.seller.toString() === req.user._id.toString()
    );

    if (alreadyQuoted) {
      return res.status(400).json({ success: false, message: 'You have already submitted a quotation' });
    }

    const quotation = {
      seller: req.user._id,
      priceQuoted: numPrice,
      deliveryDays: numDays,
      notes: notes ? notes.trim() : '',
      status: 'Pending',
    };

    request.quotations.push(quotation);
    await request.save();

    res.status(201).json({ success: true, message: 'Quotation submitted successfully', request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept or Reject a quotation
// @route   PUT /api/business/requests/:id/quotes/:quoteId
// @access  Private (Buyer who posted the request)
exports.updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    const request = await RequestBoard.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to manage this request' });
    }

    const quotation = request.quotations.id(req.params.quoteId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quotation.status = status;

    if (status === 'Accepted') {
      // Reject all other quotations, and close the request
      request.status = 'Closed';
      request.quotations.forEach((q) => {
        if (q._id.toString() !== req.params.quoteId.toString()) {
          q.status = 'Rejected';
        }
      });
    }

    await request.save();
    res.json({ success: true, message: `Quotation ${status.toLowerCase()} successfully`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
