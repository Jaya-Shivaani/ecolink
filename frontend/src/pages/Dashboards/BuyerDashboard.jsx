import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { ShoppingBag, Heart, User as UserIcon, Edit3, Truck, X, MapPin, Phone, Mail, CheckCircle2, ShieldCheck, Sparkles, Navigation, Calendar, Star, Ban, AlertTriangle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../../utils/productImages';
import { formatExpectedDate, getOrderExpectedDelivery, getOrderDeliveredDate } from '../../utils/dateUtils';
import ReviewModal from '../../components/ReviewModal';
import CancelOrderModal from '../../components/CancelOrderModal';

const BuyerDashboard = ({ addToCart }) => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  // Tab State: 'orders' | 'wishlist' | 'profile' | 'edit-profile'
  const [activeTab, setActiveTab] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Order for Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Review Modal State
  const [reviewModalState, setReviewModalState] = useState({
    isOpen: false,
    product: null,
    orderId: null,
    existingReview: null,
  });

  // Cancel Order Modal State
  const [cancelModalState, setCancelModalState] = useState({
    isOpen: false,
    order: null,
  });

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    latitude: user?.location?.coordinates?.[1] || 9.1700,
    longitude: user?.location?.coordinates?.[0] || 77.8700,
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Carbon metrics calculation
  const [sustainability, setSustainability] = useState({
    plantsBought: 0,
    swapsCompleted: user?.sustainabilityScore?.plantsExchanged || 0,
    adoptionsCompleted: user?.sustainabilityScore?.plantsAdopted || 0,
    carbonOffset: 0,
  });

  // Handle URL hash changes (e.g. #profile, #orders, #settings)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'profile') setActiveTab('profile');
    else if (hash === 'orders') setActiveTab('orders');
    else if (hash === 'wishlist') setActiveTab('wishlist');
    else if (hash === 'settings' || hash === 'edit-profile') setActiveTab('edit-profile');
  }, [location.hash]);

  const loadMyReviews = async () => {
    try {
      const { data } = await axios.get('/api/reviews/my-reviews');
      if (data.success) {
        setMyReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching my reviews:', err);
    }
  };

  const getExistingReview = (orderId, productId) => {
    if (!myReviews || myReviews.length === 0 || !orderId || !productId) return null;
    return myReviews.find((r) => {
      const rOrderId = r.order?._id || r.order;
      const rProdId = r.product?._id || r.product;
      return (
        rOrderId?.toString() === orderId?.toString() &&
        rProdId?.toString() === productId?.toString()
      );
    });
  };

  const openReviewModal = (product, orderId, existingReview = null) => {
    setReviewModalState({
      isOpen: true,
      product,
      orderId,
      existingReview,
    });
  };

  const handleReviewSubmitted = () => {
    loadMyReviews();
  };

  // Cancel Order helpers
  const CANCELLABLE_STATUSES = ['Placed', 'Accepted', 'Processing'];

  const openCancelModal = (order) => {
    setCancelModalState({ isOpen: true, order });
  };

  const handleOrderCancelled = (cancelledOrder) => {
    // Update the order in the local state so the UI reflects immediately
    setOrders((prev) =>
      prev.map((o) => (o._id === cancelledOrder._id ? cancelledOrder : o))
    );
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, profileRes, reviewsRes] = await Promise.allSettled([
        axios.get('/api/orders/myorders'),
        axios.get('/api/auth/profile'),
        axios.get('/api/reviews/my-reviews'),
      ]);

      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data.success) {
        setMyReviews(reviewsRes.value.data.reviews || []);
      }

      let plantsCount = 0;
      let loadedOrders = [];

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
        loadedOrders = ordersRes.value.data.orders || [];
        setOrders(loadedOrders);

        loadedOrders.forEach((ord) => {
          if (ord.status === 'Delivered' && Array.isArray(ord.orderItems)) {
            ord.orderItems.forEach((item) => {
              const itemName = (item?.name || '').toLowerCase();
              if (itemName.includes('plant') || itemName.includes('seed')) {
                plantsCount += item.qty || 1;
              }
            });
          }
        });
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
        const profileUser = profileRes.value.data;
        setWishlist(profileUser.wishlist || []);

        setProfileForm({
          name: profileUser.name || '',
          phoneNumber: profileUser.phoneNumber || '',
          address: profileUser.address || '',
          latitude: profileUser.location?.coordinates?.[1] || 9.1700,
          longitude: profileUser.location?.coordinates?.[0] || 77.8700,
        });

        setSustainability({
          plantsBought: plantsCount,
          swapsCompleted: profileUser.sustainabilityScore?.plantsExchanged || 0,
          adoptionsCompleted: profileUser.sustainabilityScore?.plantsAdopted || 0,
          carbonOffset: (plantsCount * 12) + ((profileUser.sustainabilityScore?.plantsAdopted || 0) * 12),
        });
      }
    } catch (err) {
      console.error('Error loading buyer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Remove from Wishlist
  const handleRemoveWishlist = async (productId) => {
    try {
      const { data } = await axios.post(`/api/auth/wishlist/${productId}`);
      if (data.success) {
        setWishlist(data.wishlist);
      }
    } catch (err) {
      console.error('Error removing wishlist item:', err);
    }
  };

  // Detect Geolocation for Edit Profile
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfileForm((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          alert('Location coordinates updated!');
        },
        (err) => {
          console.error(err);
          alert('Could not detect location automatically.');
        }
      );
    }
  };

  // Update Profile Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');

    try {
      const { data } = await axios.put('/api/auth/profile', profileForm);
      if (data.success) {
        setProfileMsg('Profile updated successfully!');
        if (setUser) {
          setUser(data);
        }
      }
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-primary-950">Buyer Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back, {user?.name}. Manage your purchases, wishlist, and profile.</p>
        </div>
      </div>

      {/* Carbon Impact Banner */}
      <div className="bg-gradient-to-tr from-emerald-950 to-primary-900 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="space-y-2">
            <span className="bg-emerald-500/20 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xxs font-semibold uppercase tracking-wider">
              Sustainability Footprint
            </span>
            <h2 className="font-display font-extrabold text-2xl">Your EcoImpact</h2>
            <p className="text-xs text-slate-300">Every local transaction reduces shipping transport emissions.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center space-y-1">
            <span className="text-3xl font-extrabold text-emerald-400">{sustainability.carbonOffset} kg</span>
            <span className="block text-[10px] uppercase text-slate-300 tracking-wider font-semibold">CO2 Offset Saved</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center space-y-1">
            <span className="text-3xl font-extrabold text-emerald-400">{sustainability.plantsBought}</span>
            <span className="block text-[10px] uppercase text-slate-300 tracking-wider font-semibold">Plants Planted</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center space-y-1">
            <span className="text-3xl font-extrabold text-emerald-400">{sustainability.adoptionsCompleted + sustainability.swapsCompleted}</span>
            <span className="block text-[10px] uppercase text-slate-300 tracking-wider font-semibold">Community Swaps</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-organic-200 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'wishlist'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span>Plant Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('edit-profile')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'edit-profile'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading purchase history...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center space-y-3">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
              <span className="block text-slate-700 font-bold text-base">No Orders Placed Yet</span>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Explore our hyperlocal marketplace for indoor plants, organic fertilizers, and eco-crafts.</p>
              <Link to="/marketplace" className="inline-block bg-primary-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => {
                const isCancelled = order.status === 'Cancelled';
                const isCancellable = CANCELLABLE_STATUSES.includes(order.status);
                return (
                <div key={order._id} className={`rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow border ${isCancelled ? 'bg-red-50/30 border-red-200' : 'bg-white border-organic-200'}`}>
                  <div className="flex justify-between items-start border-b border-organic-100 pb-3">
                    <div>
                      <span className="block font-bold text-slate-900 text-sm">Order #{order._id.substring(18)}</span>
                      <span className="block text-xs text-slate-400">Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="block font-extrabold text-slate-900 text-base">₹{order.totalPrice}</span>
                      <div className="flex items-center justify-end space-x-1">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'Refund Pending' ? 'bg-purple-100 text-purple-800'
                            : order.paymentStatus === 'Refunded' ? 'bg-blue-100 text-blue-800'
                            : order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCancelled ? 'bg-red-100 text-red-800' : 'bg-primary-100 text-primary-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cancelled Order Banner */}
                  {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5 text-xs space-y-1.5">
                      <div className="flex items-center space-x-2 text-red-800">
                        <Ban className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-[11px] font-bold">Order Cancelled</span>
                        {order.cancelledAt && (
                          <span className="text-[10px] text-red-500 font-medium">on {new Date(order.cancelledAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {order.cancellationReason && (
                        <div className="text-[11px] text-red-700 pl-6">
                          <span className="font-semibold">Reason:</span> {order.cancellationReason}
                        </div>
                      )}
                      {order.paymentStatus === 'Refund Pending' && (
                        <div className="text-[10px] text-purple-700 font-semibold pl-6 mt-0.5">
                          💰 Refund is being processed
                        </div>
                      )}
                      {order.paymentStatus === 'Refunded' && (
                        <div className="text-[10px] text-emerald-700 font-semibold pl-6 mt-0.5">
                          ✅ Refund completed
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Estimate Banner - hidden for cancelled orders */}
                  {!isCancelled && (
                    <div className="bg-emerald-50/60 border border-emerald-100/90 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-medium">
                          {order.status === 'Delivered' ? (
                            <>Delivered {getOrderDeliveredDate(order) ? `on ${getOrderDeliveredDate(order)}` : 'Successfully'}</>
                          ) : (
                            <>Expected Delivery: <strong className="text-slate-900 font-bold">{getOrderExpectedDelivery(order)}</strong></>
                          )}
                        </span>
                      </div>
                      {order.status === 'Delivered' ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          Delivered ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700">
                          Standard Courier
                        </span>
                      )}
                    </div>
                  )}

                  {/* Order items preview */}
                  <div className="space-y-2.5">
                    {order.orderItems.map((item, idx) => {
                      const prodId = item.product?._id || item.product;
                      const existingRev = getExistingReview(order._id, prodId);
                      const isDelivered = order.status === 'Delivered' || order.status === 'Completed';

                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-organic-50/60 hover:bg-organic-50 border border-organic-100/70 transition-colors text-xs text-slate-700">
                          <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-organic-200" />
                            )}
                            <div className="flex-grow truncate">
                              <span className="font-semibold block truncate">{item.name}</span>
                              <span className="text-slate-400">Qty: {item.qty} × ₹{item.price}</span>
                            </div>
                          </div>

                          {/* Review Actions: Only enable when order is Delivered */}
                          {isDelivered && (
                            <div className="flex-shrink-0 flex items-center space-x-1.5 ml-2">
                              {existingRev ? (
                                <div className="flex items-center space-x-1.5">
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xxs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Reviewed ✓</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openReviewModal(item, order._id, existingRev)}
                                    className="text-xxs text-primary-700 hover:text-primary-900 font-bold hover:underline px-1 py-0.5"
                                    title="Edit review"
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openReviewModal(item, order._id, null)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xxs font-extrabold bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-all hover:scale-102"
                                >
                                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                  <span>Rate & Review</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 bg-organic-50 border border-organic-200 text-primary-800 font-bold text-xs py-2.5 rounded-xl hover:bg-primary-50 hover:border-primary-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Truck className="h-4 w-4" />
                      <span>View Details</span>
                    </button>

                    {/* Cancel Order Button - only for eligible statuses */}
                    {isCancellable && (
                      <button
                        onClick={() => openCancelModal(order)}
                        className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          {wishlist.length === 0 ? (
            <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center space-y-3">
              <Heart className="h-10 w-10 text-red-300 fill-red-100 mx-auto" />
              <span className="block text-slate-700 font-bold text-base">Your Wishlist is Empty</span>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Click the heart icon on any product in the marketplace to save it here for later.</p>
              <Link to="/marketplace" className="inline-block bg-primary-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((p) => (
                <div key={p._id} className="bg-white border border-organic-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="relative">
                    <img
                      src={getProductImage(p)}
                      onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }}
                      alt={p.name}
                      className="w-full h-44 object-cover"
                    />
                    <button
                      onClick={() => handleRemoveWishlist(p._id)}
                      className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove from wishlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-xxs text-slate-400 uppercase font-bold tracking-wider">{p.category}</span>
                      <h4 className="font-display font-bold text-slate-900 text-sm truncate">{p.name}</h4>
                      <span className="font-extrabold text-primary-900 text-base">₹{p.price}</span>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-organic-100">
                      <Link
                        to={`/products/${p._id}`}
                        className="flex-1 text-center bg-organic-50 text-slate-700 font-semibold text-xs py-2 rounded-xl border border-organic-200 hover:bg-organic-100 transition-colors"
                      >
                        View Details
                      </Link>
                      {addToCart && (
                        <button
                          onClick={() => {
                            addToCart(p, 1);
                            alert(`${p.name} added to cart!`);
                          }}
                          className="flex-1 bg-primary-600 text-white font-semibold text-xs py-2 rounded-xl hover:bg-primary-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE DETAILS */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white border border-organic-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h2 className="font-display font-bold text-xl text-slate-900 border-b border-organic-100 pb-4">Buyer Account Info</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Full Name</span>
                <span className="font-bold text-slate-900">{user?.name}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Email Address</span>
                <span className="font-bold text-slate-900">{user?.email}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Phone Number</span>
                <span className="font-bold text-slate-900">{user?.phoneNumber || 'Not provided'}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Account Role</span>
                <span className="font-bold text-emerald-700 capitalize">{user?.role}</span>
              </div>
            </div>

            <div className="border-t border-organic-100 pt-4">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Delivery Address</span>
              <p className="text-slate-700 text-sm leading-relaxed">{user?.address || 'No address saved.'}</p>
            </div>

            {user?.location?.coordinates && (
              <div className="bg-organic-50 p-4 border border-organic-150 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Hyperlocal Coordinates</span>
                <span className="text-slate-500 font-mono">Latitude: {user.location.coordinates[1]}, Longitude: {user.location.coordinates[0]}</span>
              </div>
            )}

            <button
              onClick={() => setActiveTab('edit-profile')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md"
            >
              Edit Profile Information
            </button>
          </div>

          <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Account Privileges</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Hyperlocal 5-15km Search</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Zero-Plastic Packing Guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Community Plant Swaps & Adoption</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EDIT PROFILE */}
      {activeTab === 'edit-profile' && (
        <div className="max-w-2xl bg-white border border-organic-200 rounded-3xl p-8 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-xl text-slate-900 border-b border-organic-100 pb-4">Edit Profile Settings</h2>

          {profileMsg && (
            <div className={`p-4 rounded-xl text-xs font-semibold ${profileMsg.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label htmlFor="buyer-name" className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Full Name</label>
              <input
                id="buyer-name"
                name="name"
                type="text"
                required
                className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="buyer-phone" className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Phone Number</label>
              <input
                id="buyer-phone"
                name="phoneNumber"
                type="text"
                placeholder="+91 98765 43210"
                className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="buyer-address" className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Delivery Address</label>
              <textarea
                id="buyer-address"
                name="address"
                rows="3"
                placeholder="Street name, landmark, city, postal code..."
                className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="buyer-latitude" className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Latitude</label>
                <input
                  id="buyer-latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                  value={profileForm.latitude}
                  onChange={(e) => setProfileForm({ ...profileForm, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor="buyer-longitude" className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Longitude</label>
                <input
                  id="buyer-longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                  value={profileForm.longitude}
                  onChange={(e) => setProfileForm({ ...profileForm, longitude: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={detectLocation}
              className="text-xs text-primary-700 font-bold hover:underline flex items-center space-x-1"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Detect Current GPS Location</span>
            </button>

            <div className="pt-4 border-t border-organic-100">
              <button
                type="submit"
                disabled={profileLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {profileLoading ? 'Saving Changes...' : 'Save Profile Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-organic-200 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-organic-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-organic-100 pb-4">
              <span className="text-xxs text-primary-700 uppercase font-bold tracking-widest block mb-1">Order Details</span>
              <h2 className="font-display font-extrabold text-2xl text-slate-900">
                Order #{selectedOrder._id.substring(18)}
              </h2>
              <span className="text-xs text-slate-400">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-organic-50 p-4 border border-organic-150 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Status</span>
                <span className={`font-extrabold ${selectedOrder.status === 'Cancelled' ? 'text-red-700' : 'text-emerald-700'}`}>{selectedOrder.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Payment</span>
                <span className={`font-bold inline-block px-1.5 py-0.5 rounded text-[11px] ${
                  selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800'
                    : selectedOrder.paymentStatus === 'Refund Pending' ? 'bg-purple-100 text-purple-800'
                    : selectedOrder.paymentStatus === 'Refunded' ? 'bg-blue-100 text-blue-800'
                    : selectedOrder.paymentStatus === 'Failed' ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedOrder.paymentStatus || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Method</span>
                <span className="font-bold text-slate-800 truncate block">{selectedOrder.paymentMethod || 'COD'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Total Price</span>
                <span className="font-extrabold text-slate-900 text-sm">₹{selectedOrder.totalPrice}</span>
              </div>
            </div>

            {selectedOrder.razorpayPaymentId && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold">Razorpay Transaction ID</span>
                <span className="font-mono font-bold text-emerald-950">{selectedOrder.razorpayPaymentId}</span>
              </div>
            )}

            {/* Cancellation Info Section - Only for cancelled orders */}
            {selectedOrder.status === 'Cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Ban className="h-5 w-5 text-red-500" />
                  <span className="font-bold text-red-800 text-sm">Order Cancelled</span>
                  {selectedOrder.cancelledAt && (
                    <span className="text-xs text-red-500">on {new Date(selectedOrder.cancelledAt).toLocaleString()}</span>
                  )}
                </div>
                {selectedOrder.cancellationReason && (
                  <div className="text-xs text-red-700">
                    <span className="font-bold">Reason:</span> {selectedOrder.cancellationReason}
                  </div>
                )}
                {selectedOrder.cancellationNote && (
                  <div className="text-xs text-red-600">
                    <span className="font-bold">Note:</span> {selectedOrder.cancellationNote}
                  </div>
                )}
                {selectedOrder.paymentStatus === 'Refund Pending' && (
                  <div className="text-xs text-purple-700 font-semibold pt-1 border-t border-red-200">
                    💰 Your refund is being processed. You will be notified once it's completed.
                  </div>
                )}
                {selectedOrder.paymentStatus === 'Refunded' && (
                  <div className="text-xs text-emerald-700 font-semibold pt-1 border-t border-red-200">
                    ✅ Your refund has been successfully processed.
                  </div>
                )}
              </div>
            )}

            {/* Expected Delivery Date Section - Hidden for cancelled orders */}
            {selectedOrder.status !== 'Cancelled' && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xxs uppercase font-extrabold text-emerald-800 tracking-wider block">
                    {selectedOrder.status === 'Delivered' ? 'Delivery Timeline' : 'Expected Delivery'}
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-display font-extrabold text-slate-900 text-base">
                      {getOrderExpectedDelivery(selectedOrder)}
                    </span>
                    {selectedOrder.status !== 'Delivered' && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        (Estimated)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.status === 'Delivered' ? (
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    <span>
                      Delivered {getOrderDeliveredDate(selectedOrder) ? `on ${getOrderDeliveredDate(selectedOrder)}` : 'Successfully'}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
                    <Truck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    <span>On Schedule</span>
                  </span>
                </div>
              )}
            </div>
            )}

            {/* Address */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Shipping Address</h4>
              <p className="text-xs text-slate-600 bg-organic-50 p-3 rounded-xl border border-organic-100 leading-relaxed">
                {selectedOrder.shippingAddress}
              </p>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Item Breakdown</h4>
              <div className="space-y-3">
                {selectedOrder.orderItems.map((item, idx) => {
                  const prodId = item.product?._id || item.product;
                  const existingRev = getExistingReview(selectedOrder._id, prodId);
                  const isDelivered = selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed';

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-organic-50/50 rounded-2xl border border-organic-100 text-xs gap-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <img src={getProductImage(item)} onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }} alt={item.name} className="w-12 h-12 object-cover rounded-xl border border-organic-200 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                          <span className="text-slate-500">₹{item.price} × {item.qty}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                        <span className="font-extrabold text-slate-900 text-sm">₹{item.price * item.qty}</span>
                        {isDelivered && (
                          <div>
                            {existingRev ? (
                              <div className="flex items-center space-x-1.5">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xxs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Reviewed ✓</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openReviewModal(item, selectedOrder._id, existingRev)}
                                  className="text-xxs text-primary-700 hover:text-primary-900 font-bold hover:underline px-1 py-0.5"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReviewModal(item, selectedOrder._id, null)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xxs font-extrabold bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-all hover:scale-102"
                              >
                                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                <span>Rate & Review</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking updates */}
            {selectedOrder.trackingUpdates && selectedOrder.trackingUpdates.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3">Tracking Log</h4>
                <div className="bg-organic-50 p-4 rounded-2xl border border-organic-150 relative pl-6 space-y-4 text-xs">
                  <div className="absolute left-3 top-5 bottom-5 w-0.5 bg-primary-200"></div>
                  {selectedOrder.trackingUpdates.map((t, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[18px] top-1 bg-primary-600 w-2.5 h-2.5 rounded-full ring-4 ring-primary-100"></div>
                      <span className="font-bold text-slate-900 block">{t.status}</span>
                      {t.comment && <span className="text-slate-600 block text-[11px] mt-0.5">{t.comment}</span>}
                      <span className="text-[10px] text-slate-400 block">{new Date(t.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Cancel Order Button in Modal - for eligible orders */}
            {CANCELLABLE_STATUSES.includes(selectedOrder.status) && (
              <div className="pt-2 border-t border-organic-100">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    openCancelModal(selectedOrder);
                  }}
                  className="w-full bg-red-50 border border-red-200 text-red-700 font-bold text-xs py-3 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <Ban className="h-4 w-4" />
                  <span>Cancel This Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Review Modal */}
      <ReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState((prev) => ({ ...prev, isOpen: false }))}
        product={reviewModalState.product}
        orderId={reviewModalState.orderId}
        existingReview={reviewModalState.existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={cancelModalState.isOpen}
        onClose={() => setCancelModalState({ isOpen: false, order: null })}
        order={cancelModalState.order}
        onOrderCancelled={handleOrderCancelled}
      />
    </div>
  );
};

export default BuyerDashboard;
