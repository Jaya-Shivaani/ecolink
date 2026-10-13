import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import {
  PlusCircle,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Inbox,
  Trash2,
  Edit2,
  AlertCircle,
  Package,
  CheckCircle2,
  Navigation,
  RefreshCw,
  BarChart2,
  DollarSign,
  MapPin,
  FileCheck2,
  Percent,
  Calendar,
  Store,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../../utils/productImages';
import { formatExpectedDate, getOrderExpectedDelivery, getOrderDeliveredDate } from '../../utils/dateUtils';
import ImageUploadField from '../../components/ImageUploadField';

const CATEGORY_LIST = [
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

const SellerDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  // Tab State: 'inventory' | 'orders' | 'analytics' | 'profile'
  const [activeTab, setActiveTab] = useState('inventory');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Product Form state (Add / Edit)
  const defaultProdForm = {
    name: '',
    description: '',
    price: '',
    stock: 10,
    category: 'Decorative / Ornamental Plants',
    yieldType: '',
    image: '',
    waterRequirement: 'Medium',
    sunlightRequirement: 'Full Sun',
    difficultyLevel: 'Easy',
    indoorOutdoor: 'Indoor',
    petFriendly: false,
    isEcoFriendly: true,
    // Source verification details
    sourceType: 'Own Farm',
    sourceName: '',
    sourceLocation: '',
    sourceDescription: '',
    declarationAccepted: true,
  };
  const [prodForm, setProdForm] = useState(defaultProdForm);
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Seller Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    businessName: user?.sellerProfile?.businessName || '',
    sellerCategory: user?.sellerProfile?.category || 'Home Garden Owner',
    sellerType: user?.sellerProfile?.sellerType || 'Farmer',
    story: user?.sellerProfile?.story || '',
    isSHG: !!user?.sellerProfile?.isSHG,
    isWomenEntrepreneur: !!user?.sellerProfile?.isWomenEntrepreneur,
    latitude: user?.location?.coordinates?.[1] || 9.1700,
    longitude: user?.location?.coordinates?.[0] || 77.8700,
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Analytics calculation
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    completedOrders: 0,
    plantsDispatched: 0,
    avgOrderValue: 0,
    statusCounts: { Placed: 0, Processing: 0, Dispatched: 0, Delivered: 0 },
    // SHG Specific Benefit Tracking
    shgSales: 0,
    shgCommission: 0,
    shgNetEarnings: 0,
  });

  const isSHGSeller = !!(
    user?.sellerProfile?.isSHG ||
    user?.sellerProfile?.category === 'Self Help Group (SHG)' ||
    user?.sellerProfile?.sellerType === 'SHG Member'
  );

  // Handle URL hash navigation (#profile, #orders, #settings)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'profile' || hash === 'settings') setActiveTab('profile');
    else if (hash === 'orders') setActiveTab('orders');
    else if (hash === 'inventory') setActiveTab('inventory');
    else if (hash === 'analytics') setActiveTab('analytics');
  }, [location.hash]);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      const resOrders = await axios.get('/api/orders/sellerorders');
      const resProducts = await axios.get('/api/products');
      const resProfile = await axios.get('/api/auth/profile');

      if (resOrders.data.success && resProducts.data.success) {
        const fetchedOrders = resOrders.data.orders;
        setOrders(fetchedOrders);

        // Filter products owned by this seller
        const myProds = resProducts.data.products.filter(
          (p) => (p.seller?._id || p.seller)?.toString() === (user?._id || '').toString()
        );
        setProducts(myProds);

        // Compute general analytics & SHG metrics
        const completed = fetchedOrders.filter((o) => o.status === 'Delivered');
        const sales = completed.reduce((acc, curr) => acc + curr.totalPrice, 0);

        let plantsCount = 0;
        let totalSHGCommission = 0;
        let totalSHGEarnings = 0;
        let totalSHGSales = 0;

        completed.forEach((o) => {
          o.orderItems.forEach((item) => {
            plantsCount += item.qty;
          });
          if (o.isSHGOrder) {
            totalSHGSales += o.totalPrice || 0;
            totalSHGCommission += o.commissionAmount || 0;
            totalSHGEarnings += o.sellerEarnings != null ? o.sellerEarnings : ((o.totalPrice || 0) - (o.commissionAmount || 0));
          }
        });

        const statusCounts = { Placed: 0, Processing: 0, Dispatched: 0, Delivered: 0 };
        fetchedOrders.forEach((o) => {
          if (statusCounts[o.status] !== undefined) {
            statusCounts[o.status] += 1;
          }
        });

        setAnalytics({
          totalSales: sales,
          completedOrders: completed.length,
          plantsDispatched: plantsCount,
          avgOrderValue: completed.length > 0 ? Math.round(sales / completed.length) : 0,
          statusCounts,
          shgSales: Math.round(totalSHGSales * 100) / 100,
          shgCommission: Math.round(totalSHGCommission * 100) / 100,
          shgNetEarnings: Math.round(totalSHGEarnings * 100) / 100,
        });

        // Update profile form from server data
        if (resProfile.data.success) {
          const pUser = resProfile.data;
          setProfileForm({
            name: pUser.name || '',
            phoneNumber: pUser.phoneNumber || '',
            address: pUser.address || '',
            businessName: pUser.sellerProfile?.businessName || '',
            sellerCategory: pUser.sellerProfile?.category || 'Home Garden Owner',
            sellerType: pUser.sellerProfile?.sellerType || 'Farmer',
            story: pUser.sellerProfile?.story || '',
            isSHG: !!pUser.sellerProfile?.isSHG,
            isWomenEntrepreneur: !!pUser.sellerProfile?.isWomenEntrepreneur,
            latitude: pUser.location?.coordinates?.[1] || 9.1700,
            longitude: pUser.location?.coordinates?.[0] || 77.8700,
          });
        }
      }
    } catch (err) {
      console.error('Error loading seller dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  // Update Order Status
  const handleUpdateStatus = async (orderId, status) => {
    try {
      const { data } = await axios.put(`/api/orders/${orderId}/status`, {
        status,
        comment: `Status updated to ${status} by seller.`,
      });
      if (data.success) {
        alert(`Order status updated to "${status}"`);
        loadSellerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Create Product Submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = prodForm.name ? prodForm.name.trim() : '';
    const trimmedDesc = prodForm.description ? prodForm.description.trim() : '';
    const numPrice = Number(prodForm.price);
    const numStock = Number(prodForm.stock);

    if (!trimmedName) {
      setErrorMsg('Please enter a valid product name');
      return;
    }
    if (!trimmedDesc) {
      setErrorMsg('Please enter a valid product description');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Price must be a positive number greater than 0');
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('Stock cannot be negative');
      return;
    }

    setFormLoading(true);

    const payload = {
      name: trimmedName,
      description: trimmedDesc,
      price: numPrice,
      stock: numStock,
      category: prodForm.category,
      yieldType: prodForm.yieldType || undefined,
      images: [prodForm.image ? prodForm.image.trim() : '/assets/products/product-placeholder.svg'],
      isEcoFriendly: prodForm.isEcoFriendly,
      plantInfo: {
        waterRequirement: prodForm.waterRequirement,
        sunlightRequirement: prodForm.sunlightRequirement,
        difficultyLevel: prodForm.difficultyLevel,
        indoorOutdoor: prodForm.indoorOutdoor,
        petFriendly: prodForm.petFriendly,
      },
      sourceVerification: {
        sourceType: prodForm.sourceType,
        sourceName: prodForm.sourceName?.trim() || '',
        sourceLocation: prodForm.sourceLocation?.trim() || '',
        description: prodForm.sourceDescription?.trim() || '',
        declarationAccepted: !!prodForm.declarationAccepted,
      },
    };

    try {
      const { data } = await axios.post('/api/products', payload);
      if (data.success) {
        setAddModalOpen(false);
        setProdForm(defaultProdForm);
        loadSellerData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create product');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Product Modal
  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price || '',
      stock: prod.stock || 0,
      category: prod.category || 'Decorative / Ornamental Plants',
      yieldType: prod.yieldType || '',
      image: prod.images?.[0] || '',
      waterRequirement: prod.plantInfo?.waterRequirement || 'Medium',
      sunlightRequirement: prod.plantInfo?.sunlightRequirement || 'Full Sun',
      difficultyLevel: prod.plantInfo?.difficultyLevel || 'Easy',
      indoorOutdoor: prod.plantInfo?.indoorOutdoor || 'Indoor',
      petFriendly: !!prod.plantInfo?.petFriendly,
      isEcoFriendly: !!prod.isEcoFriendly,
      sourceType: prod.sourceVerification?.sourceType || 'Own Farm',
      sourceName: prod.sourceVerification?.sourceName || '',
      sourceLocation: prod.sourceVerification?.sourceLocation || '',
      sourceDescription: prod.sourceVerification?.description || '',
      declarationAccepted: !!prod.sourceVerification?.declarationAccepted,
    });
    setErrorMsg('');
    setEditModalOpen(true);
  };

  // Update Product Submit
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFormLoading(true);

    const payload = {
      name: prodForm.name,
      description: prodForm.description,
      price: Number(prodForm.price),
      stock: Number(prodForm.stock),
      category: prodForm.category,
      yieldType: prodForm.yieldType || '',
      images: [prodForm.image || '/assets/products/product-placeholder.svg'],
      isEcoFriendly: prodForm.isEcoFriendly,
      plantInfo: {
        waterRequirement: prodForm.waterRequirement,
        sunlightRequirement: prodForm.sunlightRequirement,
        difficultyLevel: prodForm.difficultyLevel,
        indoorOutdoor: prodForm.indoorOutdoor,
        petFriendly: prodForm.petFriendly,
      },
      sourceVerification: {
        sourceType: prodForm.sourceType,
        sourceName: prodForm.sourceName?.trim() || '',
        sourceLocation: prodForm.sourceLocation?.trim() || '',
        description: prodForm.sourceDescription?.trim() || '',
        declarationAccepted: !!prodForm.declarationAccepted,
      },
    };

    try {
      const { data } = await axios.put(`/api/products/${editingProduct._id}`, payload);
      if (data.success) {
        setEditModalOpen(false);
        setEditingProduct(null);
        setProdForm(defaultProdForm);
        loadSellerData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update product');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;
    try {
      const { data } = await axios.delete(`/api/products/${id}`);
      if (data.success) {
        loadSellerData();
      }
    } catch (err) {
      alert('Failed to remove product');
    }
  };

  // Quick Stock Update
  const handleQuickStockUpdate = async (product, delta) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      const { data } = await axios.put(`/api/products/${product._id}`, { stock: newStock });
      if (data.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, stock: newStock } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Detect Geolocation for Seller Profile
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
          alert('Could not detect GPS location automatically.');
        }
      );
    }
  };

  // Update Profile Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');

    const payload = {
      name: profileForm.name,
      phoneNumber: profileForm.phoneNumber,
      address: profileForm.address,
      latitude: profileForm.latitude,
      longitude: profileForm.longitude,
      sellerProfile: {
        businessName: profileForm.businessName,
        category: profileForm.sellerCategory,
        sellerType: profileForm.sellerType,
        story: profileForm.story,
        isSHG: profileForm.isSHG,
        isWomenEntrepreneur: profileForm.isWomenEntrepreneur,
      },
    };

    try {
      const { data } = await axios.put('/api/auth/profile', payload);
      if (data.success) {
        setProfileMsg('Seller profile updated successfully!');
        if (setUser) setUser(data);
      }
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const sellerLocStatus = user?.sellerProfile?.locationVerification?.status || 'None';
  const sellerSourceStatus = user?.sellerProfile?.productSource?.verificationStatus || 'None';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Seller Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1.5">
            <h1 className="font-display font-extrabold text-3xl text-primary-950">
              {user?.sellerProfile?.businessName || 'Green Business Dashboard'}
            </h1>
            {user?.sellerProfile?.isVerified ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xxs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Seller</span>
              </span>
            ) : (
              <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 text-xxs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Pending Verification
              </span>
            )}
            {user?.sellerProfile?.isSHG && (
              <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xxs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SHG Member</span>
              </span>
            )}
            {user?.sellerProfile?.isWomenEntrepreneur && (
              <span className="bg-pink-100 text-pink-800 border border-pink-200 text-xxs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Women Entrepreneur</span>
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">Manage product catalog, received orders, sales performance, and seller credentials.</p>
        </div>

        <button
          onClick={() => {
            setProdForm(defaultProdForm);
            setErrorMsg('');
            setAddModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow transition-all"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>List New Product</span>
        </button>
      </div>

      {/* VERIFICATION STATUS BADGES ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Seller Verification Status */}
        <div className="bg-white border border-organic-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seller Account Status</span>
            <span className="block font-bold text-xs text-slate-900">
              {user?.sellerProfile?.isVerified ? 'Approved & Verified' : user?.sellerStatus === 'rejected' ? 'Application Rejected' : 'Pending Admin Verification'}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase ${
            user?.sellerProfile?.isVerified ? 'bg-emerald-100 text-emerald-800' : user?.sellerStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {user?.sellerProfile?.isVerified ? 'Verified' : user?.sellerStatus === 'rejected' ? 'Rejected' : 'Pending'}
          </span>
        </div>

        {/* Location Verification Status */}
        <div className="bg-white border border-organic-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location Verification</span>
            <span className="block font-bold text-xs text-slate-900">
              {sellerLocStatus === 'Verified' ? 'GPS Location Verified' : sellerLocStatus === 'Mismatch' ? 'Mismatch (In Admin Review)' : 'Pending GPS Check'}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase ${
            sellerLocStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : sellerLocStatus === 'Mismatch' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
          }`}>
            {sellerLocStatus === 'Verified' ? 'Verified' : sellerLocStatus === 'Mismatch' ? 'Needs Review' : 'Pending'}
          </span>
        </div>

        {/* Product Source Verification Status */}
        <div className="bg-white border border-organic-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Product Source Genuineness</span>
            <span className="block font-bold text-xs text-slate-900">
              {sellerSourceStatus === 'Verified' ? 'Source Declared & Verified' : sellerSourceStatus === 'Rejected' ? 'Needs More Info' : 'Pending Admin Review'}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase ${
            sellerSourceStatus === 'Verified' ? 'bg-teal-100 text-teal-800' : sellerSourceStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {sellerSourceStatus === 'Verified' ? 'Verified' : sellerSourceStatus === 'Rejected' ? 'Needs Review' : 'Pending'}
          </span>
        </div>
      </div>

      {/* SHG BENEFIT & COMMISSION WIDGET (DISPLAYED ONLY TO SHG SELLERS) */}
      {isSHGSeller && (
        <div className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Percent className="h-36 w-36 text-slate-900" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-emerald-800 text-xxs font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>SHG Member Benefit & Commission System</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-slate-900">Self Help Group Earnings</h2>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Dynamic, transparent commission tracking for SHG orders. Orders calculate commission snapshots automatically upon completion.
              </p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200/70 px-4 py-2.5 rounded-2xl text-left md:text-right">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">SHG Seller Status</span>
              <span className="font-extrabold text-sm text-emerald-700 flex items-center md:justify-end gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Beneficiary
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 relative z-10">
            <div className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total SHG Sales</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">₹{analytics.shgSales}</span>
              <span className="text-[11px] text-slate-400">From delivered SHG orders</span>
            </div>
            <div className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Commission</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 block">₹{analytics.shgCommission}</span>
              <span className="text-[11px] text-slate-400">Platform operational fee</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/80 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Net Seller Earnings</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block">₹{analytics.shgNetEarnings}</span>
              <span className="text-[11px] text-emerald-600 font-medium">Disbursed to your UPI / Bank</span>
            </div>
          </div>
        </div>
      )}

      {/* Overview Analytics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-800">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-semibold block">Total Revenue</span>
            <span className="block font-display font-extrabold text-2xl text-slate-900">₹{analytics.totalSales}</span>
          </div>
        </div>

        <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-primary-100 p-3 rounded-2xl text-primary-800">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-semibold block">Completed Orders</span>
            <span className="block font-display font-extrabold text-2xl text-slate-900">{analytics.completedOrders}</span>
          </div>
        </div>

        <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-800">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-semibold block">Units Dispatched</span>
            <span className="block font-display font-extrabold text-2xl text-slate-900">{analytics.plantsDispatched}</span>
          </div>
        </div>

        <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-800">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-semibold block">Active Products</span>
            <span className="block font-display font-extrabold text-2xl text-slate-900">{products.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-organic-200 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'inventory'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Catalog & Inventory ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Received Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Sales Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Business Profile & Settings</span>
        </button>
      </div>

      {/* TAB 1: CATALOG & INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-xl text-slate-900">Inventory & Product Catalog</h2>
            <span className="text-xs text-slate-500">Low stock warning triggers at less than 5 units.</span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-white rounded-2xl"></div>
              <div className="h-12 bg-white rounded-2xl"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-organic-200 rounded-3xl space-y-3">
              <Package className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-slate-700 font-bold">No product listings found.</p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-block bg-primary-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
              >
                List Your First Product
              </button>
            </div>
          ) : (
            <div className="bg-white border border-organic-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-organic-50 border-b border-organic-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="p-4">Product</th>
                      <th className="p-4">Category / Yield</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock Management</th>
                      <th className="p-4">Source Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-organic-100 text-slate-700 font-medium">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-organic-50/50 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <img
                            src={getProductImage(p)}
                            onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-xl border border-organic-100 flex-shrink-0"
                          />
                          <div>
                            <Link to={`/products/${p._id}`} className="font-bold text-slate-900 hover:text-primary-700 block truncate max-w-xs">
                              {p.name}
                            </Link>
                            {p.isEcoFriendly && (
                              <span className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">Zero-Plastic Packing</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-800 block">{p.category}</span>
                          {p.yieldType && (
                            <span className="text-[10px] text-emerald-700 font-bold block">{p.yieldType}</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900">₹{p.price}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuickStockUpdate(p, -1)}
                              className="w-6 h-6 rounded border border-organic-300 hover:bg-organic-100 text-slate-600 font-bold flex items-center justify-center text-xs"
                              title="Decrease Stock"
                            >
                              -
                            </button>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              p.stock === 0
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : p.stock < 5
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {p.stock} Units {p.stock < 5 && p.stock > 0 && '(Low Stock)'}
                            </span>
                            <button
                              onClick={() => handleQuickStockUpdate(p, 1)}
                              className="w-6 h-6 rounded border border-organic-300 hover:bg-organic-100 text-slate-600 font-bold flex items-center justify-center text-xs"
                              title="Increase Stock"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.sourceVerification?.isSourceVerified
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.sourceVerification?.isSourceVerified ? 'Source Verified' : (p.sourceVerification?.sourceType || 'Standard')}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="text-primary-700 hover:text-primary-900 hover:bg-primary-50 p-2 rounded-xl transition-all"
                              title="Edit Product Details"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-all"
                              title="Remove Product"
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
          )}
        </div>
      )}

      {/* TAB 2: RECEIVED ORDERS & STATUS UPDATES */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-xl text-slate-900">Received Customer Orders</h2>
            <span className="text-xs text-slate-500">Update order status as shipments are processed and delivered.</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center space-y-3">
              <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
              <span className="block text-slate-700 font-bold text-base">No Received Orders</span>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Customer orders will appear here as soon as buyers purchase your products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((ord) => (
                <div key={ord._id} className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b border-organic-100 pb-3">
                    <div>
                      <span className="block font-bold text-slate-900 text-sm">Order #{ord._id.substring(18)}</span>
                      <span className="block text-xs text-slate-400">Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-extrabold text-slate-900 text-base">₹{ord.totalPrice}</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                        ord.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : ord.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'Accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'Dispatched'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {ord.status === 'Cancelled' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-1 text-xs text-red-800 animate-fadeIn">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <X className="h-4 w-4 text-red-600" />
                        <span>Order Cancelled</span>
                        {ord.cancelledAt && (
                          <span className="text-[11px] font-normal text-red-600">
                            • {new Date(ord.cancelledAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {ord.cancellationReason && (
                        <p className="text-xxs text-red-700">
                          <strong>Cancellation Reason:</strong> {ord.cancellationReason}
                          {ord.cancellationNote ? ` (${ord.cancellationNote})` : ''}
                        </p>
                      )}
                      <p className="text-[10px] text-red-600 font-medium">
                        ✓ Inventory restored to stock. This order cannot be processed or shipped.
                      </p>
                    </div>
                  )}

                  {ord.isSHGOrder && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-xxs flex justify-between text-blue-900 font-semibold">
                      <span>SHG Commission: <strong>₹{ord.commissionAmount || 0} ({ord.commissionRate || 5}%)</strong></span>
                      <span>Net Seller Earnings: <strong>₹{ord.sellerEarnings != null ? ord.sellerEarnings : (ord.totalPrice - (ord.commissionAmount || 0))}</strong></span>
                    </div>
                  )}

                  <div className="bg-organic-50 p-3 rounded-2xl border border-organic-150 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Payment:</span>
                      <span className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          ord.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.paymentStatus === 'Refund Pending'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : ord.paymentStatus === 'Refunded'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.paymentStatus === 'Paid'
                            ? 'PAID ONLINE'
                            : ord.paymentStatus === 'Refund Pending'
                            ? 'REFUND PENDING'
                            : ord.paymentStatus === 'Refunded'
                            ? 'REFUNDED'
                            : 'COD / PENDING'}
                        </span>
                        <span className="text-slate-600 font-semibold text-[11px]">({ord.paymentMethod || 'COD'})</span>
                      </span>
                    </div>
                    {ord.razorpayPaymentId && (
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-organic-100">
                        <span>Razorpay ID:</span>
                        <span className="font-mono font-semibold text-emerald-900">{ord.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5 bg-organic-50 px-3 py-1.5 rounded-xl border border-organic-100">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {ord.status === 'Cancelled' ? (
                          <span className="text-red-700 font-bold">Cancelled by Buyer</span>
                        ) : ord.status === 'Delivered' ? (
                          <>Delivered: <strong className="text-emerald-800 font-bold">{getOrderDeliveredDate(ord) || 'Completed'}</strong></>
                        ) : (
                          <>Expected Delivery: <strong className="text-slate-900 font-bold">{getOrderExpectedDelivery(ord)}</strong></>
                        )}
                      </span>
                    </div>
                    <div><b>Buyer:</b> {ord.buyer?.name || 'Customer'} ({ord.buyer?.email})</div>
                    <div className="truncate"><b>Shipping Address:</b> {ord.shippingAddress}</div>
                  </div>

                  <div className="border-t border-organic-100 pt-3 space-y-2">
                    <span className="text-xxs uppercase font-bold text-slate-400 tracking-wider block">Ordered Items</span>
                    {ord.orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{item.name} (x{item.qty})</span>
                        <span className="font-bold text-slate-900">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status update control (strictly disabled for Delivered and Cancelled orders) */}
                  {ord.status !== 'Delivered' && ord.status !== 'Cancelled' && (
                    <div className="pt-2 border-t border-organic-100 flex items-center space-x-3">
                      <label htmlFor={`seller-order-status-${ord._id}`} className="text-xs font-bold text-slate-700 whitespace-nowrap">Update Status:</label>
                      <select
                        id={`seller-order-status-${ord._id}`}
                        name={`orderStatus_${ord._id}`}
                        className="flex-grow p-2 text-xs rounded-xl border border-organic-200 bg-[#FAF9F5] focus:outline-none focus:border-primary-500 font-semibold"
                        onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                        value={ord.status}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SALES ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <h2 className="font-display font-bold text-xl text-slate-900">Sales & Revenue Performance</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sales Earnings</span>
              <div className="text-3xl font-extrabold text-emerald-600">₹{analytics.totalSales}</div>
              <p className="text-xs text-slate-500">Calculated from completed deliveries.</p>
            </div>

            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Order Value</span>
              <div className="text-3xl font-extrabold text-primary-800">₹{analytics.avgOrderValue}</div>
              <p className="text-xs text-slate-500">Revenue per fulfilled order.</p>
            </div>

            <div className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fulfillment Rate</span>
              <div className="text-3xl font-extrabold text-blue-600">
                {orders.length > 0 ? Math.round((analytics.completedOrders / orders.length) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-500">{analytics.completedOrders} out of {orders.length} orders delivered.</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white border border-organic-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg">Order Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-organic-50 p-4 rounded-2xl border border-organic-100">
                <span className="text-xs text-slate-500 block">Placed</span>
                <span className="text-2xl font-bold text-yellow-700">{analytics.statusCounts.Placed}</span>
              </div>
              <div className="bg-organic-50 p-4 rounded-2xl border border-organic-100">
                <span className="text-xs text-slate-500 block">Processing</span>
                <span className="text-2xl font-bold text-blue-700">{analytics.statusCounts.Processing}</span>
              </div>
              <div className="bg-organic-50 p-4 rounded-2xl border border-organic-100">
                <span className="text-xs text-slate-500 block">Dispatched</span>
                <span className="text-2xl font-bold text-indigo-700">{analytics.statusCounts.Dispatched}</span>
              </div>
              <div className="bg-organic-50 p-4 rounded-2xl border border-organic-100">
                <span className="text-xs text-slate-500 block">Delivered</span>
                <span className="text-2xl font-bold text-emerald-700">{analytics.statusCounts.Delivered}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUSINESS PROFILE & SETTINGS */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl bg-white border border-organic-200 rounded-3xl p-8 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-xl text-slate-900 border-b border-organic-100 pb-4">Seller Business Credentials & Profile</h2>

          {profileMsg && (
            <div className={`p-4 rounded-xl text-xs font-semibold ${profileMsg.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="seller-business-name" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Business Name</label>
                <input
                  id="seller-business-name"
                  name="businessName"
                  type="text"
                  required
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="seller-business-category" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Business Category</label>
                <select
                  id="seller-business-category"
                  name="sellerCategory"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                  value={profileForm.sellerCategory}
                  onChange={(e) => setProfileForm({ ...profileForm, sellerCategory: e.target.value })}
                >
                  <option value="Home Grower">Home Grower</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Women Entrepreneur">Women Entrepreneur</option>
                  <option value="Self Help Group (SHG)">Self Help Group (SHG)</option>
                  <option value="Artisan">Artisan</option>
                  <option value="Organic Farm">Organic Farm</option>
                  <option value="Small Business">Small Business</option>
                </select>
              </div>

              <div>
                <label htmlFor="seller-type-select" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Seller Type</label>
                <select
                  id="seller-type-select"
                  name="sellerType"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500 font-semibold"
                  value={profileForm.sellerType}
                  onChange={(e) => setProfileForm({ ...profileForm, sellerType: e.target.value })}
                >
                  <option value="Farmer">Farmer</option>
                  <option value="SHG Member">SHG Member</option>
                  <option value="Nursery Owner">Nursery Owner</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Home Grower">Home Grower</option>
                  <option value="Artisan">Artisan</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="seller-owner-name" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Owner Name</label>
              <input
                id="seller-owner-name"
                name="name"
                type="text"
                required
                className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="seller-story" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Seller Story / Bio</label>
              <textarea
                id="seller-story"
                name="story"
                rows="3"
                placeholder="Share your story, organic techniques, or mission with your local community..."
                className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                value={profileForm.story}
                onChange={(e) => setProfileForm({ ...profileForm, story: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="seller-phone" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Phone Number</label>
                <input
                  id="seller-phone"
                  name="phoneNumber"
                  type="text"
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="seller-address" className="block font-bold uppercase text-slate-700 tracking-wider mb-1">Address</label>
                <input
                  id="seller-address"
                  name="address"
                  type="text"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>
            </div>

            {/* Verification Flags */}
            <div className="bg-organic-50 p-4 border border-organic-200 rounded-2xl space-y-3">
              <span className="font-bold text-slate-800 block uppercase tracking-wider">Social Empowerment Badges</span>
              <div className="flex flex-wrap gap-4">
                <label htmlFor="seller-is-shg" className="flex items-center space-x-2 cursor-pointer">
                  <input
                    id="seller-is-shg"
                    name="isSHG"
                    type="checkbox"
                    className="rounded text-primary-600 focus:ring-primary-500"
                    checked={profileForm.isSHG}
                    onChange={(e) => setProfileForm({ ...profileForm, isSHG: e.target.checked })}
                  />
                  <span className="font-semibold text-slate-700">Self Help Group (SHG) Member</span>
                </label>

                <label htmlFor="seller-is-women-ent" className="flex items-center space-x-2 cursor-pointer">
                  <input
                    id="seller-is-women-ent"
                    name="isWomenEntrepreneur"
                    type="checkbox"
                    className="rounded text-primary-600 focus:ring-primary-500"
                    checked={profileForm.isWomenEntrepreneur}
                    onChange={(e) => setProfileForm({ ...profileForm, isWomenEntrepreneur: e.target.checked })}
                  />
                  <span className="font-semibold text-slate-700">Women-Run Entrepreneurship</span>
                </label>
              </div>
            </div>

            {/* GPS Location Coordinates */}
            <div className="space-y-2">
              <span className="font-bold uppercase text-slate-700 tracking-wider block">Hyperlocal GPS Coordinates</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="seller-latitude" className="block text-slate-400 mb-1">Latitude</label>
                  <input
                    id="seller-latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                    value={profileForm.latitude}
                    onChange={(e) => setProfileForm({ ...profileForm, latitude: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="seller-longitude" className="block text-slate-400 mb-1">Longitude</label>
                  <input
                    id="seller-longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                    value={profileForm.longitude}
                    onChange={(e) => setProfileForm({ ...profileForm, longitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="text-xs text-primary-700 font-bold hover:underline flex items-center space-x-1 pt-1"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Auto-Detect Current GPS Coordinates</span>
              </button>
            </div>

            <div className="pt-4 border-t border-organic-100">
              <button
                type="submit"
                disabled={profileLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {profileLoading ? 'Saving Settings...' : 'Update Business Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-organic-200 space-y-6 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900">List New Product</h2>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-1">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-prod-name" className="block text-xxs font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    id="add-prod-name"
                    name="name"
                    type="text"
                    required
                    className="w-full p-2.5 rounded-xl border border-organic-200"
                    placeholder="E.g., Hybrid Dwarf Coconut Sapling / Raw Honey"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="add-prod-category" className="block text-xxs font-semibold text-slate-700 mb-1">Product Category</label>
                  <select
                    id="add-prod-category"
                    name="category"
                    className="w-full p-2.5 rounded-xl border border-organic-200 bg-white"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  >
                    {CATEGORY_LIST.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-prod-yield" className="block text-xxs font-semibold text-slate-700 mb-1">Yield & Profit Type (Optional)</label>
                  <select
                    id="add-prod-yield"
                    name="yieldType"
                    className="w-full p-2.5 rounded-xl border border-organic-200 bg-white"
                    value={prodForm.yieldType}
                    onChange={(e) => setProdForm({ ...prodForm, yieldType: e.target.value })}
                  >
                    <option value="">None / General</option>
                    <option value="Long-Term Yield">Long-Term Yield (e.g. Coconut, Mango, Guava, Amla)</option>
                    <option value="Short-Term Yield">Short-Term Yield (e.g. Tomato, Chilli, Brinjal, Greens)</option>
                    <option value="Decorative / Ornamental">Decorative / Ornamental</option>
                    <option value="Medicinal">Medicinal</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadField
                  id="add-prod-image"
                  label="Product Photo / Image"
                  placeholder="Paste URL or upload image file directly..."
                  value={prodForm.image}
                  onChange={(imgUrl) => setProdForm({ ...prodForm, image: imgUrl })}
                />
              </div>

              <div>
                <label htmlFor="add-prod-desc" className="block text-xxs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  id="add-prod-desc"
                  name="description"
                  required
                  rows="2.5"
                  className="w-full p-2.5 rounded-xl border border-organic-200"
                  placeholder="Explain characteristics, harvest cycle, organic benefits..."
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-prod-price" className="block text-xxs font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    id="add-prod-price"
                    name="price"
                    type="number"
                    required
                    className="w-full p-2.5 rounded-xl border border-organic-200"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="add-prod-stock" className="block text-xxs font-semibold text-slate-700 mb-1">Stock Units</label>
                  <input
                    id="add-prod-stock"
                    name="stock"
                    type="number"
                    required
                    className="w-full p-2.5 rounded-xl border border-organic-200"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* Product Source Declaration */}
              <div className="bg-teal-50/50 p-4 border border-teal-200 rounded-2xl space-y-3">
                <span className="font-display font-semibold text-teal-900 block text-xxs uppercase tracking-wider flex items-center space-x-1">
                  <FileCheck2 className="h-3.5 w-3.5 text-teal-700" />
                  <span>Product Source & Genuineness Declaration</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="add-prod-source-type" className="block text-[10px] text-slate-500 mb-0.5">Source Type</label>
                    <select
                      id="add-prod-source-type"
                      name="sourceType"
                      className="w-full p-2 rounded-xl border border-teal-200 bg-white text-xs"
                      value={prodForm.sourceType}
                      onChange={(e) => setProdForm({ ...prodForm, sourceType: e.target.value })}
                    >
                      <option value="Own Farm">Own Farm</option>
                      <option value="SHG Production">SHG Production</option>
                      <option value="Purchased from Farmer">Purchased from Farmer</option>
                      <option value="Authorized Supplier">Authorized Supplier</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-prod-source-name" className="block text-[10px] text-slate-500 mb-0.5">Source Name / Farmer Group</label>
                    <input
                      id="add-prod-source-name"
                      name="sourceName"
                      type="text"
                      className="w-full p-2 rounded-xl border border-teal-200 bg-white text-xs"
                      placeholder="e.g. Village Organic Cell"
                      value={prodForm.sourceName}
                      onChange={(e) => setProdForm({ ...prodForm, sourceName: e.target.value })}
                    />
                  </div>
                </div>
                <label htmlFor="add-prod-declaration" className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    id="add-prod-declaration"
                    name="declarationAccepted"
                    type="checkbox"
                    className="rounded text-emerald-600"
                    checked={prodForm.declarationAccepted}
                    onChange={(e) => setProdForm({ ...prodForm, declarationAccepted: e.target.checked })}
                  />
                  <span className="text-[10px] text-slate-700 font-semibold">
                    I confirm that this product is sourced from genuine cultivators/farmers, SHG production, or my own farm.
                  </span>
                </label>
              </div>

              {/* Plant Specs if plant category */}
              <div className="bg-organic-50 p-4 border border-organic-200 rounded-2xl space-y-3">
                <span className="font-display font-semibold text-slate-800 block text-xxs uppercase tracking-wider">Care Specs & Eco Packaging</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="add-prod-water" className="block text-[10px] text-slate-400 mb-1">Water Need</label>
                    <select
                      id="add-prod-water"
                      name="waterRequirement"
                      className="w-full p-1.5 rounded border border-organic-200 bg-white"
                      value={prodForm.waterRequirement}
                      onChange={(e) => setProdForm({ ...prodForm, waterRequirement: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-prod-sun" className="block text-[10px] text-slate-400 mb-1">Sunlight</label>
                    <select
                      id="add-prod-sun"
                      name="sunlightRequirement"
                      className="w-full p-1.5 rounded border border-organic-200 bg-white"
                      value={prodForm.sunlightRequirement}
                      onChange={(e) => setProdForm({ ...prodForm, sunlightRequirement: e.target.value })}
                    >
                      <option value="Full Sun">Full Sun</option>
                      <option value="Partial Shade">Partial Shade</option>
                      <option value="Full Shade">Full Shade</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-prod-diff" className="block text-[10px] text-slate-400 mb-1">Difficulty</label>
                    <select
                      id="add-prod-diff"
                      name="difficultyLevel"
                      className="w-full p-1.5 rounded border border-organic-200 bg-white"
                      value={prodForm.difficultyLevel}
                      onChange={(e) => setProdForm({ ...prodForm, difficultyLevel: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-prod-setting" className="block text-[10px] text-slate-400 mb-1">Setting</label>
                    <select
                      id="add-prod-setting"
                      name="indoorOutdoor"
                      className="w-full p-1.5 rounded border border-organic-200 bg-white"
                      value={prodForm.indoorOutdoor}
                      onChange={(e) => setProdForm({ ...prodForm, indoorOutdoor: e.target.value })}
                    >
                      <option value="Indoor">Indoor</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-1">
                  <label htmlFor="add-prod-eco" className="flex items-center space-x-2 cursor-pointer">
                    <input
                      id="add-prod-eco"
                      name="isEcoFriendly"
                      type="checkbox"
                      className="rounded text-primary-600"
                      checked={prodForm.isEcoFriendly}
                      onChange={(e) => setProdForm({ ...prodForm, isEcoFriendly: e.target.checked })}
                    />
                    <span className="text-[10px] text-slate-600 font-semibold">100% Biodegradable packing</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-md text-xs mt-2 disabled:opacity-50"
              >
                {formLoading ? 'Publishing...' : 'Launch Product Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-organic-200 space-y-6 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900">Edit Product: {editingProduct.name}</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-1">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-prod-name" className="block text-xxs font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    id="edit-prod-name"
                    name="name"
                    type="text"
                    required
                    className="w-full p-2.5 rounded-xl border border-organic-200"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-prod-category" className="block text-xxs font-semibold text-slate-700 mb-1">Product Category</label>
                  <select
                    id="edit-prod-category"
                    name="category"
                    className="w-full p-2.5 rounded-xl border border-organic-200 bg-white"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  >
                    {CATEGORY_LIST.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div>
                  <label htmlFor="edit-prod-yield" className="block text-xxs font-semibold text-slate-700 mb-1">Yield & Profit Type (Optional)</label>
                  <select
                    id="edit-prod-yield"
                    name="yieldType"
                    className="w-full p-2.5 rounded-xl border border-organic-200 bg-white"
                    value={prodForm.yieldType}
                    onChange={(e) => setProdForm({ ...prodForm, yieldType: e.target.value })}
                  >
                    <option value="">None / General</option>
                    <option value="Long-Term Yield">Long-Term Yield</option>
                    <option value="Short-Term Yield">Short-Term Yield</option>
                    <option value="Decorative / Ornamental">Decorative / Ornamental</option>
                    <option value="Medicinal">Medicinal</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadField
                  id="edit-prod-image"
                  label="Product Photo / Image"
                  placeholder="Paste URL or upload image file directly..."
                  value={prodForm.image}
                  onChange={(imgUrl) => setProdForm({ ...prodForm, image: imgUrl })}
                />
              </div>

              <div>
                <label htmlFor="edit-prod-desc" className="block text-xxs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  id="edit-prod-desc"
                  name="description"
                  required
                  rows="2.5"
                  className="w-full p-2.5 rounded-xl border border-organic-200"
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-prod-price" className="block text-xxs font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    id="edit-prod-price"
                    name="price"
                    type="number"
                    required
                    className="w-full p-2.5 rounded-xl border border-organic-200"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-prod-stock" className="block text-xxs font-semibold text-slate-700 mb-1">Stock Units</label>
                  <input
                    id="edit-prod-stock"
                    name="stock"
                    type="number"
                    required
                    className="w-full p-2.5 rounded-xl border border-organic-200"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* Product Source Declaration */}
              <div className="bg-teal-50/50 p-4 border border-teal-200 rounded-2xl space-y-3">
                <span className="font-display font-semibold text-teal-900 block text-xxs uppercase tracking-wider flex items-center space-x-1">
                  <FileCheck2 className="h-3.5 w-3.5 text-teal-700" />
                  <span>Product Source & Genuineness Declaration</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-prod-source-type" className="block text-[10px] text-slate-500 mb-0.5">Source Type</label>
                    <select
                      id="edit-prod-source-type"
                      name="sourceType"
                      className="w-full p-2 rounded-xl border border-teal-200 bg-white text-xs"
                      value={prodForm.sourceType}
                      onChange={(e) => setProdForm({ ...prodForm, sourceType: e.target.value })}
                    >
                      <option value="Own Farm">Own Farm</option>
                      <option value="SHG Production">SHG Production</option>
                      <option value="Purchased from Farmer">Purchased from Farmer</option>
                      <option value="Authorized Supplier">Authorized Supplier</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-prod-source-name" className="block text-[10px] text-slate-500 mb-0.5">Source Name / Farmer Group</label>
                    <input
                      id="edit-prod-source-name"
                      name="sourceName"
                      type="text"
                      className="w-full p-2 rounded-xl border border-teal-200 bg-white text-xs"
                      value={prodForm.sourceName}
                      onChange={(e) => setProdForm({ ...prodForm, sourceName: e.target.value })}
                    />
                  </div>
                </div>
                <label htmlFor="edit-prod-declaration" className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    id="edit-prod-declaration"
                    name="declarationAccepted"
                    type="checkbox"
                    className="rounded text-emerald-600"
                    checked={prodForm.declarationAccepted}
                    onChange={(e) => setProdForm({ ...prodForm, declarationAccepted: e.target.checked })}
                  />
                  <span className="text-[10px] text-slate-700 font-semibold">
                    I confirm that this product is sourced from genuine cultivators/farmers, SHG production, or my own farm.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-md text-xs mt-2 disabled:opacity-50"
              >
                {formLoading ? 'Saving Changes...' : 'Save Product Updates'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
