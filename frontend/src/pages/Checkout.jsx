import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  ShieldCheck,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  LocateFixed,
  Calendar,
  Ban,
} from 'lucide-react';
import { loadRazorpayScript } from '../utils/razorpay';
import { getOrderExpectedDelivery } from '../utils/dateUtils';

const Checkout = ({ cart, clearCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const giftData = location.state || {};

  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('Online Payment (Razorpay)');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');

  // Locate Me: Auto-detect GPS location & reverse-geocode street address
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setErrorMsg('');
    setLocationSuccessMsg('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedAddress = '';

        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              detectedAddress = data.display_name;
            }
          }
        } catch (geocodeErr) {
          console.warn('Reverse geocoding error:', geocodeErr);
        }

        if (!detectedAddress) {
          detectedAddress = `${user?.address ? user.address + ' | ' : ''}GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }

        setAddress(detectedAddress);
        setLocating(false);
        setLocationSuccessMsg('Delivery coordinates & address located!');
        setTimeout(() => setLocationSuccessMsg(''), 4000);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setErrorMsg('Location access was denied. Please enable location permissions or enter your address manually.');
        } else {
          setErrorMsg('Could not detect location. Please type your delivery address manually.');
        }
        setLocationSuccessMsg('');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  // Self-purchase prevention: detect own products in cart
  const ownProducts = user
    ? cart.filter((item) => {
        const itemSellerId = item.seller?._id || item.seller;
        return itemSellerId && itemSellerId.toString() === user._id;
      })
    : [];
  const hasOwnProducts = ownProducts.length > 0;

  const buildOrderPayload = () => {
    const orderItems = cart.map((item) => ({
      product: item._id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      image: item.images && item.images[0] ? item.images[0] : '',
    }));

    return {
      orderItems,
      shippingAddress: address,
      shippingPrice: shipping,
      totalPrice: total,
      isGift: !!giftData.isGift,
      giftDetails: giftData.giftDetails,
    };
  };

  // Handle Razorpay Payment Flow
  const handleRazorpayPayment = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setErrorMsg('Failed to load Razorpay SDK. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }

      const orderPayload = buildOrderPayload();

      // 2. Request backend to create Razorpay Order
      const { data } = await axios.post('/api/orders/razorpay/create-order', orderPayload);
      if (!data.success) {
        setErrorMsg(data.message || 'Failed to initiate payment');
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay modal options
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'EcoLink Hyperlocal',
        description: 'Eco-Friendly Purchase (Test Mode)',
        order_id: data.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phoneNumber || '',
        },
        theme: {
          color: '#166534', // EcoLink Primary Green
        },
        handler: async function (response) {
          try {
            setLoading(true);
            // 4. Verify payment signature on backend
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderPayload,
            };

            const verifyRes = await axios.post('/api/orders/razorpay/verify-payment', verifyPayload);

            if (verifyRes.data.success) {
              clearCart();
              setConfirmedOrder(verifyRes.data.order);
            } else {
              setErrorMsg(verifyRes.data.message || 'Payment verification failed. Please contact support.');
            }
          } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Payment verification encountered an error.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMsg('Payment window was closed. Your cart is preserved, and you can retry when ready.');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response) {
        setLoading(false);
        setErrorMsg(`Payment Failed: ${response.error?.description || 'Transaction was not completed'}. Please retry.`);
      });

      razorpayInstance.open();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing Razorpay checkout.');
      setLoading(false);
    }
  };

  // Handle Standard Cash on Delivery Flow
  const handleCODPayment = async () => {
    setLoading(true);
    setErrorMsg('');

    const orderPayload = {
      ...buildOrderPayload(),
      paymentMethod: 'Cash on Delivery',
    };

    try {
      const { data } = await axios.post('/api/orders', orderPayload);
      if (data.success) {
        clearCart();
        setConfirmedOrder(data.order);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMsg('Please specify a valid delivery address');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty');
      return;
    }

    // Self-purchase prevention guard (defense-in-depth)
    if (hasOwnProducts) {
      const names = ownProducts.map((p) => `"${p.name}"`).join(', ');
      setErrorMsg(`You cannot purchase your own product${ownProducts.length > 1 ? 's' : ''}: ${names}. Please remove ${ownProducts.length > 1 ? 'them' : 'it'} from your cart first.`);
      return;
    }

    if (paymentMethod === 'Online Payment (Razorpay)') {
      await handleRazorpayPayment();
    } else {
      await handleCODPayment();
    }
  };

  // ── Confirmation Screen Modal ──
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
        <div className="bg-white border border-organic-200 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {confirmedOrder.paymentStatus === 'Paid' ? 'Payment Verified' : 'Order Placed'}
            </span>
            <h1 className="font-display font-extrabold text-3xl text-slate-900">
              {confirmedOrder.paymentStatus === 'Paid' ? 'Payment & Order Successful!' : 'Order Placed Successfully!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Thank you for supporting hyperlocal eco-initiatives! Your order has been placed with the seller and is marked for zero-plastic preparation.
            </p>
          </div>

          {/* Receipt Info Card */}
          <div className="bg-organic-50 border border-organic-200 rounded-2xl p-5 text-left text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-organic-200">
              <span className="text-slate-500 font-medium">EcoLink Order ID</span>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">#{confirmedOrder._id}</span>
            </div>

            {confirmedOrder.razorpayPaymentId && (
              <div className="flex justify-between items-center pb-2 border-b border-organic-200">
                <span className="text-slate-500 font-medium">Razorpay Payment ID</span>
                <span className="font-mono font-bold text-emerald-800">{confirmedOrder.razorpayPaymentId}</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-organic-200">
              <span className="text-slate-500 font-medium">Payment Method</span>
              <span className="font-semibold text-slate-800">{confirmedOrder.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-organic-200">
              <span className="text-slate-500 font-medium">Expected Delivery</span>
              <span className="font-bold text-emerald-800 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-600 inline" />
                <span>{getOrderExpectedDelivery(confirmedOrder)}</span>
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-organic-200">
              <span className="text-slate-500 font-medium">Payment Status</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${confirmedOrder.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {confirmedOrder.paymentStatus}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-sm font-extrabold text-slate-900">
              <span>Total Paid Amount</span>
              <span className="text-primary-800">₹{confirmedOrder.totalPrice}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/buyer#orders')}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center space-x-2"
            >
              <span>Track in My Orders</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/marketplace"
              className="flex-1 bg-organic-100 hover:bg-organic-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-primary-950">{t('checkout.checkoutTitle')}</h1>
          <p className="text-xs text-slate-500 mt-1">Complete your delivery address and choose your payment method.</p>
        </div>
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Hyperlocal Buyer Protection</span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-4 rounded-2xl flex items-start space-x-2 animate-fadeIn">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-grow">
            <span className="font-bold block">Notice</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Shipping address & payment */}
        <div className="md:col-span-7 space-y-6">
          {/* Shipping details */}
          <div className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center space-x-2">
                <MapPin className="h-4.5 w-4.5 text-primary-600" />
                <label htmlFor="checkout-delivery-address">{t('checkout.deliveryAddress')}</label>
              </h3>
              <button
                type="button"
                id="checkout-locate-me-btn"
                onClick={handleLocateMe}
                disabled={locating}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-1.5 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <LocateFixed className={`h-3.5 w-3.5 text-primary-600 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Locate Me'}</span>
              </button>
            </div>

            <textarea
              id="checkout-delivery-address"
              name="address"
              required
              rows="3.5"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder={t('checkout.confirmAddress')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></textarea>

            {locationSuccessMsg && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 animate-fadeIn">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span>{locationSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Payment selection */}
          <div className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center space-x-2">
                <CreditCard className="h-4.5 w-4.5 text-primary-600" />
                <span>{t('checkout.paymentMethod')}</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <Lock className="h-3 w-3" />
                <span>Razorpay Test Mode</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* Razorpay Option */}
              <label
                className={`flex items-start justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                  paymentMethod === 'Online Payment (Razorpay)'
                    ? 'border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-500'
                    : 'border-organic-200 bg-white hover:bg-organic-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    className="accent-primary-600 mt-1"
                    checked={paymentMethod === 'Online Payment (Razorpay)'}
                    onChange={() => setPaymentMethod('Online Payment (Razorpay)')}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        Online Payment (Razorpay)
                      </span>
                      <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        TEST
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Pay instantly via UPI, Cards, Netbanking, or Wallet
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-1 text-slate-400 text-xs">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-emerald-800">Verified</span>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={`flex items-start justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-500'
                    : 'border-organic-200 bg-white hover:bg-organic-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    className="accent-primary-600 mt-1"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={() => setPaymentMethod('Cash on Delivery')}
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      {t('checkout.cod')}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Pay with cash upon physical delivery
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order review sidebar */}
        <div className="md:col-span-5 bg-white border border-organic-200 rounded-3xl p-6 shadow-sm self-start space-y-6">
          <h3 className="font-display font-bold text-slate-900 border-b border-organic-100 pb-3 flex items-center justify-between">
            <span>{t('checkout.reviewItems')}</span>
            <span className="text-xs text-slate-400 font-normal">({cart.length} items)</span>
          </h3>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item._id} className="flex justify-between items-center text-xs">
                <span className="text-slate-700 truncate max-w-[160px] font-medium">
                  {item.name} <span className="text-slate-400">(x{item.qty})</span>
                </span>
                <span className="font-bold text-slate-900">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-organic-100 pt-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.subtotal')}</span>
              <span className="font-bold text-slate-800">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.shipping')}</span>
              <span className="font-bold text-slate-800">
                {shipping === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${shipping}`}
              </span>
            </div>
            <div className="h-px bg-organic-100 my-2"></div>
            <div className="flex justify-between text-base font-extrabold text-slate-900">
              <span>{t('cart.total')}</span>
              <span className="text-primary-800 text-lg">₹{total}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : paymentMethod === 'Online Payment (Razorpay)' ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Pay ₹{total} with Razorpay</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>{t('checkout.placeOrder')} (₹{total})</span>
              </>
            )}
          </button>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Encrypted with Razorpay Test Mode 256-bit Security</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
