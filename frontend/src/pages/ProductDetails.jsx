import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { Star, MessageSquare, AlertCircle, ShieldCheck, Sparkles, ShoppingCart, Info, Droplet, Sun, Sprout, Hammer, Heart, Ban, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';
import ReviewModal from '../components/ReviewModal';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Dynamic Reviews State
  const [reviewsData, setReviewsData] = useState({
    count: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [eligibleOrder, setEligibleOrder] = useState(null);
  const [userExistingReview, setUserExistingReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (user && user.wishlist && Array.isArray(user.wishlist) && id) {
      const wishlisted = user.wishlist.some(item => (typeof item === 'string' ? item : item?._id) === id);
      setIsWishlisted(wishlisted);
    }
  }, [user, id]);

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.post(`/api/auth/wishlist/${id}`);
      if (data.success) {
        setIsWishlisted(data.isWishlisted);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!addToCart || !product) return;
    await addToCart(product, qty);
  };

  const fetchReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const { data } = await axios.get(`/api/products/${id}/reviews`);
      if (data.success) {
        setReviewsData({
          count: data.count || (data.reviews ? data.reviews.length : 0),
          averageRating: data.averageRating || 0,
          ratingDistribution: data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: data.reviews || [],
        });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!user || !id) return;
    try {
      const { data: orderData } = await axios.get('/api/orders/myorders');
      if (orderData.success && Array.isArray(orderData.orders)) {
        // Find delivered orders that included this product
        const deliveredOrders = orderData.orders.filter(
          (o) =>
            (o.status === 'Delivered' || o.status === 'Completed') &&
            o.orderItems?.some(
              (item) =>
                (item.product?._id || item.product)?.toString() === id.toString()
            )
        );

        if (deliveredOrders.length > 0) {
          // Check existing reviews by this buyer
          const { data: myRevData } = await axios.get('/api/reviews/my-reviews');
          const myRevs = myRevData?.reviews || [];

          // Find if user already reviewed this product
          const existing = myRevs.find(
            (r) =>
              (r.product?._id || r.product)?.toString() === id.toString()
          );
          setUserExistingReview(existing || null);

          // Find any delivered order not yet reviewed
          const unreviewedOrder = deliveredOrders.find(
            (ord) =>
              !myRevs.some(
                (r) =>
                  (r.order?._id || r.order)?.toString() === ord._id.toString() &&
                  (r.product?._id || r.product)?.toString() === id.toString()
              )
          );

          if (unreviewedOrder) {
            setEligibleOrder(unreviewedOrder);
          } else {
            setEligibleOrder(deliveredOrders[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data } = await axios.get(`/api/products/${id}`);
      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        setErrorMsg('Product not found');
        setProduct(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to load product details');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      checkEligibility();
    }
  }, [id, user]);

  const handleReviewSaved = () => {
    fetchProduct();
    fetchReviews();
    checkEligibility();
  };

  const handleStartChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const partnerId = product?.seller?._id || product?.seller;
    if (partnerId) {
      navigate(`/chat?partner=${partnerId}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mb-4"></div>
        <p className="text-slate-600 font-semibold text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!product || errorMsg) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-3xl p-8 space-y-3">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="font-display font-bold text-xl text-slate-900">Product Unavailable</h2>
          <p className="text-xs text-slate-600">{errorMsg || 'The requested product could not be loaded.'}</p>
          <Link
            to="/marketplace"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const categoryLower = (product.category || '').toLowerCase();
  const isPlant = categoryLower.includes('plant') || categoryLower.includes('seed');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (
      lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      lat1 === null || lon1 === null || lat2 === null || lon2 === null ||
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
      return null;
    }
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDeliveryEstimate = (dist) => {
    if (dist === null || dist === undefined) return '1-2 days';
    if (dist < 5) return 'Same day / 1 day (Local Eco-Messenger)';
    if (dist <= 20) return '1-2 days';
    if (dist <= 50) return '2-3 days';
    return '3-5 days';
  };

  const userLat = user?.location?.coordinates?.[1] || 9.1700;
  const userLng = user?.location?.coordinates?.[0] || 77.8700;
  const sellerLat = product.seller?.location?.coordinates?.[1];
  const sellerLng = product.seller?.location?.coordinates?.[0];
  const distance = calculateDistance(userLat, userLng, sellerLat, sellerLng);
  const deliveryDays = getDeliveryEstimate(distance);

  // Self-purchase prevention: check if logged-in user is the seller of this product
  const sellerId = product.seller?._id || product.seller;
  const isOwnProduct = !!(user && sellerId && user._id?.toString() === sellerId.toString());

  // Images resolution
  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [getProductImage(product)];
  const currentImage = allImages[selectedImageIndex] || allImages[0] || PRODUCT_PLACEHOLDER;

  const sellerName = product.seller?.sellerProfile?.businessName || product.seller?.name || 'Local Seller';
  const sellerCategory = product.seller?.sellerProfile?.category || 'Grower';
  const sellerStory = product.seller?.sellerProfile?.story || 'Providing healthy green crops and crafts directly to the local community.';
  const sellerAddress = product.seller?.address || product.seller?.sellerProfile?.businessAddress || 'Main Road, Kovilpatti';
  const sellerRating = product.seller?.sellerProfile?.rating || '4.8';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Product Top Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Images */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-organic-200 aspect-[4/3] shadow-md bg-organic-50">
            <img
              src={currentImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getProductImage(product);
              }}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`rounded-xl border overflow-hidden aspect-[4/3] transition-all ${
                    selectedImageIndex === idx
                      ? 'border-primary-600 ring-2 ring-primary-500/40'
                      : 'border-organic-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PRODUCT_PLACEHOLDER;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase card */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="bg-organic-200 text-organic-800 text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                {product.category || 'General'}
              </span>
              {product.isEcoFriendly && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Verified Eco-Friendly
                </span>
              )}
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="flex items-center text-yellow-500">
                <Star className="h-4.5 w-4.5 fill-yellow-500" />
                <span className="ml-1 font-bold text-slate-800">{product.rating || 'N/A'}</span>
              </div>
              <span>({product.totalReviews || reviewsData.count || 0} customer reviews)</span>
            </div>
          </div>

          <div className="border-t border-b border-organic-200 py-4 flex justify-between items-center bg-organic-50 px-6 rounded-2xl">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Direct Price</span>
              <span className="text-2xl font-extrabold text-slate-900">₹{product.price}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Stock Available</span>
              <span className={`text-sm font-bold ${product.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {product.stock > 0 ? `${product.stock} items left` : 'Sold Out'}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

          {/* Add to Cart Actions */}
          {isOwnProduct ? (
            <div className="pt-2">
              <div className="bg-amber-50 text-amber-800 border border-amber-300 rounded-2xl px-5 py-4 text-sm font-bold flex items-center space-x-2.5">
                <Ban className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <span className="block">Your Product</span>
                  <span className="block text-xs font-medium text-amber-700 mt-0.5">You cannot purchase your own product.</span>
                </div>
              </div>
            </div>
          ) : product.stock > 0 ? (
            <div className="flex items-center space-x-4 pt-2">
              <div className="flex items-center border border-organic-300 rounded-xl bg-white p-1">
                <button
                  type="button"
                  className="px-3 py-1.5 hover:bg-organic-100 text-slate-600 rounded-lg text-sm font-bold"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-slate-800 text-sm">{qty}</span>
                <button
                  type="button"
                  className="px-3 py-1.5 hover:bg-organic-100 text-slate-600 rounded-lg text-sm font-bold"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-grow flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-700/10 hover:shadow-primary-700/20 transition-all text-sm"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                <span>Add To Cart</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-xl border transition-all ${
                  isWishlisted
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-white border-organic-300 text-slate-500 hover:text-red-500 hover:border-red-200'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          ) : (
            <div className="pt-2 flex items-center space-x-4">
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-5 py-3.5 text-xs font-bold flex-grow text-center">
                Currently Sold Out — Check back soon or save to wishlist
              </div>
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-xl border transition-all ${
                  isWishlisted
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-white border-organic-300 text-slate-500 hover:text-red-500 hover:border-red-200'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Plant Care Specifications Box */}
      {isPlant && product.plantInfo && (
        <div className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2">
            <Info className="h-5 w-5 text-primary-700" />
            <span>Plant Characteristics & Growth Rules</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="bg-organic-50 p-4 border border-organic-150 rounded-2xl flex items-start space-x-3">
              <Droplet className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Water Need</span>
                <span className="block text-sm font-bold text-slate-800">{product.plantInfo.waterRequirement || 'Medium'}</span>
              </div>
            </div>
            <div className="bg-organic-50 p-4 border border-organic-150 rounded-2xl flex items-start space-x-3">
              <Sun className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sunlight</span>
                <span className="block text-sm font-bold text-slate-800">{product.plantInfo.sunlightRequirement || 'Full Sun'}</span>
              </div>
            </div>
            <div className="bg-organic-50 p-4 border border-organic-150 rounded-2xl flex items-start space-x-3">
              <Sprout className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Setting</span>
                <span className="block text-sm font-bold text-slate-800">{product.plantInfo.indoorOutdoor || 'Outdoor'}</span>
              </div>
            </div>
            <div className="bg-organic-50 p-4 border border-organic-150 rounded-2xl flex items-start space-x-3">
              <Hammer className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Difficulty</span>
                <span className="block text-sm font-bold text-slate-800">{product.plantInfo.difficultyLevel || 'Easy'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs text-slate-500">
            <div>• <b>Growth Rate:</b> {product.plantInfo.growthRate || 'Moderate'}</div>
            <div>• <b>Maintenance:</b> {product.plantInfo.maintenanceLevel || 'Low'}</div>
            <div>• <b>Pet Friendly:</b> {product.plantInfo.petFriendly ? 'Yes, Safe for Pets' : 'No, Keep out of reach'}</div>
          </div>
        </div>
      )}

      {/* Meet the Maker Profile Section */}
      {product.seller && (
        <div className="bg-[#E6E8E2]/30 border border-organic-200 rounded-3xl p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="space-y-4">
            <div>
              <span className="text-xxs text-primary-800 uppercase font-bold tracking-wider block mb-1">Meet the Maker</span>
              <h2 className="font-display font-extrabold text-2xl text-slate-900">
                {sellerName}
              </h2>
              <span className="text-xs text-slate-500 block mt-0.5">Category: {sellerCategory}</span>
            </div>

            <div className="flex space-x-2">
              {product.seller?.sellerProfile?.isSHG && (
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>SHG Group</span>
                </span>
              )}
              {product.seller?.sellerProfile?.isWomenEntrepreneur && (
                <span className="bg-pink-100 text-pink-800 border border-pink-200 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Women Entrepreneur</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-sm text-slate-600 leading-relaxed border-t md:border-t-0 md:border-l md:border-r border-organic-200/80 md:px-8 py-4 md:py-0">
            <span className="font-semibold text-slate-800 block mb-1">Our Story:</span>
            "{sellerStory}"
          </div>

          <div className="flex flex-col space-y-3 justify-center items-stretch sm:items-start md:items-end">
            <div className="text-xs text-slate-500 space-y-1">
              <div>📍 <b>Address:</b> {sellerAddress}</div>
              {distance !== null && !isNaN(distance) && (
                <>
                  <div>📏 <b>Distance:</b> {distance.toFixed(1)} km away</div>
                  <div>🚚 <b>Delivery Estimate:</b> {deliveryDays}</div>
                </>
              )}
              <div>⭐ <b>Seller Rating:</b> {sellerRating}/5</div>
            </div>
            {user?._id?.toString() !== sellerId?.toString() && (
              <button
                type="button"
                onClick={handleStartChat}
                className="inline-flex items-center justify-center space-x-2 bg-primary-800 hover:bg-primary-950 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-xs"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat with Seller</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Ratings & Customer Reviews Section */}
      <div className="pt-8 border-t border-organic-200 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xxs font-extrabold tracking-wider uppercase text-primary-700 block">
              Customer Feedback
            </span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900">
              Ratings & Reviews ({reviewsData.count})
            </h3>
          </div>

          {/* Action button for verified buyers */}
          {user && (
            <div>
              {userExistingReview ? (
                <div className="flex items-center space-x-2.5 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl">
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You reviewed this product</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="text-xs font-extrabold text-primary-700 hover:text-primary-900 underline"
                  >
                    Edit
                  </button>
                </div>
              ) : eligibleOrder ? (
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-primary-700/15 transition-all hover:scale-102"
                >
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>Rate & Review This Product</span>
                </button>
              ) : (
                <div className="text-xxs font-semibold text-slate-400 bg-organic-50 border border-organic-150 px-3 py-1.5 rounded-xl">
                  Verified reviews only available for delivered orders
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rating Breakdown & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-organic-200 rounded-3xl p-6 shadow-xs">
          {/* Overall Score */}
          <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-organic-100">
            <span className="font-display font-extrabold text-5xl text-slate-900">
              {reviewsData.averageRating > 0 ? reviewsData.averageRating : (product.rating || '0.0')}
            </span>
            <div className="flex items-center space-x-1 text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map((s) => {
                const avg = reviewsData.averageRating || product.rating || 0;
                return (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= Math.round(avg)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Based on {reviewsData.count} customer {reviewsData.count === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="md:col-span-2 flex flex-col justify-center space-y-2 px-2 sm:px-6">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewsData.ratingDistribution?.[stars] || 0;
              const total = reviewsData.count || 1;
              const percent = reviewsData.count > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={stars} className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1 w-10 text-slate-700 font-bold shrink-0">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-organic-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="w-12 text-right text-slate-400 text-xxs font-semibold shrink-0">
                    {count} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Reviews List */}
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Loading reviews...
            </div>
          ) : reviewsData.reviews.length === 0 ? (
            <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center space-y-2.5 shadow-xs">
              <Star className="w-10 h-10 text-amber-300 mx-auto fill-amber-50" />
              <h4 className="font-display font-bold text-slate-800 text-sm">
                No reviews yet. Be the first to review this product.
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Customer reviews are unlocked once an order has been successfully delivered to verified buyers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsData.reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white border border-organic-200 p-5 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header: Name, Stars, Date */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-display font-bold text-xs text-slate-900">
                            {rev.name || rev.user?.name || 'Verified Buyer'}
                          </span>
                          <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                            ✓ Verified
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Photo Gallery (if images present) */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-2">
                        {rev.images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => setLightboxImage(imgUrl)}
                            className="relative group w-14 h-14 rounded-xl overflow-hidden border border-organic-200 bg-slate-50 hover:opacity-90 focus:outline-none transition-opacity shadow-2xs"
                          >
                            <img
                              src={imgUrl}
                              alt={`Customer photo ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && eligibleOrder && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={product}
          orderId={eligibleOrder._id}
          existingReview={userExistingReview}
          onReviewSubmitted={handleReviewSaved}
        />
      )}

      {/* Lightbox Modal for Full Image View */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-transparent p-2">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-slate-900/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Review full photo"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/20 object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

