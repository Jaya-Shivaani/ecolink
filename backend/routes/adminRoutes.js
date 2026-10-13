const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllSellers,
  getPendingSellers,
  verifySeller,
  rejectSeller,
  updateSellerStatus,
  getAdminProducts,
  approveProduct,
  getPlatformAnalytics,
  deleteUser,
  changeUserRole,
  adminDeleteProduct,
  getPlatformSettings,
  updatePlatformSettings,
  verifySellerSource,
  verifySellerLocation,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication AND admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

router.get('/sellers', getAllSellers);
router.get('/sellers/pending', getPendingSellers);
router.put('/sellers/:id/verify', verifySeller);
router.put('/sellers/:id/reject', rejectSeller);
router.put('/sellers/:id/status', updateSellerStatus);
router.put('/sellers/:id/verify-source', verifySellerSource);
router.put('/sellers/:id/verify-location', verifySellerLocation);

router.get('/products', getAdminProducts);
router.put('/products/:id/approve', approveProduct);
router.delete('/products/:id', adminDeleteProduct);

router.get('/analytics', getPlatformAnalytics);

router.route('/settings')
  .get(getPlatformSettings)
  .put(updatePlatformSettings);

module.exports = router;
