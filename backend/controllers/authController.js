const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { sendPasswordResetOTPEmail } = require('../utils/sendEmail');

// Haversine Distance Formula (calculates distance in km between two coordinate points)
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

// Validation helpers
const validateUPI = (upiId) => {
  if (!upiId || typeof upiId !== 'string') return true;
  const trimmed = upiId.trim();
  if (trimmed === '') return true;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed);
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim());
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string' || phone.trim() === '') return true;
  return /^\+?[0-9]{10,15}$/.test(phone.trim().replace(/[\s\-()]/g, ''));
};

// Helper to determine primary role string
const getPrimaryRole = (roles) => {
  if (!roles) return 'buyer';
  if (roles.admin) return 'admin';
  if (roles.seller) return 'seller';
  return 'buyer';
};

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyforecolinkmarketplace2026', {
    expiresIn: '30d',
  });
};

// Helper to build user response payload
const userPayload = (user, token) => ({
  success: true,
  _id: user._id,
  name: user.name,
  email: user.email,
  roles: user.roles,
  role: getPrimaryRole(user.roles),
  sellerStatus: user.sellerStatus,
  phoneNumber: user.phoneNumber,
  address: user.address,
  location: user.location,
  sellerProfile: user.sellerProfile,
  sustainabilityScore: user.sustainabilityScore,
  token,
});

