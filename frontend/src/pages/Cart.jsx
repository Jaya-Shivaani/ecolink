import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash, Gift, ArrowRight, AlertCircle, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';
import { AuthContext } from '../context/AuthContext';

const Cart = ({ cart, updateCartQty, removeFromCart }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Gift states
  const [isGift, setIsGift] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftPhone, setGiftPhone] = useState('');
  const [giftMsg, setGiftMsg] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 1000 ? 0 : 50; // free shipping above 1000
  const total = subtotal + shipping;

  // Self-purchase prevention: detect own products in cart
  const getOwnProducts = () => {
    if (!user) return [];
    return cart.filter((item) => {
      const itemSellerId = item.seller?._id || item.seller;
      return itemSellerId && itemSellerId.toString() === user._id;
    });
  };
  const ownProducts = getOwnProducts();
  const hasOwnProducts = ownProducts.length > 0;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (hasOwnProducts) return; // Blocked — own products in cart
    const checkoutData = {
      isGift,
      giftDetails: isGift
        ? {
            recipientName: giftRecipient,
            recipientPhone: giftPhone,
            message: giftMsg,
          }
        : null,
    };
    navigate('/checkout', { state: checkoutData });
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="bg-organic-100 p-4 rounded-full inline-block">
          <ShoppingBag className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">{t('cart.emptyCart')}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{t('cart.emptyCartMsg')}</p>
        <div className="pt-2">
          <Link
            to="/marketplace"
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors"
          >
            {t('cart.startShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="font-display font-extrabold text-3xl text-primary-950">{t('cart.yourCart')}</h1>

      {/* Self-purchase warning banner */}
      {hasOwnProducts && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3 animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-amber-800 text-sm block">Cannot proceed to checkout</span>
            <span className="text-xs text-amber-700 block mt-0.5">
              You cannot purchase your own product{ownProducts.length > 1 ? 's' : ''}. Please remove the following item{ownProducts.length > 1 ? 's' : ''} to continue:
            </span>
            <ul className="list-disc list-inside text-xs text-amber-800 font-semibold mt-1.5 space-y-0.5">
              {ownProducts.map((item) => (
                <li key={item._id}>{item.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const itemSellerId = item.seller?._id || item.seller;
            const isOwnItem = !!(user && itemSellerId && itemSellerId.toString() === user._id);
            return (
            <div
              key={item._id}
              className={`bg-white border p-4 rounded-2xl flex items-center justify-between space-x-4 shadow-sm ${
                isOwnItem ? 'border-amber-300 bg-amber-50/50' : 'border-organic-200'
              }`}
            >
              <img src={getProductImage(item)} onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-organic-100" />

              <div className="flex-grow min-w-0">
                <Link to={`/products/${item._id}`} className="font-display font-bold text-xs text-slate-900 hover:text-primary-700 truncate block">
                  {item.name}
                </Link>
                <span className="text-[10px] text-slate-400 block">{item.category}</span>
                {isOwnItem && (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md mt-0.5">
                    <Ban className="h-3 w-3" />
                    <span>Your Product</span>
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-900 block mt-0.5">₹{item.price}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-organic-200 rounded-lg p-0.5 bg-organic-50">
                  <button
                    onClick={() => updateCartQty(item._id, Math.max(1, item.qty - 1))}
                    className="px-2 py-1 text-slate-500 hover:bg-white rounded font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="px-2 font-bold text-slate-800 text-xs">{item.qty}</span>
                  <button
                    onClick={() => updateCartQty(item._id, Math.min(item.stock, item.qty + 1))}
                    className="px-2 py-1 text-slate-500 hover:bg-white rounded font-bold text-xs"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-all"
                >
                  <Trash className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          );})}

          {/* Eco-Friendly Gift wrapping options */}
          <div className="bg-white border border-organic-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="isGift"
                className="h-4.5 w-4.5 text-primary-600 border-organic-300 rounded"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
              />
              <span className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Gift className="h-4 w-4 text-emerald-600" />
                <span>Gift this Order (Eco-friendly packing & note)</span>
              </span>
            </label>

            {isGift && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="gift-recipient-name" className="block text-xxs font-semibold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    id="gift-recipient-name"
                    name="giftRecipient"
                    type="text"
                    required={isGift}
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    placeholder="Recipient's Name"
                    value={giftRecipient}
                    onChange={(e) => setGiftRecipient(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="gift-recipient-phone" className="block text-xxs font-semibold text-slate-700 mb-1">Recipient Phone Number</label>
                  <input
                    id="gift-recipient-phone"
                    name="giftPhone"
                    type="tel"
                    required={isGift}
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    placeholder="9876543210"
                    value={giftPhone}
                    onChange={(e) => setGiftPhone(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="gift-custom-msg" className="block text-xxs font-semibold text-slate-700 mb-1">Custom Message Card</label>
                  <textarea
                    id="gift-custom-msg"
                    name="giftMsg"
                    rows="2.5"
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    placeholder="E.g., Happy Environment Day! Enjoy your air purifying plant puppy."
                    value={giftMsg}
                    onChange={(e) => setGiftMsg(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing calculations sidebar */}
        <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm self-start space-y-6">
          <h3 className="font-display font-bold text-slate-900 border-b border-organic-100 pb-3">Order Calculations</h3>
          
          <div className="text-xs space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.subtotal')}</span>
              <span className="font-semibold text-slate-800">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.shipping')}</span>
              <span className="font-semibold text-slate-800">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            <div className="h-px bg-organic-100 my-2"></div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-900">{t('cart.total')}</span>
              <span className="font-extrabold text-slate-900">₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={hasOwnProducts}
            className={`w-full flex items-center justify-center space-x-2 font-bold py-3.5 rounded-xl shadow-md transition-all text-xs ${
              hasOwnProducts
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {hasOwnProducts ? (
              <>
                <Ban className="h-4 w-4" />
                <span>Remove own products to checkout</span>
              </>
            ) : (
              <>
                <span>{t('cart.proceedToCheckout')}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
