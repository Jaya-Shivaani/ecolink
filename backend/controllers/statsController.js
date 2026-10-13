const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PlantListing = require('../models/PlantListing');

// @desc    Get public platform sustainability stats (100% dynamic from DB)
// @route   GET /api/stats
// @access  Public
exports.getPublicStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isApproved: true });
    const totalSellers = await User.countDocuments({ 'roles.seller': true });
    const womenEntrepreneursSupported = await User.countDocuments({
      'roles.seller': true,
      'sellerProfile.isWomenEntrepreneur': true,
    });
    const shgsActive = await User.countDocuments({
      'roles.seller': true,
      'sellerProfile.isSHG': true,
    });

    // Compute plants sold from delivered orders (sum of item.qty)
    const deliveredOrders = await Order.find({ status: 'Delivered' });
    let plantsSold = 0;
    deliveredOrders.forEach((o) => {
      o.orderItems.forEach((item) => {
        plantsSold += item.qty;
      });
    });

    // Compute plants adopted & exchanged from PlantListing model
    const plantsAdopted = await PlantListing.countDocuments({ type: 'Adoption' });
    const plantsExchanged = await PlantListing.countDocuments({ type: 'Exchange' });

    res.json({
      success: true,
      stats: {
        totalSellers,
        totalProducts,
        plantsSold,
        plantsAdopted,
        plantsExchanged,
        womenEntrepreneursSupported,
        shgsActive,
        ordersCompleted: deliveredOrders.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
