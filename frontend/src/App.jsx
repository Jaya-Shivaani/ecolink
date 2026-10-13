import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Marketplace from './pages/Marketplace';
import ProductDetails from './pages/ProductDetails';
import PlantAdoption from './pages/PlantAdoption';
import PlantExchange from './pages/PlantExchange';
import BusinessRequests from './pages/BusinessRequests';
import CommunityForum from './pages/CommunityForum';
import Chat from './pages/Chat';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BuyerDashboard from './pages/Dashboards/BuyerDashboard';
import SellerDashboard from './pages/Dashboards/SellerDashboard';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import About from './pages/About';
import Contact from './pages/Contact';
import MeetTheMaker from './pages/MeetTheMaker';
import Makers from './pages/Makers';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';

import AuthPromptModal from './components/AuthPromptModal';

function MainApp() {
  const { user, token } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');

  // Fetch cart from backend if authenticated, otherwise empty cart
  const fetchCart = async () => {
    if (token) {
      try {
        const { data } = await axios.get('/api/cart');
        if (data.success) {
          setCart(data.cart);
        }
      } catch (err) {
        console.error('Error fetching persistent cart:', err);
      }
    } else {
      localStorage.removeItem('guestCart');
      setCart([]);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const addToCart = async (product, qty = 1) => {
    if (!token || !user) {
      setAuthPromptMessage('Please log in or create an account to add items to your cart.');
      setIsAuthPromptOpen(true);
      return { success: false, requireAuth: true };
    }

    try {
      // Self-purchase prevention: check if this is the user's own product
      const productSellerId = product.seller?._id || product.seller;
      if (productSellerId && productSellerId.toString() === user._id) {
        alert('You cannot purchase your own product.');
        return { success: false, message: 'You cannot purchase your own product.' };
      }

      const { data } = await axios.post('/api/cart', {
        productId: product._id,
        qty,
      });
      if (data.success) {
        setCart(data.cart);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      alert(msg);
      return { success: false, message: msg };
    }
  };

  const updateCartQty = async (id, qty) => {
    if (!token) return;
    try {
      const { data } = await axios.put(`/api/cart/${id}`, { qty });
      if (data.success) {
        setCart(data.cart);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeFromCart = async (id) => {
    if (!token) return;
    try {
      const { data } = await axios.delete(`/api/cart/${id}`);
      if (data.success) {
        setCart(data.cart);
      }
    } catch (err) {
      alert('Failed to remove item from cart');
    }
  };

  const clearCart = async () => {
    if (token) {
      try {
        await axios.delete('/api/cart');
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('guestCart');
    setCart([]);
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-[#FBFBFA]">
        <Header cartCount={cart.reduce((acc, item) => acc + item.qty, 0)} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/marketplace" element={<Marketplace addToCart={addToCart} />} />
            <Route path="/products/:id" element={<ProductDetails addToCart={addToCart} />} />
            <Route path="/adoption" element={<PlantAdoption />} />
            <Route path="/exchange" element={<PlantExchange />} />
            <Route path="/business-requests" element={<BusinessRequests />} />
            <Route path="/forum" element={<CommunityForum />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/makers" element={<Makers />} />
            <Route path="/meet/:id" element={<MeetTheMaker />} />
            {/* Protected Routes - General */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/cart" element={<Cart cart={cart} updateCartQty={updateCartQty} removeFromCart={removeFromCart} />} />
              <Route path="/checkout" element={<Checkout cart={cart} clearCart={clearCart} />} />
            </Route>

            {/* Protected Routes - Role Specific */}
            <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
              <Route path="/buyer" element={<BuyerDashboard addToCart={addToCart} />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
              <Route path="/seller" element={<SellerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <AuthPromptModal
          isOpen={isAuthPromptOpen}
          onClose={() => setIsAuthPromptOpen(false)}
          message={authPromptMessage}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
