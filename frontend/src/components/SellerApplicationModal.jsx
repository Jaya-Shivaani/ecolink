import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  X,
  Store,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Navigation,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SellerApplicationModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, refreshUser, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: user?.sellerProfile?.businessName || '',
    businessType: user?.sellerProfile?.category || 'Home Grower',
    sellerType: user?.sellerProfile?.sellerType || (user?.sellerProfile?.isSHG ? 'SHG Member' : 'Farmer'),
    description: user?.sellerProfile?.description || user?.sellerProfile?.story || '',
    businessAddress: user?.sellerProfile?.businessAddress || user?.address || '',
    upiId: user?.sellerProfile?.upiId || '',
    license: user?.sellerProfile?.license || '',
    enteredLatitude: user?.location?.coordinates?.[1] || 9.1700,
    enteredLongitude: user?.location?.coordinates?.[0] || 77.8700,
    detectedLatitude: null,
    detectedLongitude: null,
    // Product Source & Genuineness
    sourceType: user?.sellerProfile?.productSource?.sourceType || 'Own Farm',
    sourceName: user?.sellerProfile?.productSource?.sourceName || '',
    sourceLocation: user?.sellerProfile?.productSource?.sourceLocation || '',
    sourceDescription: user?.sellerProfile?.productSource?.description || '',
    declarationAccepted: user?.sellerProfile?.productSource?.declarationAccepted || false,
  });

  const [locationVerificationMsg, setLocationVerificationMsg] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const validateUPI = (upi) => {
    if (!upi || typeof upi !== 'string') return true;
    const trimmed = upi.trim();
    if (trimmed === '') return true;
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationVerificationMsg('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLoc(true);
    setLocationVerificationMsg('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detLat = pos.coords.latitude;
        const detLng = pos.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          detectedLatitude: detLat,
          detectedLongitude: detLng,
        }));
        setDetectingLoc(false);
        setLocationVerificationMsg(
          `GPS location captured (${detLat.toFixed(4)}, ${detLng.toFixed(4)}). Will be verified during application.`
        );
      },
      (err) => {
        setDetectingLoc(false);
        console.warn('Geolocation permission denied or timed out:', err);
        setLocationVerificationMsg('Could not detect GPS coordinates. You may still proceed with entered address.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedData = {
      businessName: formData.businessName.trim(),
      businessType: formData.businessType.trim(),
      sellerType: formData.sellerType.trim(),
      description: formData.description.trim(),
      businessAddress: formData.businessAddress.trim(),
      upiId: formData.upiId.trim(),
      license: formData.license.trim(),
      enteredLatitude: Number(formData.enteredLatitude) || undefined,
      enteredLongitude: Number(formData.enteredLongitude) || undefined,
      detectedLatitude: formData.detectedLatitude != null ? Number(formData.detectedLatitude) : undefined,
      detectedLongitude: formData.detectedLongitude != null ? Number(formData.detectedLongitude) : undefined,
      productSource: {
        sourceType: formData.sourceType,
        sourceName: formData.sourceName.trim(),
        sourceLocation: formData.sourceLocation.trim(),
        description: formData.sourceDescription.trim(),
        declarationAccepted: formData.declarationAccepted,
      },
    };

    if (!trimmedData.businessName) {
      setErrorMsg('Please enter a valid business name.');
      return;
    }

    if (!trimmedData.sellerType) {
      setErrorMsg('Please select a seller type (e.g. Farmer, SHG Member, Nursery Owner).');
      return;
    }

    if (!formData.declarationAccepted) {
      setErrorMsg('Please review and accept the Product Source Genuineness Declaration.');
      return;
    }

    if (trimmedData.upiId && !validateUPI(trimmedData.upiId)) {
      setErrorMsg(t('seller.invalidUpi') || 'Please enter a valid UPI ID (example@bankhandle).');
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post('/api/auth/apply-seller', trimmedData);

      if (data.success) {
        setSuccessMsg(data.message || 'Application submitted successfully! Awaiting Admin Review.');
        if (data.user && setUser) {
          setUser(data.user);
        } else if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit seller application');
    } finally {
      setLoading(false);
    }
  };

  const sellerStatus = user?.sellerStatus || 'none';
  const isApproved = user?.roles?.seller && sellerStatus === 'approved';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-organic-200 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-organic-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-organic-100 pb-4 pr-8">
          <div className="flex items-center space-x-2 text-primary-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="h-4 w-4" />
            <span>EcoLink Merchant Partner Program</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900">
            {isApproved ? 'Seller Partner Portal' : sellerStatus === 'pending' ? 'Seller Application Pending' : 'Apply to Become a Verified Seller'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sell your plants, organic crafts, and sustainable products directly to your local community.
          </p>
        </div>

        {/* State 1: Approved Seller */}
        {isApproved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <div>
              <h3 className="font-display font-bold text-lg text-emerald-950">You are an Approved Seller!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                Your account has full access to both Buyer features (Marketplace, Cart, Orders) and Seller features (Product Management, Inventory, Sales Analytics).
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate('/seller');
              }}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md"
            >
              <span>Go to Seller Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* State 2: Pending Application */}
        {!isApproved && sellerStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
            <Clock className="h-12 w-12 text-amber-600 mx-auto animate-pulse" />
            <div>
              <h3 className="font-display font-bold text-lg text-amber-950">Application Under Admin Review</h3>
              <p className="text-xs text-amber-800 mt-1">
                Thank you for applying! Your seller profile for <strong>"{user?.sellerProfile?.businessName || 'Your Business'}"</strong> is currently being verified by an administrator.
              </p>
            </div>
            <div className="bg-white/80 p-4 rounded-xl text-left border border-amber-200 space-y-2 text-xs">
              <span className="font-bold text-amber-900 block">Submitted Application Summary:</span>
              <div className="text-slate-600"><strong>Seller Type:</strong> {user?.sellerProfile?.sellerType || user?.sellerProfile?.category || 'Farmer'}</div>
              <div className="text-slate-600"><strong>Business Address:</strong> {user?.sellerProfile?.businessAddress || user?.address || 'Provided'}</div>
              <div className="text-slate-600">
                <strong>Location Verification:</strong>{' '}
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  user?.sellerProfile?.locationVerification?.status === 'Verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : user?.sellerProfile?.locationVerification?.status === 'Mismatch'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {user?.sellerProfile?.locationVerification?.status || 'Pending'}
                </span>
              </div>
              <div className="text-slate-600">
                <strong>Product Source:</strong> {user?.sellerProfile?.productSource?.sourceType || 'Own Farm'} &bull;{' '}
                <span className="font-bold text-amber-800">
                  {user?.sellerProfile?.productSource?.verificationStatus || 'Pending Review'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors"
            >
              Close Window
            </button>
          </div>
        )}

        {/* State 3: None or Rejected (Form Display) */}
        {!isApproved && sellerStatus !== 'pending' && (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {sellerStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start space-x-3 text-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Previous Application Not Approved</span>
                  <span className="text-[11px]">Your previous application was reviewed. Please correct your details below to re-submit for admin verification.</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl font-semibold">
                {successMsg}
              </div>
            )}

            {/* SECTION 1: BUSINESS & SELLER TYPE */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-900 border-b border-organic-100 pb-1 flex items-center space-x-1.5">
                <Store className="h-4 w-4 text-primary-600" />
                <span>1. Business & Farming Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modalBusinessName" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Business / Garden Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modalBusinessName"
                    type="text"
                    name="businessName"
                    required
                    placeholder="e.g. GreenHaven Nursery / Kovilpatti Organics"
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="modalSellerType" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Seller Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modalSellerType"
                    name="sellerType"
                    required
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500 font-semibold"
                    value={formData.sellerType}
                    onChange={handleChange}
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="SHG Member">SHG Member (Self Help Group)</option>
                    <option value="Nursery Owner">Nursery Owner</option>
                    <option value="Reseller">Reseller (Purchased from Farmers)</option>
                    <option value="Home Grower">Home Grower</option>
                    <option value="Artisan">Artisan / Eco Crafter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="modalDescription" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Business & Farming Description
                </label>
                <textarea
                  id="modalDescription"
                  name="description"
                  rows="2"
                  placeholder="Describe your cultivation methods, plant varieties, or local products..."
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modalUpiId" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    UPI ID (For Customer Payouts)
                  </label>
                  <input
                    id="modalUpiId"
                    type="text"
                    name="upiId"
                    placeholder="e.g. name@upi / 9876543210@paytm"
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                    value={formData.upiId}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="modalLicense" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    License / Registration (Optional)
                  </label>
                  <input
                    id="modalLicense"
                    type="text"
                    name="license"
                    placeholder="e.g. FSSAI / Nursery Reg No."
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                    value={formData.license}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: LOCATION VERIFICATION */}
            <div className="space-y-3 bg-organic-50/70 p-4 border border-organic-200 rounded-2xl">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>2. Address & Geographic Location Verification</span>
                </span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLoc}
                  className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all shadow-xs"
                >
                  <Navigation className="h-3 w-3" />
                  <span>{detectingLoc ? 'Detecting GPS...' : 'Detect GPS Location'}</span>
                </button>
              </h3>

              <div>
                <label htmlFor="modalBusinessAddress" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Registered Farm / Store Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="modalBusinessAddress"
                  type="text"
                  name="businessAddress"
                  required
                  placeholder="Street address, village / city, postal code..."
                  className="w-full bg-white border border-organic-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary-500"
                  value={formData.businessAddress}
                  onChange={handleChange}
                />
              </div>

              {locationVerificationMsg && (
                <div className="p-2.5 rounded-xl bg-white border border-organic-200 text-[11px] text-slate-700 font-medium">
                  {locationVerificationMsg}
                </div>
              )}
            </div>

            {/* SECTION 3: PRODUCT SOURCE & GENUINENESS DECLARATION */}
            <div className="space-y-3 bg-teal-50/60 p-4 border border-teal-200/80 rounded-2xl">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <FileCheck2 className="h-4 w-4 text-teal-700" />
                <span>3. Product Source & Genuineness Declaration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modalSourceType" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Primary Source Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modalSourceType"
                    name="sourceType"
                    required
                    className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold"
                    value={formData.sourceType}
                    onChange={handleChange}
                  >
                    <option value="Own Farm">Own Farm</option>
                    <option value="SHG Production">SHG Production (Self Help Group)</option>
                    <option value="Purchased from Farmer">Purchased from Farmer (Direct Sourcing)</option>
                    <option value="Authorized Supplier">Authorized Supplier</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modalSourceName" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Source Name / Group
                  </label>
                  <input
                    id="modalSourceName"
                    type="text"
                    name="sourceName"
                    placeholder="e.g. Village Organic Collective / Farm Name"
                    className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    value={formData.sourceName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modalSourceLocation" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Source Location / Region
                  </label>
                  <input
                    id="modalSourceLocation"
                    type="text"
                    name="sourceLocation"
                    placeholder="e.g. Sattur Rural Block / Western Ghats"
                    className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    value={formData.sourceLocation}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="modalSourceDescription" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Source Description
                  </label>
                  <input
                    id="modalSourceDescription"
                    type="text"
                    name="sourceDescription"
                    placeholder="Briefly describe procurement or farming method..."
                    className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    value={formData.sourceDescription}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Mandatory Declaration Checkbox */}
              <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-2">
                <label htmlFor="modalDeclarationAccepted" className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    id="modalDeclarationAccepted"
                    type="checkbox"
                    name="declarationAccepted"
                    required
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    checked={formData.declarationAccepted}
                    onChange={handleChange}
                  />
                  <span className="text-[11px] font-semibold text-slate-800 leading-snug">
                    "I confirm that the products listed by me are sourced from genuine farmers, my own farm, SHG production, or authorized suppliers."
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 pl-6">
                  Note: Declarations are subject to Admin Verification before a "Verified Seller" or "Source Verified" badge is displayed.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-organic-100 flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-organic-100 hover:bg-organic-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit Seller Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerApplicationModal;
