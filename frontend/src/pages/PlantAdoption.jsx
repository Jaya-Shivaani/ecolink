import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';
import ImageUploadField from '../components/ImageUploadField';
import { AuthContext } from '../context/AuthContext';
import {
  Gift,
  MapPin,
  AlertCircle,
  Heart,
  PlusCircle,
  Check,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  Flame,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  Plus,
  Trash2,
  Bell,
  Phone,
  Mail,
  MessageSquare,
  Truck,
  Package,
} from 'lucide-react';

const PlantAdoption = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('active'); // 'active', 'expiringSoon', 'completed', 'all'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition: 'Healthy',
    image: '',
    validityDays: 30,
    isUrgent: false,
    deliveryOption: 'Pickup Only',
    deliveryCharge: 0,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchListings = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const { data } = await axios.get('/api/community/plants?type=Adoption');
      if (data.success) {
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error fetching adoption listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(true);
  }, []);

  const handleRequest = async (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const currentUid = user._id || user.id;
    // Optimistic UI update: instantly update local state in 0ms!
    setListings((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              interestedUsers: [
                ...(item.interestedUsers || []),
                { _id: currentUid, name: user.name, phoneNumber: user.phoneNumber, email: user.email },
              ],
            }
          : item
      )
    );

    try {
      setActionLoadingId(id);
      const { data } = await axios.put(`/api/community/plants/${id}/request`);
      if (data.success && data.listing) {
        setListings((prev) => prev.map((item) => (item._id === id ? data.listing : item)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request plant');
      fetchListings();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id) => {
    // Optimistic UI complete
    setListings((prev) =>
      prev.map((item) => (item._id === id ? { ...item, status: 'Completed' } : item))
    );
    try {
      setActionLoadingId(id);
      const { data } = await axios.put(`/api/community/plants/${id}/complete`);
      if (data.success && data.listing) {
        setListings((prev) => prev.map((item) => (item._id === id ? data.listing : item)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete listing');
      fetchListings();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExtendValidity = async (id, days = 15) => {
    try {
      setActionLoadingId(id);
      const { data } = await axios.put(`/api/community/plants/${id}/extend`, { days });
      if (data.success && data.listing) {
        setListings((prev) => prev.map((item) => (item._id === id ? data.listing : item)));
      } else {
        fetchListings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend listing validity');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this plant listing? This action cannot be undone.')) return;
    // Optimistic remove
    setListings((prev) => prev.filter((item) => item._id !== id));
    try {
      setActionLoadingId(id);
      await axios.delete(`/api/community/plants/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove listing');
      fetchListings();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      ...formData,
      type: 'Adoption',
      validityDays: parseInt(formData.validityDays, 10) || 30,
      image: formData.image || '/assets/products/product-placeholder.svg',
    };

    try {
      const { data } = await axios.post('/api/community/plants', payload);
      if (data.success) {
        setSuccessMsg('Plant listing posted for adoption!');
        setFormData({
          name: '',
          description: '',
          condition: 'Healthy',
          image: '',
          validityDays: 30,
          isUrgent: false,
          deliveryOption: 'Pickup Only',
          deliveryCharge: 0,
        });
        setModalOpen(false);
        fetchListings();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create listing');
    }
  };

  // Helper: Dynamic status badge based on actual listing status from MongoDB
  const getValidityInfo = (item) => {
    // Completed / Adopted
    if (item.status === 'Completed') {
      return { status: 'completed', text: '🏠 Adopted', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }

    // Reserved (someone is finalizing adoption)
    if (item.status === 'Reserved') {
      return { status: 'reserved', text: '🔒 Reserved', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    }

    // Expired
    if (item.status === 'Expired') {
      const expiry = item.validUntil ? new Date(item.validUntil) : null;
      return {
        status: 'expired',
        text: expiry ? `Expired on ${expiry.toLocaleDateString()}` : 'Unavailable',
        color: 'bg-red-50 text-red-700 border-red-200',
        daysLeft: 0,
      };
    }

    // Available — check validity window
    if (!item.validUntil) {
      return { status: 'active', text: '🟢 Available for Adoption', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', daysLeft: 30 };
    }

    const now = new Date();
    const expiry = new Date(item.validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return {
        status: 'expired',
        text: `Expired on ${expiry.toLocaleDateString()}`,
        color: 'bg-red-50 text-red-700 border-red-200',
        daysLeft: 0,
      };
    }
    if (daysLeft <= 3) {
      return {
        status: 'expiring',
        text: `⏳ Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
        color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse',
        daysLeft,
      };
    }
    return {
      status: 'active',
      text: `🟢 Available for Adoption · ${daysLeft}d left`,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      daysLeft,
    };
  };

  // Filter listings based on active tab
  const filteredListings = listings.filter((item) => {
    const validity = getValidityInfo(item);
    if (filterTab === 'active') {
      return item.status === 'Available' && validity.status !== 'expired';
    }
    if (filterTab === 'expiringSoon') {
      return item.status === 'Available' && (validity.status === 'expiring' || item.isUrgent);
    }
    if (filterTab === 'completed') {
      return item.status === 'Completed';
    }
    return true; // 'all'
  });

  return (
    <div className="bg-[#FBFBFA] min-h-screen pb-20 space-y-8">
      {/* Top Hub Navigation Bar */}
      <div className="bg-white border-b border-organic-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/adoption"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm"
            >
              <Gift className="h-4 w-4" />
              <span>Plant Adoption Hub</span>
            </Link>
            <Link
              to="/exchange"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-organic-100 hover:bg-organic-200 text-slate-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Plant Exchange & Swaps Hub</span>
            </Link>
          </div>

          <button
            onClick={() => {
              if (!user) {
                navigate('/login');
              } else {
                setModalOpen(true);
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Donate a Plant for Free Adoption</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          {/* Decorative background ambient glows */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -top-12 w-48 h-48 bg-teal-300/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 bg-white/20 border border-white/30 text-white text-xxs uppercase font-extrabold px-3 py-1 rounded-full backdrop-blur-xs shadow-xs">
              <Gift className="h-3.5 w-3.5 mr-1" /> 100% Free Community Plant Adoption
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
              Give a Plant a Loving Home
            </h1>
            <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed font-medium">
              Every customer and plant lover can list surplus plants for free donation or adopt rooted saplings from neighbours with transparent listing validity periods.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-organic-200 pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'active', label: '🌿 Active & Valid' },
              { key: 'expiringSoon', label: '⏳ Urgent / Expiring Soon' },
              { key: 'completed', label: '✅ Adopted (Completed)' },
              { key: 'all', label: '📋 All Listings' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === tab.key
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'bg-white border border-organic-200 text-slate-600 hover:bg-organic-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'}
          </span>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-20 font-semibold animate-pulse text-slate-500">
            <RefreshCw className="h-7 w-7 animate-spin mx-auto text-primary-600 mb-2" />
            Loading plant donation board...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-white border border-organic-200 rounded-3xl space-y-3">
            <Gift className="h-10 w-10 text-organic-300 mx-auto" />
            <p className="font-display font-bold text-slate-700 text-base">No plant listings found in this category.</p>
            <p className="text-xs text-slate-400">Be the first to list a plant donation for your neighborhood!</p>
            <button
              onClick={() => {
                if (!user) navigate('/login');
                else setModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 bg-primary-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>List Plant Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const validity = getValidityInfo(item);
              const currentUserId = user?._id || user?.id;
              const isOwner = currentUserId && (typeof item.user === 'string' ? item.user : item.user?._id) === currentUserId;
              const isExpired = validity.status === 'expired';
              const isCompleted = item.status === 'Completed';
              const isReserved = item.status === 'Reserved';
              const hasRequested = Boolean(
                currentUserId &&
                item.interestedUsers?.some(
                  (u) => (typeof u === 'object' ? u._id?.toString() : u?.toString()) === currentUserId.toString()
                )
              );

              return (
                <div
                  key={item._id}
                  className={`bg-white border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    isCompleted
                      ? 'opacity-65 border-organic-200'
                      : isReserved
                      ? 'opacity-80 border-amber-200'
                      : isExpired
                      ? 'border-red-200'
                      : 'border-organic-200'
                  }`}
                >
                  <div>
                    {/* Image & Top Badges */}
                    <div className="relative aspect-[4/3] bg-organic-50 overflow-hidden">
                      <img
                        src={getProductImage(item)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = PRODUCT_PLACEHOLDER;
                        }}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 bg-emerald-800 text-emerald-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        Free Adoption
                      </span>

                      {item.isUrgent && !isCompleted && (
                        <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1">
                          <Flame className="h-3 w-3 inline" />
                          <span>Urgent</span>
                        </span>
                      )}

                      {isCompleted && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-emerald-600 text-white font-display font-extrabold text-sm px-4 py-2 rounded-xl shadow-lg">
                            ADOPTED
                          </span>
                        </div>
                      )}

                      {isReserved && !isCompleted && (
                        <div className="absolute inset-0 bg-amber-950/40 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-amber-500 text-white font-display font-extrabold text-sm px-4 py-2 rounded-xl shadow-lg">
                            RESERVED
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      {/* Validity Badge */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border ${validity.color}`}>
                          <Clock className="h-3 w-3 mr-0.5" />
                          <span>{validity.text}</span>
                        </span>
                        <span className="text-slate-400 font-medium">
                          Condition: <strong className="text-slate-700">{item.condition}</strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-slate-900 text-lg">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 text-xxs text-slate-400 flex items-center justify-between">
                        <span>Donated by: <strong className="text-slate-700">{item.user?.name || 'Community Member'}</strong></span>
                        <span className="flex items-center text-slate-500">
                          <MapPin className="h-3 w-3 text-primary-600 mr-0.5" />
                          {item.user?.address ? item.user.address.split(',').pop().trim() : 'Local Area'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-5 border-t border-organic-100 bg-organic-50/40 flex flex-col gap-2">
                    {isCompleted ? (
                      <div className="text-center py-1 text-xs text-emerald-700 font-bold">
                        Plant successfully found a new home!
                      </div>
                    ) : isOwner ? (
                      <div className="space-y-2.5">
                        {/* Real-time Requesters Notification Box */}
                        {item.interestedUsers && item.interestedUsers.length > 0 && (
                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-900">
                                <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                                <span>Adoption Requests ({item.interestedUsers.length})</span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full">
                                Active Buyer Requests
                              </span>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                              {item.interestedUsers.map((requester, reqIdx) => {
                                const reqObj = typeof requester === 'object' ? requester : { _id: requester, name: 'Interested Adopter' };
                                return (
                                  <div key={reqObj._id || reqIdx} className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between font-bold text-slate-800">
                                      <span>{reqObj.name || 'Community Member'}</span>
                                      {reqObj.phoneNumber && (
                                        <span className="text-[11px] text-slate-500 font-normal">{reqObj.phoneNumber}</span>
                                      )}
                                    </div>
                                    {reqObj.email && (
                                      <p className="text-xxs text-slate-500 truncate">{reqObj.email}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 pt-1">
                                      {reqObj.phoneNumber && (
                                        <>
                                          <a
                                            href={`tel:${reqObj.phoneNumber}`}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-xxs font-bold text-center flex items-center justify-center space-x-1 transition-all"
                                          >
                                            <Phone className="w-2.5 h-2.5" />
                                            <span>Call</span>
                                          </a>
                                          <a
                                            href={`https://wa.me/${reqObj.phoneNumber.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-1.5 px-2 rounded-lg text-xxs font-bold text-center flex items-center justify-center space-x-1 transition-all"
                                          >
                                            <MessageSquare className="w-2.5 h-2.5" />
                                            <span>WhatsApp</span>
                                          </a>
                                        </>
                                      )}
                                      {reqObj.email && (
                                        <a
                                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(reqObj.email)}&su=${encodeURIComponent(`Regarding your EcoLink plant request: ${item.name}`)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-2 rounded-lg text-xxs font-bold text-center flex items-center justify-center space-x-1 truncate transition-all cursor-pointer"
                                        >
                                          <Mail className="w-2.5 h-2.5" />
                                          <span className="truncate">Email</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <button
                            disabled={actionLoadingId === item._id}
                            onClick={() => handleComplete(item._id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark Adopted</span>
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            disabled={actionLoadingId === item._id}
                            onClick={() => handleExtendValidity(item._id, 15)}
                            className="flex-1 bg-white hover:bg-organic-100 text-slate-700 border border-organic-200 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all"
                          >
                            +15 Days Validity
                          </button>
                          <button
                            disabled={actionLoadingId === item._id}
                            onClick={() => handleExtendValidity(item._id, 30)}
                            className="flex-1 bg-white hover:bg-organic-100 text-slate-700 border border-organic-200 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all"
                          >
                            +30 Days Validity
                          </button>
                        </div>
                        <button
                          disabled={actionLoadingId === item._id}
                          onClick={() => handleDelete(item._id)}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove Listing</span>
                        </button>
                      </div>
                    ) : isExpired ? (
                      <div className="text-center py-2 text-xs text-red-600 font-semibold bg-red-50 rounded-xl border border-red-100">
                        Listing expired. Awaiting owner renewal.
                      </div>
                    ) : isReserved ? (
                      <div className="text-center py-2 text-xs text-amber-700 font-semibold bg-amber-50 rounded-xl border border-amber-200">
                        🔒 This plant is currently reserved for adoption.
                      </div>
                    ) : hasRequested ? (
                      <button
                        disabled
                        className="w-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-default shadow-2xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Requested (Adoption Interest Sent)</span>
                      </button>
                    ) : (
                      <button
                        disabled={actionLoadingId === item._id}
                        onClick={() => handleRequest(item._id)}
                        className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-1 shadow-sm"
                      >
                        <span>Request to Adopt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-organic-200 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <div>
                <h2 className="font-display font-extrabold text-lg text-slate-900">List Plant for Free Adoption</h2>
                <p className="text-xs text-slate-400">Available to all customers and growers</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-1">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="adoptionPlantName" className="block text-xs font-semibold text-slate-700 mb-1">
                  Plant Name *
                </label>
                <input
                  id="adoptionPlantName"
                  name="name"
                  type="text"
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500"
                  placeholder="E.g., Flowering Anthurium Sapling"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="adoptionDescription" className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Care Guidelines *
                </label>
                <textarea
                  id="adoptionDescription"
                  name="description"
                  required
                  rows="3"
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500"
                  placeholder="Explain why you are donating, water levels needed, and soil details."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adoptionCondition" className="block text-xs font-semibold text-slate-700 mb-1">
                    Plant Condition
                  </label>
                  <select
                    id="adoptionCondition"
                    name="condition"
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200 bg-white"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <option value="Healthy">Healthy & Thriving</option>
                    <option value="Good">Good / Rooted Cutting</option>
                    <option value="Needs Care">Needs Soil Care</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="adoptionValidity" className="block text-xs font-semibold text-slate-700 mb-1">
                    Listing Validity Period
                  </label>
                  <select
                    id="adoptionValidity"
                    name="validityDays"
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200 bg-white font-semibold text-primary-800"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                  >
                    <option value={7}>7 Days (Quick Adoption)</option>
                    <option value={14}>14 Days (2 Weeks)</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={60}>60 Days (2 Months)</option>
                    <option value={90}>90 Days (3 Months)</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadField
                  id="adoptionImage"
                  label="Plant Photo / Image (Optional)"
                  placeholder="Paste URL or choose file from device..."
                  value={formData.image}
                  onChange={(imgUrl) => setFormData({ ...formData, image: imgUrl })}
                  helperText="Add a clear photo of your plant so adopters can see its health & size"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="adoptionUrgent"
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="rounded border-organic-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="adoptionUrgent" className="text-xs text-slate-700 font-medium">
                  Mark as Urgent Adoption (e.g. Relocating, Overgrown sapling)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all"
              >
                Publish Adoption Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantAdoption;
