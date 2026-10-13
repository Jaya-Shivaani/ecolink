import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Phone, MapPin, AlertCircle, Leaf, Sparkles, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Signup = () => {
  const { t } = useTranslation();
  const { register, loginWithGoogle, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const [role, setRole] = useState('buyer'); // 'buyer' or 'seller'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    latitude: '9.1700', // Default Kovilpatti
    longitude: '77.8700',
    businessName: '',
    sellerCategory: 'Home Garden Owner',
    story: '',
    isSHG: false,
    isWomenEntrepreneur: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successLoc, setSuccessLoc] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          setSuccessLoc(true);
        },
        (error) => {
          console.error(error);
          alert('Could not fetch location automatically. Please keep default coordinates or type manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phoneNumber.trim();

    if (!trimmedName || !trimmedEmail || !formData.password) {
      setErrorMsg(t('auth.fillAllFields'));
      return;
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(trimmedEmail)) {
      setErrorMsg(t('auth.validEmailError'));
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg(t('auth.passwordLengthError'));
      return;
    }

    if (trimmedPhone && !/^\+?[0-9]{10,15}$/.test(trimmedPhone.replace(/[\s\-()]/g, ''))) {
      setErrorMsg(t('auth.validPhoneError'));
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      name: trimmedName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      address: formData.address.trim(),
      role,
    };
    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white border border-organic-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-organic-100/50 space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary-600 p-3 rounded-2xl inline-block text-white mb-2 shadow-lg shadow-primary-700/20">
            <Leaf className="h-6 w-6" />
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-primary-950">Join the EcoLink Community</h2>
          <p className="text-sm text-slate-500">Sign up to buy sustainable products or sell your homegrown plants.</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-organic-100 rounded-2xl border border-organic-200">
          <button
            type="button"
            className={`py-3 rounded-xl font-display font-bold text-sm transition-all ${
              role === 'buyer'
                ? 'bg-white text-primary-900 shadow'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setRole('buyer')}
          >
            I want to Buy / Exchange
          </button>
          <button
            type="button"
            className={`py-3 rounded-xl font-display font-bold text-sm transition-all flex items-center justify-center space-x-1.5 ${
              role === 'seller'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setRole('seller')}
          >
            <Sparkles className="h-4 w-4" />
            <span>I want to Sell Plants/EcoCrafts</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="signupName" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="signupName"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signupEmail" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="signupEmail"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="signupPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="signupPassword"
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signupPhone" className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="signupPhone"
                  type="tel"
                  name="phoneNumber"
                  required
                  autoComplete="tel"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="9876543210"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="signupAddress" className="block text-sm font-semibold text-slate-700 mb-1.5">Shipping Address / Location</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="signupAddress"
                type="text"
                name="address"
                required
                autoComplete="street-address"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                placeholder="Door No, Street Name, City, Pincode"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Hyperlocal Geolocation Config */}
          <div className="bg-organic-50 p-4 border border-organic-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <span className="block text-sm font-semibold text-slate-800">Hyperlocal Geolocation Coordinates</span>
                <span className="block text-xs text-slate-500">Used for calculating neighborhood distances on the map.</span>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors text-xs font-bold"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>{successLoc ? 'Detected ✓' : 'Detect Location'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="signupLongitude" className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider">Longitude</label>
                <input
                  id="signupLongitude"
                  type="number"
                  step="0.000001"
                  name="longitude"
                  className="w-full px-3 py-2 rounded-lg border border-organic-200 bg-white text-xs focus:outline-none"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="signupLatitude" className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider">Latitude</label>
                <input
                  id="signupLatitude"
                  type="number"
                  step="0.000001"
                  name="latitude"
                  className="w-full px-3 py-2 rounded-lg border border-organic-200 bg-white text-xs focus:outline-none"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Seller Section */}
          {role === 'seller' && (
            <div className="border-t border-organic-200 pt-6 space-y-4">
              <h3 className="font-display font-bold text-lg text-primary-950 flex items-center space-x-2">
                <span>Seller Business Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signupBusinessName" className="block text-sm font-semibold text-slate-700 mb-1.5">Business / Nursery Name</label>
                  <input
                    id="signupBusinessName"
                    type="text"
                    name="businessName"
                    required={role === 'seller'}
                    className="w-full px-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Green Leaves Garden Nursery"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="signupSellerCategory" className="block text-sm font-semibold text-slate-700 mb-1.5">Seller Category</label>
                  <select
                    id="signupSellerCategory"
                    name="sellerCategory"
                    className="w-full px-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                    value={formData.sellerCategory}
                    onChange={handleChange}
                  >
                    <option value="Home Garden Owner">Home Garden Owner</option>
                    <option value="Nursery">Nursery / Garden Center</option>
                    <option value="Farmer">Farmer</option>
                    <option value="Women Entrepreneur">Women Entrepreneur</option>
                    <option value="Self Help Group (SHG)">Self Help Group (SHG)</option>
                    <option value="Rural Artisan">Rural Artisan</option>
                    <option value="Organic Product Maker">Organic Product Maker</option>
                    <option value="Small Business">Small Business</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="signupStory" className="block text-sm font-semibold text-slate-700 mb-1.5">Your Story / Biography</label>
                <textarea
                  id="signupStory"
                  name="story"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-organic-200 bg-organic-50 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="Share your organic growing background, your focus, and how you sustain the community."
                  value={formData.story}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="space-y-2 p-2">
                <div className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="isWomenEntrepreneur"
                    name="isWomenEntrepreneur"
                    className="h-4.5 w-4.5 rounded border-organic-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.isWomenEntrepreneur}
                    onChange={handleChange}
                  />
                  <label htmlFor="isWomenEntrepreneur" className="text-sm font-medium text-slate-700">
                    Woman-owned / Women Entrepreneur Enterprise
                  </label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="isSHG"
                    name="isSHG"
                    className="h-4.5 w-4.5 rounded border-organic-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.isSHG}
                    onChange={handleChange}
                  />
                  <label htmlFor="isSHG" className="text-sm font-medium text-slate-700">
                    Self Help Group (SHG) Affiliation
                  </label>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-700/10 hover:shadow-primary-700/20 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-organic-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xxs uppercase font-bold tracking-wider">Or</span>
          <div className="flex-grow border-t border-organic-200"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 border border-organic-200 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{t('auth.googleSignIn')}</span>
        </button>

        <div className="text-center text-xs text-slate-500 border-t border-organic-100 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-700 font-bold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
