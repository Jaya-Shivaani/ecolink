const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforecolinkmarketplace2026');

      // Get user from the token
      const userId = decoded.id || decoded._id;
      req.user = await User.findById(userId).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Your login session has expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, please log in to proceed' });
  }
};

// Grant access to specific roles (checks user.roles object)
const authorize = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const hasRole = requiredRoles.some((role) => {
      if (role === 'buyer') {
        return !req.user.roles || req.user.roles.buyer !== false;
      }
      if (role === 'seller') {
        return !!(req.user.roles && req.user.roles.seller && req.user.sellerStatus === 'approved');
      }
      if (role === 'admin') {
        return !!(req.user.roles && req.user.roles.admin);
      }
      return req.user.roles && req.user.roles[role];
    });
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route. Requires approved role.',
      });
    }
    next();
  };
};

// Optional protect - attaches user if token present, but does not block unauthenticated users
const optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforecolinkmarketplace2026');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, authorize, optionalProtect };
