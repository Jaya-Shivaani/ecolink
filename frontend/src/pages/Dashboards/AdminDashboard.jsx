import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import {
  ShieldAlert, CheckCircle2, TrendingUp, Users, Award, ShoppingBag,
  Eye, EyeOff, Trash2, Edit2, BarChart2, Settings, Package,
  X, AlertCircle, Leaf, RefreshCw, Tag, ShieldCheck, Sparkles,
  Store, MapPin, Phone, Mail, Clock, Search, FileCheck2, MessageSquare,
  Percent, DollarSign, Star, AlertTriangle
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../../utils/productImages';

/* ─────────────────────────────── helpers ─────────────────────────────── */
const CATEGORIES = [
  'Decorative / Ornamental Plants',
  'Long-Term Yield Plants',
  'Short-Term Yield Plants',
  'Medicinal Plants',
  'Seeds',
  'Fertilizers & Manure',
  'Eco Products',
  'FMCG / Farm & Natural Products',
  'Indoor Plants',
  'Outdoor Plants',
  'Flowering Plants',
  'Fruit Plants',
  'Bonsai',
  'Pots',
  'Fertilizers',
  'Organic Compost',
  'Garden Tools',
  'Banana Fibre Bags',
  'Palm Leaf Products',
  'Coconut Coir Products',
  'Bamboo Crafts',
  'Jute Products',
];

const StatusBadge = ({ ok, trueLabel = 'Active', falseLabel = 'Disabled' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
    ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600'
  }`}>
    {ok ? trueLabel : falseLabel}
  </span>
);

const RoleBadge = ({ role }) => {
  const map = {
    admin:  'bg-purple-100 text-purple-800',
    seller: 'bg-blue-100 text-blue-800',
    buyer:  'bg-organic-100 text-slate-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${map[role] || ''}`}>
      {role}
    </span>
  );
};
/* ───────────────────────────────────────────────────────────────────────── */

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data
  const [analytics, setAnalytics]         = useState(null);
  const [users, setUsers]                 = useState([]);
  const [pendingSellers, setPendingSellers]= useState([]);
  const [allSellers, setAllSellers]       = useState([]);
  const [products, setProducts]           = useState([]);
  const [testimonials, setTestimonials]   = useState([]);
  const [testimonialCounts, setTestimonialCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading]             = useState(true);

  // UI state
  const [userSearch, setUserSearch]       = useState('');
  const [prodSearch, setProdSearch]       = useState('');
  const [sellerSearch, setSellerSearch]   = useState('');
  const [sellerFilter, setSellerFilter]   = useState('all'); // 'all', 'verified', 'pending', 'mismatch', 'shg', 'women'
  const [roleFilter, setRoleFilter]       = useState('all');
  const [testimonialFilter, setTestimonialFilter] = useState('Pending');

  // Dynamic Settings state
  const [settings, setSettings] = useState({
    shgCommissionPercentage: 5,
    locationRadiusKm: 25,
    platformName: 'EcoLink Hyperlocal Marketplace',
    contactEmail: 'support@ecolink.com',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Hash-based tab routing
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['dashboard', 'sellers', 'source-verification', 'shg', 'testimonials', 'users', 'products', 'categories', 'analytics', 'settings'];
    if (validTabs.includes(hash)) setActiveTab(hash);
  }, [location.hash]);

  /* ─── Fetch all admin data ─── */
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [resStats, resSellers, resProds, resUsers, resTestimonials, resSettings] = await Promise.all([
        axios.get('/api/admin/analytics'),
        axios.get('/api/admin/sellers/pending'),
        axios.get('/api/admin/products'),
        axios.get('/api/admin/users'),
        axios.get('/api/testimonials/admin'),
        axios.get('/api/admin/settings').catch(() => ({ data: { success: false } })),
      ]);

      if (resStats.data.success)   setAnalytics(resStats.data.analytics);
      if (resSellers.data.success) setPendingSellers(resSellers.data.sellers);
      if (resProds.data.success)   setProducts(resProds.data.products);
      if (resUsers.data.success)   setUsers(resUsers.data.users);
      if (resTestimonials.data.success) {
        setTestimonials(resTestimonials.data.testimonials || []);
        if (resTestimonials.data.counts) setTestimonialCounts(resTestimonials.data.counts);
      }
      if (resSettings.data?.success && resSettings.data.settings) {
        setSettings((prev) => ({ ...prev, ...resSettings.data.settings }));
      }

      // Fetch all sellers via dedicated API
      try {
        const resAllSellers = await axios.get('/api/admin/sellers');
        if (resAllSellers.data.success) {
          setAllSellers(resAllSellers.data.sellers);
        }
      } catch {
        const derived = (resUsers.data.users || []).filter(
          (u) => u.roles?.seller || u.role === 'seller' || u.sellerStatus === 'approved' || u.sellerStatus === 'pending'
        );
        setAllSellers(derived);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, []);

  /* ─── Actions ─── */
  const handleVerifySeller = async (id) => {
    try {
      const { data } = await axios.put(`/api/admin/sellers/${id}/verify`);
      if (data.success) { alert('Seller application approved!'); fetchAdminData(); }
    } catch { alert('Verification failed'); }
  };

  const handleRejectSeller = async (id) => {
    if (!window.confirm('Reject this seller application?')) return;
    try {
      const { data } = await axios.put(`/api/admin/sellers/${id}/reject`);
      if (data.success) { alert('Seller application rejected'); fetchAdminData(); }
    } catch { alert('Rejection failed'); }
  };

  const handleUpdateSellerStatus = async (id, updates) => {
    try {
      const { data } = await axios.put(`/api/admin/sellers/${id}/status`, updates);
      if (data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update seller');
    }
  };

  const handleVerifySellerSource = async (id, status, notes = '') => {
    try {
      const { data } = await axios.put(`/api/admin/sellers/${id}/verify-source`, {
        verificationStatus: status,
        adminNotes: notes,
      });
      if (data.success) {
        alert(`Product source marked as ${status}`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify source');
    }
  };

  const handleVerifySellerLocation = async (id, status) => {
    try {
      const { data } = await axios.put(`/api/admin/sellers/${id}/verify-location`, { status });
      if (data.success) {
        alert(`Location verification marked as ${status}`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update location');
    }
  };

  const handleModerateTestimonial = async (id, status, isFeatured = false) => {
    try {
      const { data } = await axios.put(`/api/testimonials/${id}/moderate`, { status, isFeatured });
      if (data.success) {
        alert(`Testimonial marked as ${status}`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to moderate testimonial');
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSettingsLoading(true);
    setSettingsSaved(false);
    try {
      const { data } = await axios.put('/api/admin/settings', {
        shgCommissionPercentage: Number(settings.shgCommissionPercentage),
        locationRadiusKm: Number(settings.locationRadiusKm),
      });
      if (data.success) {
        setSettingsSaved(true);
        fetchAdminData();
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleToggleProduct = async (id) => {
    try {
      const { data } = await axios.put(`/api/admin/products/${id}/approve`);
      if (data.success) { fetchAdminData(); }
    } catch { alert('Toggle failed'); }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      fetchAdminData();
    } catch { alert('Delete failed'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      fetchAdminData();
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleChangeRole = async (id, role) => {
    try {
      await axios.put(`/api/admin/users/${id}/role`, { role });
      fetchAdminData();
    } catch { alert('Role change failed'); }
  };

  /* ─── Derived / filtered lists ─── */
  const filteredUsers = users.filter((u) => {
    const matchRole  = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  const filteredSellers = allSellers.filter((s) => {
    const query = sellerSearch.toLowerCase().trim();
    const bName = (s.sellerProfile?.businessName || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const phone = (s.phoneNumber || '').toLowerCase();
    const cat = (s.sellerProfile?.category || '').toLowerCase();
    const sType = (s.sellerProfile?.sellerType || '').toLowerCase();
    const matchesSearch = !query || bName.includes(query) || name.includes(query) || email.includes(query) || phone.includes(query) || cat.includes(query) || sType.includes(query);

    if (sellerFilter === 'verified') {
      return matchesSearch && (s.sellerStatus === 'approved' || s.sellerProfile?.isVerified);
    }
    if (sellerFilter === 'pending') {
      return matchesSearch && s.sellerStatus === 'pending';
    }
    if (sellerFilter === 'mismatch') {
      return matchesSearch && s.sellerProfile?.locationVerification?.status === 'Mismatch';
    }
    if (sellerFilter === 'shg') {
      return matchesSearch && (s.sellerProfile?.isSHG || s.sellerProfile?.sellerType === 'SHG Member' || s.sellerProfile?.category === 'Self Help Group (SHG)');
    }
    if (sellerFilter === 'women') {
      return matchesSearch && s.sellerProfile?.isWomenEntrepreneur;
    }
    return matchesSearch;
  });

  const filteredProducts = products.filter((p) => {
    const q = prodSearch.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const sellerNameMatch = (p.seller?.name || '').toLowerCase().includes(q);
    const businessNameMatch = (p.seller?.sellerProfile?.businessName || '').toLowerCase().includes(q);
    const categoryMatch = (p.category || '').toLowerCase().includes(q);
    return nameMatch || sellerNameMatch || businessNameMatch || categoryMatch;
  });

  const filteredTestimonials = testimonials.filter((t) => {
    if (testimonialFilter === 'all') return true;
    return t.status === testimonialFilter;
  });

  const tabs = [
    { id: 'dashboard',  label: 'Dashboard Overview',  icon: BarChart2 },
    {
      id: 'sellers',
      label: `Seller Verification (${allSellers.length})`,
      icon: Store,
      badge: pendingSellers.length > 0 ? `${pendingSellers.length} pending` : null,
    },
    {
      id: 'source-verification',
      label: `Product Source (${analytics?.productSource?.pending || 0} pending)`,
      icon: FileCheck2,
      badge: analytics?.productSource?.pending > 0 ? `${analytics.productSource.pending} review` : null,
    },
    {
      id: 'shg',
      label: `SHG & Commission (${analytics?.shg?.shgSellersCount || 0})`,
      icon: Percent,
    },
    {
      id: 'testimonials',
      label: `Testimonials (${testimonialCounts.pending || 0} pending)`,
      icon: MessageSquare,
      badge: testimonialCounts.pending > 0 ? `${testimonialCounts.pending} new` : null,
    },
    { id: 'users',      label: `Users (${users.length})`,       icon: Users },
    { id: 'products',   label: `Products (${products.length})`, icon: Package },
    { id: 'categories', label: 'Categories',       icon: Tag },
    { id: 'analytics',  label: 'Analytics',        icon: TrendingUp },
    { id: 'settings',   label: 'Platform Settings',icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="space-y-1">
          <h1 className="font-display font-extrabold text-3xl text-primary-950 flex items-center space-x-2">
            <ShieldAlert className="h-7 w-7 text-primary-700" />
            <span>Platform Administrator Console</span>
          </h1>
          <p className="text-slate-500 text-sm">Manage users, sellers, location verification, product sources, SHG commission, and stories.</p>
        </div>
        <button onClick={fetchAdminData} className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-organic-200 px-4 py-2 rounded-xl transition-colors shadow-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Top Level Dynamic Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-organic-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Total Revenue</span>
            <span className="text-xl font-extrabold text-slate-900 block">₹{analytics.totalRevenue}</span>
            <span className="text-[10px] text-emerald-600 font-bold">{analytics.totalOrders} total orders</span>
          </div>
          <div className="bg-white border border-organic-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Pending Sellers</span>
            <span className="text-xl font-extrabold text-amber-600 block">{analytics.verification?.pending || 0}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting review</span>
          </div>
          <div className="bg-white border border-organic-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Location Mismatches</span>
            <span className="text-xl font-extrabold text-orange-600 block">{analytics.verification?.locationMismatch || 0}</span>
            <span className="text-[10px] text-orange-600 font-bold">Needs manual review</span>
          </div>
          <div className="bg-white border border-organic-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">SHG Commission</span>
            <span className="text-xl font-extrabold text-blue-700 block">₹{analytics.shg?.shgCommission || 0}</span>
            <span className="text-[10px] text-blue-600 font-bold">Rate: {settings.shgCommissionPercentage}%</span>
          </div>
          <div className="bg-white border border-organic-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Testimonials Pending</span>
            <span className="text-xl font-extrabold text-primary-800 block">{analytics.testimonials?.pending || 0}</span>
            <span className="text-[10px] text-primary-700 font-bold">Awaiting moderation</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-organic-200 space-x-1 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-1.5 px-4 py-3 font-semibold text-xs whitespace-nowrap rounded-t-xl transition-colors border-b-2 ${
              activeTab === id
                ? 'border-primary-600 text-primary-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {badge && (
              <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB 1: DASHBOARD OVERVIEW ═══════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Sustainability impact banner */}
          {analytics && (
            <div className="bg-gradient-to-tr from-emerald-950 via-primary-950 to-primary-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10">
                <span className="text-emerald-400 text-xxs uppercase font-bold tracking-widest block mb-2">Platform Sustainability Overview</span>
                <h2 className="font-display font-extrabold text-2xl mb-6">Hyperlocal Commerce & Empowerment Impact</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Plants Sold',       value: analytics.plantsSold },
                    { label: 'Plants Adopted',    value: analytics.plantsAdopted },
                    { label: 'Plants Exchanged',  value: analytics.plantsExchanged },
                    { label: 'Women Entrepreneurs', value: analytics.womenEntrepreneursSupported },
                    { label: 'SHG Groups Active', value: analytics.shgsActive },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 border border-white/10 p-4 rounded-2xl text-center space-y-1">
                      <span className="text-2xl font-extrabold text-emerald-300">{value}</span>
                      <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Verification Cards & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seller Verification Overview */}
            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-organic-100 pb-3">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Store className="h-4 w-4 text-primary-600" />
                  <span>Seller Verification Status</span>
                </h3>
                <button onClick={() => setActiveTab('sellers')} className="text-xxs font-bold text-primary-700 hover:underline">
                  Manage &rarr;
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="font-semibold text-amber-900">Pending Review</span>
                  <span className="font-extrabold text-amber-700">{analytics?.verification?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="font-semibold text-emerald-900">Verified Sellers</span>
                  <span className="font-extrabold text-emerald-700">{analytics?.verification?.verified || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-red-50 border border-red-100">
                  <span className="font-semibold text-red-900">Rejected Applications</span>
                  <span className="font-extrabold text-red-700">{analytics?.verification?.rejected || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="font-semibold text-orange-900">Location Mismatch (GPS)</span>
                  <span className="font-extrabold text-orange-700">{analytics?.verification?.locationMismatch || 0}</span>
                </div>
              </div>
            </div>

            {/* Product Source Verification Overview */}
            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-organic-100 pb-3">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <FileCheck2 className="h-4 w-4 text-teal-600" />
                  <span>Product Source Verification</span>
                </h3>
                <button onClick={() => setActiveTab('source-verification')} className="text-xxs font-bold text-teal-700 hover:underline">
                  Manage &rarr;
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="font-semibold text-amber-900">Pending Declarations</span>
                  <span className="font-extrabold text-amber-700">{analytics?.productSource?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-teal-50 border border-teal-100">
                  <span className="font-semibold text-teal-900">Verified Sources</span>
                  <span className="font-extrabold text-teal-700">{analytics?.productSource?.verified || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-red-50 border border-red-100">
                  <span className="font-semibold text-red-900">Needs More Info / Rejected</span>
                  <span className="font-extrabold text-red-700">{analytics?.productSource?.rejected || 0}</span>
                </div>
              </div>
            </div>

            {/* SHG Commission & Earnings Overview */}
            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-organic-100 pb-3">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Percent className="h-4 w-4 text-blue-600" />
                  <span>SHG Benefits & Commission</span>
                </h3>
                <button onClick={() => setActiveTab('shg')} className="text-xxs font-bold text-blue-700 hover:underline">
                  Configure &rarr;
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="font-semibold text-blue-900">Active SHG Sellers</span>
                  <span className="font-extrabold text-blue-700">{analytics?.shg?.shgSellersCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-organic-50 border border-organic-100">
                  <span className="font-semibold text-slate-700">Total SHG Sales</span>
                  <span className="font-extrabold text-slate-900">₹{analytics?.shg?.shgSales || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="font-semibold text-emerald-900">Net Seller Earnings</span>
                  <span className="font-extrabold text-emerald-700">₹{analytics?.shg?.shgSellerEarnings || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="font-semibold text-purple-900">Current Commission Rate</span>
                  <span className="font-extrabold text-purple-700">{settings.shgCommissionPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 2: SELLER VERIFICATION ═══════════════════ */}
      {activeTab === 'sellers' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center space-x-2">
                <Store className="h-6 w-6 text-primary-600" />
                <span>Seller Applications & Location Verification</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review applicant coordinates against GPS detections. Approve/Reject seller permissions and verify badges.
              </p>
            </div>

            <div className="relative flex-grow md:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="admin-seller-search"
                name="sellerSearch"
                type="text"
                placeholder="Search sellers by name, store, phone..."
                className="w-full text-xs bg-white border border-organic-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary-500 shadow-sm"
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1 border-b border-organic-200 pb-3">
            {[
              { id: 'all', label: `All Sellers (${allSellers.length})` },
              { id: 'verified', label: `Verified (${allSellers.filter((s) => s.sellerStatus === 'approved' || s.sellerProfile?.isVerified).length})` },
              { id: 'pending', label: `Pending Review (${pendingSellers.length})`, countBadge: pendingSellers.length },
              { id: 'mismatch', label: `Location Mismatch (${allSellers.filter((s) => s.sellerProfile?.locationVerification?.status === 'Mismatch').length})` },
              { id: 'shg', label: `SHG Groups (${allSellers.filter((s) => s.sellerProfile?.isSHG).length})` },
              { id: 'women', label: `Women Entrepreneurs (${allSellers.filter((s) => s.sellerProfile?.isWomenEntrepreneur).length})` },
            ].map(({ id, label, countBadge }) => (
              <button
                key={id}
                onClick={() => setSellerFilter(id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  sellerFilter === id
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'bg-white border border-organic-200 text-slate-600 hover:bg-organic-50'
                }`}
              >
                <span>{label}</span>
                {countBadge > 0 && sellerFilter !== id && (
                  <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {countBadge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Seller Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSellers.map((s) => {
              const isApproved = s.sellerStatus === 'approved' || s.sellerProfile?.isVerified;
              const isPending = s.sellerStatus === 'pending';
              const loc = s.sellerProfile?.locationVerification;

              return (
                <div key={s._id} className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-800 to-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-xs">
                          {(s.sellerProfile?.businessName || s.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                            {s.sellerProfile?.businessName || s.name}
                          </h3>
                          <div className="text-xs text-slate-500">
                            Owner: <strong className="text-slate-700">{s.name}</strong> &bull; Type: <span className="font-semibold text-emerald-800">{s.sellerProfile?.sellerType || s.sellerProfile?.category || 'Farmer'}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {isApproved ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
                      </span>
                    </div>

                    {/* Location Verification Status Box */}
                    <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      loc?.status === 'Verified'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : loc?.status === 'Mismatch'
                        ? 'bg-orange-50 border-orange-200 text-orange-900'
                        : 'bg-organic-50 border-organic-200 text-slate-700'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Location Verification Status:</span>
                        </span>
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded font-extrabold bg-white border">
                          {loc?.status || 'Pending'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>Address: {s.sellerProfile?.businessAddress || s.address || 'Provided'}</div>
                        {loc?.distanceKm != null && loc.distanceKm > 0 && (
                          <div>Distance from Registered: <strong>{loc.distanceKm.toFixed(1)} km</strong></div>
                        )}
                      </div>
                      {loc?.status === 'Mismatch' && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-orange-700 font-semibold flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3 text-orange-600" />
                            <span>GPS location exceeds threshold radius.</span>
                          </span>
                          <button
                            onClick={() => handleVerifySellerLocation(s._id, 'Verified')}
                            className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Force Approve Location
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-organic-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleUpdateSellerStatus(s._id, { isSHG: !s.sellerProfile?.isSHG })}
                        className={`text-xxs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                          s.sellerProfile?.isSHG ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        SHG: {s.sellerProfile?.isSHG ? 'Yes' : 'No'}
                      </button>
                      <button
                        onClick={() => handleUpdateSellerStatus(s._id, { isWomenEntrepreneur: !s.sellerProfile?.isWomenEntrepreneur })}
                        className={`text-xxs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                          s.sellerProfile?.isWomenEntrepreneur ? 'bg-pink-100 text-pink-800 border-pink-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        Women Owned: {s.sellerProfile?.isWomenEntrepreneur ? 'Yes' : 'No'}
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleVerifySeller(s._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectSeller(s._id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateSellerStatus(s._id, { isVerified: !s.sellerProfile?.isVerified })}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                            s.sellerProfile?.isVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {s.sellerProfile?.isVerified ? 'Revoke Verification' : 'Verify Seller'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 3: PRODUCT SOURCE VERIFICATION ═══════════════════ */}
      {activeTab === 'source-verification' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center space-x-2">
                <FileCheck2 className="h-6 w-6 text-teal-600" />
                <span>Product Source Declarations & Genuineness</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Moderate supplier declarations. Once verified, sellers and products receive the official "Source Verified" badge.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allSellers.filter((s) => s.sellerProfile?.productSource?.declarationAccepted || s.sellerProfile?.productSource?.sourceType).map((s) => {
              const src = s.sellerProfile?.productSource;
              const status = src?.verificationStatus || 'Pending';

              return (
                <div key={s._id} className="bg-white border border-teal-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-base text-slate-900">
                          {s.sellerProfile?.businessName || s.name}
                        </h3>
                        <span className="text-xs text-slate-500">{s.email}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase ${
                        status === 'Verified' ? 'bg-teal-100 text-teal-800' : status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-1 text-xs">
                      <div><strong>Source Type:</strong> {src?.sourceType || 'Own Farm'}</div>
                      <div><strong>Source Name:</strong> {src?.sourceName || 'Not specified'}</div>
                      <div><strong>Source Location:</strong> {src?.sourceLocation || 'Not specified'}</div>
                      {src?.description && <div className="italic text-slate-600 mt-1">"{src.description}"</div>}
                    </div>
                  </div>

                  <div className="border-t border-organic-100 pt-3 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleVerifySellerSource(s._id, 'Verified')}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Source</span>
                    </button>
                    <button
                      onClick={() => handleVerifySellerSource(s._id, 'Rejected', 'Insufficient verification evidence')}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 4: SHG & COMMISSION CONFIGURATION ═══════════════════ */}
      {activeTab === 'shg' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center space-x-2">
                <Percent className="h-6 w-6 text-blue-600" />
                <span>Self Help Group (SHG) Benefits & Commission System</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure commission rates dynamically. Orders store immutable commission snapshots in MongoDB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Metrics */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-blue-200 p-5 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] text-blue-800 uppercase font-bold tracking-wider block">SHG Sellers</span>
                <span className="text-3xl font-extrabold text-blue-900 block">{analytics?.shg?.shgSellersCount || 0}</span>
                <span className="text-[10px] text-slate-500">Registered collectives</span>
              </div>
              <div className="bg-white border border-blue-200 p-5 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total SHG Sales</span>
                <span className="text-3xl font-extrabold text-slate-900 block">₹{analytics?.shg?.shgSales || 0}</span>
                <span className="text-[10px] text-slate-500">Completed deliveries</span>
              </div>
              <div className="bg-white border border-emerald-200 p-5 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Seller Earnings</span>
                <span className="text-3xl font-extrabold text-emerald-700 block">₹{analytics?.shg?.shgSellerEarnings || 0}</span>
                <span className="text-[10px] text-emerald-600">Disbursed to SHGs</span>
              </div>
            </div>

            {/* Dynamic Rate Form */}
            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-base border-b border-organic-100 pb-2">
                Configure Commission Rate
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="admin-shg-comm-rate" className="block font-bold text-slate-700 mb-1">SHG Commission Percentage (%)</label>
                  <div className="relative">
                    <input
                      id="admin-shg-comm-rate"
                      name="shgCommissionPercentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      className="w-full p-3 rounded-xl border border-organic-200 bg-[#FAF9F5] text-sm font-extrabold text-slate-900"
                      value={settings.shgCommissionPercentage}
                      onChange={(e) => setSettings({ ...settings, shgCommissionPercentage: e.target.value })}
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                  Example calculation: A product sold for ₹500 with a {settings.shgCommissionPercentage}% commission generates <strong>₹{(500 * Number(settings.shgCommissionPercentage) / 100).toFixed(0)}</strong> commission and <strong>₹{(500 - (500 * Number(settings.shgCommissionPercentage) / 100)).toFixed(0)}</strong> seller earnings.
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {settingsLoading ? 'Saving Rate...' : 'Update Commission Rate in Database'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 5: TESTIMONIALS MODERATION ═══════════════════ */}
      {activeTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-primary-600" />
                <span>Community Stories & Testimonials Moderation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review, approve, or reject participant feedback before public display on the Home page.
              </p>
            </div>
          </div>

          {/* Testimonial Filter Tabs */}
          <div className="flex space-x-2 border-b border-organic-200 pb-3">
            {[
              { id: 'Pending', label: `Pending Review (${testimonialCounts.pending || 0})` },
              { id: 'Approved', label: `Approved Public (${testimonialCounts.approved || 0})` },
              { id: 'Rejected', label: `Rejected (${testimonialCounts.rejected || 0})` },
              { id: 'all', label: `All (${testimonialCounts.total || 0})` },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTestimonialFilter(id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  testimonialFilter === id
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-white border border-organic-200 text-slate-600 hover:bg-organic-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTestimonials.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white border border-organic-200 rounded-3xl text-slate-400 text-xs">
                No testimonials in this category.
              </div>
            ) : (
              filteredTestimonials.map((t) => (
                <div key={t._id} className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                        <span className="text-xs text-primary-700 font-semibold block">{t.role}</span>
                        <span className="text-[10px] text-slate-400 block">{t.testimonialType}</span>
                      </div>
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-organic-50/70 p-3 rounded-xl border border-organic-100">
                      "{t.comment}"
                    </p>
                  </div>

                  <div className="border-t border-organic-100 pt-3 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      t.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : t.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleModerateTestimonial(t._id, 'Approved', true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                      >
                        Approve & Feature
                      </button>
                      <button
                        onClick={() => handleModerateTestimonial(t._id, 'Rejected')}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 6: USERS ═══════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h2 className="font-display font-bold text-xl text-slate-900">All Platform Users</h2>
            <div className="flex space-x-2 w-full sm:w-auto">
              <input
                id="admin-user-search"
                name="userSearch"
                type="text"
                placeholder="Search by name or email…"
                className="flex-grow sm:w-64 text-xs bg-white border border-organic-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-400"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <select
                id="admin-role-filter"
                name="roleFilter"
                className="text-xs bg-white border border-organic-200 rounded-xl px-3 py-2.5 focus:outline-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-organic-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-organic-50 border-b border-organic-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Change Role</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-organic-100 text-slate-700 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-organic-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 text-slate-500">{u.email}</td>
                      <td className="p-4 text-slate-500">{u.phoneNumber || '—'}</td>
                      <td className="p-4"><RoleBadge role={u.role} /></td>
                      <td className="p-4 text-center">
                        <select
                          id={`admin-role-select-${u._id}`}
                          name={`role_${u._id}`}
                          className="text-xxs bg-organic-50 border border-organic-200 rounded-lg px-2 py-1 focus:outline-none"
                          value={u.role}
                          onChange={(e) => handleChangeRole(u._id, e.target.value)}
                          disabled={u.role === 'admin'}
                        >
                          <option value="buyer">buyer</option>
                          <option value="seller">seller</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 7: PRODUCTS ═══════════════════ */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h2 className="font-display font-bold text-xl text-slate-900">All Product Listings ({products.length})</h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="admin-prod-search"
                name="prodSearch"
                type="text"
                placeholder="Search by product, seller, or category…"
                className="w-full text-xs bg-white border border-organic-200 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-primary-500 shadow-sm"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border border-organic-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-organic-50 border-b border-organic-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Seller</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-organic-100 text-slate-700 font-medium">
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-organic-50/50 transition-colors">
                      <td className="p-4 flex items-center space-x-3">
                        <img
                          src={getProductImage(p)}
                          onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-organic-100 flex-shrink-0"
                        />
                        <span className="font-bold text-slate-900 truncate max-w-[160px]">{p.name}</span>
                      </td>
                      <td className="p-4 text-slate-600">{p.seller?.sellerProfile?.businessName || p.seller?.name || '—'}</td>
                      <td className="p-4 text-slate-500">{p.category}</td>
                      <td className="p-4 font-bold text-slate-900">₹{p.price}</td>
                      <td className="p-4">{p.stock} units</td>
                      <td className="p-4 text-center">
                        <StatusBadge ok={p.isApproved} trueLabel="Live" falseLabel="Hidden" />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleToggleProduct(p._id)}
                            className={`p-2 rounded-xl transition-all ${p.isApproved ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-primary-600 hover:text-primary-800 hover:bg-primary-50'}`}
                            title={p.isApproved ? 'Hide listing' : 'Approve listing'}
                          >
                            {p.isApproved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 8: CATEGORIES ═══════════════════ */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-xl text-slate-900">Product Categories</h2>
            <span className="text-xs text-slate-500">{CATEGORIES.length} categories active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-slate-900 text-base border-b border-organic-100 pb-3">All Categories</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-organic-50 border border-organic-100 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-800 text-xs">{cat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 9: ANALYTICS ═══════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <h2 className="font-display font-bold text-xl text-slate-900">Platform-Wide Analytics</h2>
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Platform Revenue</span>
                <div className="text-3xl font-extrabold text-emerald-600">₹{analytics.totalRevenue}</div>
              </div>
              <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Orders Fulfilled</span>
                <div className="text-3xl font-extrabold text-primary-800">{analytics.totalOrders}</div>
              </div>
              <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">SHG Total Sales</span>
                <div className="text-3xl font-extrabold text-blue-600">₹{analytics.shg?.shgSales || 0}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB 10: SETTINGS ═══════════════════ */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <h2 className="font-display font-bold text-xl text-slate-900">Platform Settings</h2>

          {settingsSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl">
              ✓ Settings saved successfully to MongoDB.
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="bg-white border border-organic-200 rounded-3xl p-8 shadow-sm space-y-6 text-xs">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-sm border-b border-organic-100 pb-2">Dynamic Configuration</h3>
              <div>
                <label htmlFor="admin-settings-shg-rate" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">SHG Commission Percentage (%)</label>
                <input
                  id="admin-settings-shg-rate"
                  name="shgCommissionPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  value={settings.shgCommissionPercentage}
                  onChange={(e) => setSettings({ ...settings, shgCommissionPercentage: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="admin-settings-radius" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Location Verification Radius (km)</label>
                <input
                  id="admin-settings-radius"
                  name="locationRadiusKm"
                  type="number"
                  min="1"
                  max="200"
                  required
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  value={settings.locationRadiusKm}
                  onChange={(e) => setSettings({ ...settings, locationRadiusKm: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-organic-100">
              <button
                type="submit"
                disabled={settingsLoading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Save Settings to Database'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
