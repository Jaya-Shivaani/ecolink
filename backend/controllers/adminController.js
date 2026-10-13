const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const Testimonial = require('../models/Testimonial');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all sellers with details and product counts
// @route   GET /api/admin/sellers
// @access  Private (Admin only)
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      $or: [
        { 'roles.seller': true },
        { role: 'seller' },
        { sellerStatus: { $in: ['approved', 'pending', 'rejected'] } },
      ],
    }).select('-password').sort({ createdAt: -1 });

    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({ seller: seller._id });
        const sellerObj = seller.toObject();
        sellerObj.productCount = productCount;
        return sellerObj;
      })
    );

    res.json({ success: true, count: sellersWithStats.length, sellers: sellersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending seller applications
// @route   GET /api/admin/sellers/pending
// @access  Private (Admin only)
exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      sellerStatus: 'pending',
    }).select('-password');
    res.json({ success: true, count: sellers.length, sellers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve a seller application
// @route   PUT /api/admin/sellers/:id/verify
// @access  Private (Admin only)
exports.verifySeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (seller && seller.sellerStatus === 'pending') {
      seller.roles.seller = true;
      seller.sellerStatus = 'approved';
      seller.sellerProfile.isVerified = true;
      await seller.save();
      res.json({ success: true, message: 'Seller application approved', seller });
    } else {
      res.status(404).json({ success: false, message: 'Pending seller application not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a seller application
// @route   PUT /api/admin/sellers/:id/reject
// @access  Private (Admin only)
exports.rejectSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (seller && seller.sellerStatus === 'pending') {
      seller.sellerStatus = 'rejected';
      seller.sellerProfile.isVerified = false;
      await seller.save();
      res.json({ success: true, message: 'Seller application rejected', seller });
    } else {
      res.status(404).json({ success: false, message: 'Pending seller application not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update seller status / verification / badges (Admin only)
// @route   PUT /api/admin/sellers/:id/status
// @access  Private (Admin only)
exports.updateSellerStatus = async (req, res) => {
  try {
    const { status, isVerified, isSHG, isWomenEntrepreneur } = req.body;
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    if (status) {
      seller.sellerStatus = status;
      if (status === 'approved') {
        seller.roles.seller = true;
        if (seller.sellerProfile) seller.sellerProfile.isVerified = true;
      } else if (status === 'rejected') {
        seller.roles.seller = false;
        if (seller.sellerProfile) seller.sellerProfile.isVerified = false;
      }
    }

    if (seller.sellerProfile) {
      if (typeof isVerified === 'boolean') seller.sellerProfile.isVerified = isVerified;
      if (typeof isSHG === 'boolean') seller.sellerProfile.isSHG = isSHG;
      if (typeof isWomenEntrepreneur === 'boolean') seller.sellerProfile.isWomenEntrepreneur = isWomenEntrepreneur;
    }

    await seller.save();
    res.json({ success: true, message: 'Seller status updated successfully', seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products for moderation
// @route   GET /api/admin/products
// @access  Private (Admin only)
exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email sellerProfile')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product approval status
// @route   PUT /api/admin/products/:id/approve
// @access  Private (Admin only)
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.isApproved = !product.isApproved;
      await product.save();
      res.json({
        success: true,
        message: `Product approval set to ${product.isApproved}`,
        product,
      });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Platform-Wide Dashboard Analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ 'roles.seller': true });
    const totalBuyers = await User.countDocuments({ 'roles.buyer': true });

    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Compute platform revenue
    const paidOrders = await Order.find({ paymentStatus: 'Paid' });
    const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    // Compute aggregate sustainability metrics from all sellers
    const sellers = await User.find({ 'roles.seller': true });
    const sustainabilityStats = sellers.reduce(
      (acc, s) => {
        acc.plantsSold += s.sustainabilityScore?.plantsSold || 0;
        acc.plantsAdopted += s.sustainabilityScore?.plantsAdopted || 0;
        acc.plantsExchanged += s.sustainabilityScore?.plantsExchanged || 0;
        acc.womenEntrepreneursSupported += s.sellerProfile?.isWomenEntrepreneur ? 1 : 0;
        acc.shgsActive += (s.sellerProfile?.isSHG || s.sellerProfile?.category === 'Self Help Group (SHG)' || s.sellerProfile?.sellerType === 'SHG Member') ? 1 : 0;
        return acc;
      },
      { plantsSold: 0, plantsAdopted: 0, plantsExchanged: 0, womenEntrepreneursSupported: 0, shgsActive: 0 }
    );

    // ── SHG Metrics (Database-Driven) ──
    const shgSellersCount = await User.countDocuments({
      'roles.seller': true,
      $or: [
        { 'sellerProfile.isSHG': true },
        { 'sellerProfile.category': 'Self Help Group (SHG)' },
        { 'sellerProfile.sellerType': 'SHG Member' },
      ],
    });

    const shgDeliveredOrders = await Order.find({ isSHGOrder: true, status: 'Delivered' });
    const shgSales = Math.round(shgDeliveredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0) * 100) / 100;
    const shgCommission = Math.round(shgDeliveredOrders.reduce((acc, o) => acc + (o.commissionAmount || 0), 0) * 100) / 100;
    const shgSellerEarnings = Math.round(shgDeliveredOrders.reduce((acc, o) => acc + (o.sellerEarnings || 0), 0) * 100) / 100;

    // Fetch dynamic SHG commission rate from Setting
    let shgCommissionPercentage = 5;
    try {
      const commSetting = await Setting.findOne({ key: 'shgCommissionPercentage' });
      if (commSetting && commSetting.value != null) {
        shgCommissionPercentage = Number(commSetting.value);
      }
    } catch (e) {
      shgCommissionPercentage = 5;
    }

    // ── Seller Verification Stats ──
    const pendingSellersCount = await User.countDocuments({ sellerStatus: 'pending' });
    const approvedSellersCount = await User.countDocuments({ sellerStatus: 'approved' });
    const rejectedSellersCount = await User.countDocuments({ sellerStatus: 'rejected' });
    const locationMismatchCount = await User.countDocuments({
      'sellerProfile.locationVerification.status': 'Mismatch',
    });

    // ── Product Source Verification Stats ──
    const sourcePendingCount = await User.countDocuments({
      'sellerProfile.productSource.verificationStatus': 'Pending',
    });
    const sourceVerifiedCount = await User.countDocuments({
      'sellerProfile.productSource.verificationStatus': 'Verified',
    });
    const sourceRejectedCount = await User.countDocuments({
      'sellerProfile.productSource.verificationStatus': 'Rejected',
    });

    // ── Testimonials Stats ──
    const testPendingCount = await Testimonial.countDocuments({ status: 'Pending' });
    const testApprovedCount = await Testimonial.countDocuments({ status: 'Approved' });
    const testRejectedCount = await Testimonial.countDocuments({ status: 'Rejected' });

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalSellers,
        totalBuyers,
        totalProducts,
        totalOrders,
        totalRevenue,
        ...sustainabilityStats,
        // SHG Analytics
        shg: {
          shgSellersCount,
          shgSales,
          shgCommission,
          shgSellerEarnings,
          shgCommissionPercentage,
        },
        // Verification Analytics
        verification: {
          pending: pendingSellersCount,
          verified: approvedSellersCount,
          rejected: rejectedSellersCount,
          locationMismatch: locationMismatchCount,
        },
        // Product Source Analytics
        productSource: {
          pending: sourcePendingCount,
          verified: sourceVerifiedCount,
          rejected: sourceRejectedCount,
        },
        // Testimonial Analytics
        testimonials: {
          pending: testPendingCount,
          approved: testApprovedCount,
          rejected: testRejectedCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.roles.admin) return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a specific role on a user (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
exports.changeUserRole = async (req, res) => {
  try {
    const { role, value } = req.body;
    if (!['buyer', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.roles[role] = !!value;

    // If granting seller role, also update sellerStatus
    if (role === 'seller' && value) {
      user.sellerStatus = 'approved';
      user.sellerProfile.isVerified = true;
    } else if (role === 'seller' && !value) {
      user.sellerStatus = 'none';
      user.sellerProfile.isVerified = false;
    }

    await user.save();
    const updated = await User.findById(req.params.id).select('-password');
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (Admin only)
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
exports.adminDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Platform Dynamic Settings (Admin only)
// @route   GET /api/admin/settings
// @access  Private (Admin only)
exports.getPlatformSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const configMap = {
      shgCommissionPercentage: 5,
      locationRadiusKm: 25,
      estimatedDeliveryDays: 4,
    };
    settings.forEach((s) => {
      configMap[s.key] = s.value;
    });
    res.json({ success: true, settings: configMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Platform Dynamic Settings (Admin only)
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
exports.updatePlatformSettings = async (req, res) => {
  try {
    const { shgCommissionPercentage, locationRadiusKm, estimatedDeliveryDays } = req.body;

    if (shgCommissionPercentage !== undefined) {
      const numRate = Number(shgCommissionPercentage);
      if (isNaN(numRate) || numRate < 0 || numRate > 100) {
        return res.status(400).json({ success: false, message: 'SHG Commission must be a percentage between 0 and 100' });
      }
      await Setting.findOneAndUpdate(
        { key: 'shgCommissionPercentage' },
        { value: numRate, description: 'Default commission percentage for SHG sellers' },
        { upsert: true, new: true }
      );
    }

    if (locationRadiusKm !== undefined) {
      const numRadius = Number(locationRadiusKm);
      if (isNaN(numRadius) || numRadius <= 0) {
        return res.status(400).json({ success: false, message: 'Radius must be a positive number' });
      }
      await Setting.findOneAndUpdate(
        { key: 'locationRadiusKm' },
        { value: numRadius, description: 'Allowed geographic radius in km for location verification' },
        { upsert: true, new: true }
      );
    }

    if (estimatedDeliveryDays !== undefined) {
      const numDays = Number(estimatedDeliveryDays);
      if (isNaN(numDays) || numDays <= 0 || numDays > 30) {
        return res.status(400).json({ success: false, message: 'Estimated delivery days must be a positive number between 1 and 30' });
      }
      await Setting.findOneAndUpdate(
        { key: 'estimatedDeliveryDays' },
        { value: numDays, description: 'Default estimated delivery days for marketplace orders' },
        { upsert: true, new: true }
      );
    }

    const updatedSettings = await Setting.find();
    const configMap = {
      shgCommissionPercentage: 5,
      locationRadiusKm: 25,
      estimatedDeliveryDays: 4,
    };
    updatedSettings.forEach((s) => {
      configMap[s.key] = s.value;
    });

    res.json({ success: true, message: 'Platform settings updated successfully', settings: configMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin moderate seller product source declaration
// @route   PUT /api/admin/sellers/:id/verify-source
// @access  Private (Admin only)
exports.verifySellerSource = async (req, res) => {
  try {
    const { verificationStatus, adminNotes } = req.body;
    if (!['Verified', 'Rejected', 'Pending'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    if (!seller.sellerProfile.productSource) {
      seller.sellerProfile.productSource = {};
    }

    seller.sellerProfile.productSource.verificationStatus = verificationStatus;
    if (adminNotes) seller.sellerProfile.productSource.adminNotes = adminNotes.trim();
    if (verificationStatus === 'Verified') {
      seller.sellerProfile.productSource.verifiedAt = new Date();
    }

    await seller.save();
    res.json({ success: true, message: `Product source marked as ${verificationStatus}`, seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin override seller location verification
// @route   PUT /api/admin/sellers/:id/verify-location
// @access  Private (Admin only)
exports.verifySellerLocation = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Verified', 'Mismatch', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid location status' });
    }

    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    if (!seller.sellerProfile.locationVerification) {
      seller.sellerProfile.locationVerification = {};
    }

    seller.sellerProfile.locationVerification.status = status;
    seller.sellerProfile.locationVerification.verifiedAt = new Date();

    await seller.save();
    res.json({ success: true, message: `Location verification marked as ${status}`, seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