// @desc    Register user (always as buyer)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      phoneNumber,
      address,
      latitude,
      longitude,
    } = req.body;

    name = name ? name.trim() : '';
    email = email ? email.trim() : '';
    phoneNumber = phoneNumber ? phoneNumber.trim() : '';
    address = address ? address.trim() : '';

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (phoneNumber && !validatePhone(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Set coordinates
    const location = {
      type: 'Point',
      coordinates: [
        longitude ? parseFloat(longitude) : 77.8700,
        latitude ? parseFloat(latitude) : 9.1700,
      ],
    };

    const user = await User.create({
      name,
      email,
      password,
      roles: { buyer: true, seller: false, admin: false },
      sellerStatus: 'none',
      phoneNumber: phoneNumber || '',
      address: address || '',
      location,
    });

    if (user) {
      res.status(201).json(userPayload(user, generateToken(user._id)));
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email ? email.trim() : '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json(userPayload(user, generateToken(user._id)));
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        role: getPrimaryRole(user.roles),
        sellerStatus: user.sellerStatus,
        phoneNumber: user.phoneNumber,
        address: user.address,
        location: user.location,
        sellerProfile: user.sellerProfile,
        sustainabilityScore: user.sustainabilityScore,
        wishlist: user.wishlist,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name) user.name = req.body.name.trim();
      if (req.body.phoneNumber !== undefined) {
        const phone = req.body.phoneNumber.trim();
        if (phone && !validatePhone(phone)) {
          return res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
        }
        user.phoneNumber = phone;
      }
      if (req.body.address !== undefined) user.address = req.body.address.trim();

      if (req.body.latitude && req.body.longitude) {
        user.location = {
          type: 'Point',
          coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
        };
      }

      // Allow seller profile edits if user has seller role
      if (user.roles.seller && req.body.sellerProfile) {
        const sp = req.body.sellerProfile;
        if (sp.upiId !== undefined) {
          const upi = sp.upiId.trim();
          if (upi && !validateUPI(upi)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid UPI ID (example@bankhandle).' });
          }
          user.sellerProfile.upiId = upi;
        }
        if (sp.businessName) user.sellerProfile.businessName = sp.businessName.trim();
        if (sp.category) user.sellerProfile.category = sp.category.trim();
        if (sp.story) user.sellerProfile.story = sp.story.trim();
        if (sp.description) user.sellerProfile.description = sp.description.trim();
      }

      if (req.body.password) {
        if (req.body.password.length < 6) {
          return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json(userPayload(updatedUser, generateToken(updatedUser._id)));
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Apply to become a seller
// @route   POST /api/auth/apply-seller
// @access  Private
exports.applyForSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Already an approved seller
    if (user.roles.seller && user.sellerStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already an approved seller' });
    }

    // Already pending
    if (user.sellerStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Your seller application is already under review' });
    }

    let {
      businessName,
      businessType,
      sellerType,
      description,
      businessAddress,
      upiId,
      logo,
      license,
      enteredLatitude,
      enteredLongitude,
      detectedLatitude,
      detectedLongitude,
      productSource,
    } = req.body;

    businessName = businessName ? String(businessName).trim() : '';
    businessType = businessType ? String(businessType).trim() : '';
    sellerType = sellerType ? String(sellerType).trim() : '';
    description = description ? String(description).trim() : '';
    businessAddress = businessAddress ? String(businessAddress).trim() : '';
    upiId = upiId ? String(upiId).trim() : '';
    logo = logo ? String(logo).trim() : '';
    license = license ? String(license).trim() : '';

    if (!businessName) {
      return res.status(400).json({ success: false, message: 'Business name is required' });
    }

    // Default businessType or sellerType fallback
    if (!businessType && sellerType) businessType = sellerType;
    if (!businessType) businessType = 'Home Grower';
    if (!sellerType) sellerType = businessType;

    if (upiId && !validateUPI(upiId)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid UPI ID (example@bankhandle).' });
    }

    // Determine SHG and Women Entrepreneur flags from businessType or sellerType
    const isSHG = businessType === 'Self Help Group (SHG)' || sellerType === 'SHG Member';
    const isWomenEntrepreneur = businessType === 'Women Entrepreneur';

    // ── Location Verification Logic using Haversine Formula ──
    const existingEnteredLat = user.location?.coordinates?.[1] || 9.1700;
    const existingEnteredLng = user.location?.coordinates?.[0] || 77.8700;

    const entLat = enteredLatitude != null ? parseFloat(enteredLatitude) : existingEnteredLat;
    const entLng = enteredLongitude != null ? parseFloat(enteredLongitude) : existingEnteredLng;
    const detLat = detectedLatitude != null ? parseFloat(detectedLatitude) : null;
    const detLng = detectedLongitude != null ? parseFloat(detectedLongitude) : null;

    let locStatus = 'Pending';
    let distanceKm = 0;

    if (detLat != null && detLng != null && !isNaN(detLat) && !isNaN(detLng)) {
      distanceKm = calculateHaversineDistance(entLat, entLng, detLat, detLng);
      // Fetch allowed distance radius threshold from Setting (default 25 km)
      let radiusThreshold = 25;
      try {
        const radiusSetting = await Setting.findOne({ key: 'locationRadiusKm' });
        if (radiusSetting && radiusSetting.value) radiusThreshold = Number(radiusSetting.value);
      } catch (e) {
        radiusThreshold = 25;
      }

      if (distanceKm <= radiusThreshold) {
        locStatus = 'Verified';
      } else {
        locStatus = 'Mismatch'; // Marked for Admin Review
      }
    }

    const locationVerificationData = {
      status: locStatus,
      enteredCoordinates: [entLng, entLat],
      detectedCoordinates: detLat != null && detLng != null ? [detLng, detLat] : [],
      distanceKm: distanceKm || 0,
      verifiedAt: new Date(),
    };

    // Update primary user location if valid entered coordinates provided
    if (!isNaN(entLat) && !isNaN(entLng)) {
      user.location = {
        type: 'Point',
        coordinates: [entLng, entLat],
      };
    }

    // ── Product Source / Genuineness Declaration ──
    let productSourceData = {
      sourceType: '',
      sourceName: '',
      sourceLocation: '',
      description: '',
      declarationAccepted: false,
      verificationStatus: 'None',
      verifiedAt: null,
      adminNotes: '',
    };

    if (productSource && typeof productSource === 'object') {
      productSourceData = {
        sourceType: productSource.sourceType ? String(productSource.sourceType).trim() : 'Own Farm',
        sourceName: productSource.sourceName ? String(productSource.sourceName).trim() : '',
        sourceLocation: productSource.sourceLocation ? String(productSource.sourceLocation).trim() : '',
        description: productSource.description ? String(productSource.description).trim() : '',
        declarationAccepted: !!productSource.declarationAccepted,
        verificationStatus: productSource.declarationAccepted ? 'Pending' : 'None',
        verifiedAt: null,
        adminNotes: '',
      };
    }

    user.sellerProfile = {
      ...user.sellerProfile.toObject(),
      businessName,
      category: businessType,
      sellerType,
      description: description || '',
      story: description || '',
      businessAddress: businessAddress || user.address,
      upiId: upiId || '',
      logo: logo || '',
      license: license || '',
      isSHG,
      isWomenEntrepreneur,
      isVerified: false, // Strict: Never auto-verify!
      locationVerification: locationVerificationData,
      productSource: productSourceData,
    };
    user.sellerStatus = 'pending';

    await user.save();

    res.json({
      success: true,
      message: 'Seller application submitted successfully. Awaiting admin approval.',
      roles: user.roles,
      sellerStatus: user.sellerStatus,
      sellerProfile: user.sellerProfile,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        role: getPrimaryRole(user.roles),
        sellerStatus: user.sellerStatus,
        sellerProfile: user.sellerProfile,
        phoneNumber: user.phoneNumber,
        address: user.address,
        location: user.location,
        sustainabilityScore: user.sustainabilityScore,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Simulate forgot password & OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User with that email does not exist' });
    }

    // Generate random 6-digit OTP
    const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[MAIL SIMULATOR] Password Reset OTP for ${email}: ${mockOTP}`);

    // Send real OTP email using centralized sendEmail utility
    sendPasswordResetOTPEmail({
      email,
      name: user.name,
      otp: mockOTP,
    }).catch((mailErr) => {
      console.error('Failed to send OTP email:', mailErr.message);
    });

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your email inbox.',
      otp: mockOTP, // keeps auto-fill capability in frontend intact
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public seller profile by ID
// @route   GET /api/auth/seller/:id
// @access  Public
exports.getPublicSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller || !seller.roles.seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const Product = require('../models/Product');
    const products = await Product.find({ seller: seller._id });

    res.json({
      success: true,
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        phoneNumber: seller.phoneNumber,
        address: seller.address,
        location: seller.location,
        sellerProfile: seller.sellerProfile,
        sustainabilityScore: seller.sustainabilityScore,
      },
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle item in user wishlist (add if missing, remove if present)
// @route   POST /api/auth/wishlist/:productId
// @access  Private
exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const productId = req.params.productId;
    const index = user.wishlist.indexOf(productId);

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();

    const updatedUser = await User.findById(req.user._id).populate('wishlist');

    res.json({
      success: true,
      wishlist: updatedUser.wishlist,
      isWishlisted: index === -1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google Sign-In / Registration with Firebase ID Token
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    // Dynamically reload .env to fetch keys without requiring server restart
    require('dotenv').config({ override: true });

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID Token is required' });
    }

    // Verify Google Firebase ID Token using Google Identity Toolkit accounts:lookup API
    const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyBPRO6fn_SicvvTRJWx561Y_WPUnZlh41U';
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const result = await response.json();

    if (!response.ok || !result.users || result.users.length === 0) {
      console.error('Google ID token verification error:', result.error || 'No users returned');
      return res.status(401).json({ success: false, message: 'Invalid or expired Google authentication token' });
    }

    const verifiedUser = result.users[0];
    const email = verifiedUser.email.toLowerCase();
    const name = verifiedUser.displayName || email.split('@')[0];
    const uid = verifiedUser.localId;

    // Search for existing MongoDB user by verified Google email
    let user = await User.findOne({ email });

    if (user) {
      // DUPLICATE ACCOUNT PREVENTION:
      // Link firebaseUid if missing. PRESERVE ALL existing roles, sellerStatus, profile, etc.
      if (uid && (!user.firebaseUid || user.firebaseUid !== uid)) {
        user.firebaseUid = uid;
        await user.save();
      }
    } else {
      // Create new MongoDB user with default Buyer role
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');

      user = await User.create({
        name,
        email,
        password: randomPassword,
        roles: { buyer: true, seller: false, admin: false },
        sellerStatus: 'none',
        firebaseUid: uid,
      });
    }

    // Return existing EcoLink JWT token and user payload
    res.json(userPayload(user, generateToken(user._id)));
  } catch (error) {
    console.error('Google Auth Controller Error:', error);
    res.status(500).json({ success: false, message: 'Google sign-in processing failed' });
  }
};

// @desc    Get all public verified sellers/makers
// @route   GET /api/auth/sellers
// @access  Public
exports.getPublicSellers = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const sellers = await User.find({
      $or: [
        { 'roles.seller': true },
        { sellerStatus: 'approved' },
      ],
    }).select('-password -wishlist');

    const sellersWithCounts = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({ seller: seller._id, isApproved: true });
        const featuredProducts = await Product.find({ seller: seller._id, isApproved: true }).limit(3);
        return {
          _id: seller._id,
          name: seller.name,
          email: seller.email,
          phoneNumber: seller.phoneNumber,
          address: seller.address,
          location: seller.location,
          sellerProfile: seller.sellerProfile,
          sustainabilityScore: seller.sustainabilityScore,
          productCount,
          featuredProducts,
        };
      })
    );

    res.json({ success: true, count: sellersWithCounts.length, sellers: sellersWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

