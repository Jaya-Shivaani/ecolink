import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Search, MapPin, SlidersHorizontal, Grid, Map as MapIcon, ShieldCheck, Heart, Sparkles, Navigation, TrendingUp } from 'lucide-react';
import L from 'leaflet';

import { useTranslation } from 'react-i18next';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';

const Marketplace = ({ addToCart }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    if (user && user.wishlist) {
      setWishlistIds(user.wishlist.map((item) => (typeof item === 'string' ? item : item._id)));
    }
  }, [user]);

  const handleToggleWishlist = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.post(`/api/auth/wishlist/${productId}`);
      if (data.success) {
        setWishlistIds(data.wishlist.map((item) => (typeof item === 'string' ? item : item._id)));
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  // Geolocation & Hyperlocal settings
  const [lat, setLat] = useState(user?.location?.coordinates[1] || 9.1700);
  const [lng, setLng] = useState(user?.location?.coordinates[0] || 77.8700);
  const [distance, setDistance] = useState(15);
  const [coordsDetected, setCoordsDetected] = useState(!!user?.location?.coordinates);

  // Main & Sub Category Hierarchies
  const MAIN_CATEGORIES = [
    { id: '', label: 'All Categories' },
    { id: 'Plants', label: 'Plants' },
    { id: 'Seeds', label: 'Seeds' },
    { id: 'Fertilizers', label: 'Fertilizers' },
    { id: 'Eco Products', label: 'Eco Products' },
    { id: 'FMCG / Natural Products', label: 'FMCG / Natural Products' },
  ];

  const PLANT_SUBCATEGORIES = [
    { id: '', label: 'All Plants' },
    { id: 'Decorative / Ornamental', label: 'Decorative / Ornamental' },
    { id: 'Long-Term Yield', label: 'Long-Term Yield' },
    { id: 'Short-Term Yield', label: 'Short-Term Yield' },
    { id: 'Medicinal', label: 'Medicinal' },
  ];

  // Helper to map raw DB category / yieldType into clean parent category
  const mapToMainCategory = (rawCat, rawYield) => {
    if (!rawCat && !rawYield) return '';
    const c = (rawCat || '').toLowerCase();
    const y = (rawYield || '').toLowerCase();
    if (
      c.includes('plant') ||
      c.includes('decor') ||
      c.includes('ornamental') ||
      c.includes('yield') ||
      c.includes('medicinal') ||
      y.length > 0
    ) {
      return 'Plants';
    }
    if (c.includes('seed')) {
      return 'Seeds';
    }
    if (c.includes('fertilizer') || c.includes('compost') || c.includes('manure') || c.includes('soil')) {
      return 'Fertilizers';
    }
    if (
      c.includes('eco') ||
      c.includes('banana') ||
      c.includes('fibre') ||
      c.includes('fiber') ||
      c.includes('coir') ||
      c.includes('palm') ||
      c.includes('bamboo') ||
      c.includes('jute') ||
      c.includes('bag') ||
      c.includes('craft')
    ) {
      return 'Eco Products';
    }
    if (
      c.includes('fmcg') ||
      c.includes('natural') ||
      c.includes('farm') ||
      c.includes('honey') ||
      c.includes('oil') ||
      c.includes('soap') ||
      c.includes('herbal')
    ) {
      return 'FMCG / Natural Products';
    }
    return 'Eco Products';
  };

  // Filters - Initialized directly from URL params to prevent race condition glitch
  const initialParams = new URLSearchParams(location.search);
  const initCat = initialParams.get('category') || '';
  const initYield = initialParams.get('yieldType') || '';
  const initMain = mapToMainCategory(initCat, initYield);
  const initSub = initYield || (initCat && initCat !== initMain && initCat !== 'Eco-Products' && initCat !== 'Eco Products' ? initCat : '');

  const [keyword, setKeyword] = useState(() => initialParams.get('keyword') || '');
  const [category, setCategory] = useState(() => initCat);
  const [yieldType, setYieldType] = useState(() => initYield);
  const [selectedMainCategory, setSelectedMainCategory] = useState(initMain);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initSub);
  const [difficulty, setDifficulty] = useState('');
  const [indoorOutdoor, setIndoorOutdoor] = useState('');
  const [onlySHG, setOnlySHG] = useState(false);
  const [onlyWomen, setOnlyWomen] = useState(false);
  const [onlyEco, setOnlyEco] = useState(false);

  // Map elements
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerGroup = useRef(null);

  // Default Categories list (dynamically extended via API)
  const defaultCategories = [
    'Plants & Seeds',
    'Decorative / Ornamental Plants',
    'Long-Term Yield Plants',
    'Short-Term Yield Plants',
    'Medicinal Plants',
    'Seeds',
    'Fertilizers',
    'Banana Fibre Bags',
    'Eco-Products',
    'FMCG / Farm & Natural Products',
    'Indoor Plants',
    'Outdoor Plants',
    'Organic Compost',
    'Garden Tools',
    'Palm Leaf Products',
    'Coconut Coir Products',
    'Bamboo Crafts',
    'Jute Products',
    'Herbal Soaps',
    'Essential Oils',
  ];
  const [categories, setCategories] = useState(defaultCategories);

  // Dynamic Eco subcategories from categories fetched from DB
  const ecoSubcategories = React.useMemo(() => {
    const rawSubs = categories.filter((c) => {
      const parent = mapToMainCategory(c, '');
      return parent === 'Eco Products' && c !== 'Eco-Products' && c !== 'Eco Products';
    });
    return Array.from(new Set(rawSubs));
  }, [categories]);

  // Dynamic FMCG subcategories from categories fetched from DB
  const fmcgSubcategories = React.useMemo(() => {
    const rawSubs = categories.filter((c) => {
      const parent = mapToMainCategory(c, '');
      return (
        parent === 'FMCG / Natural Products' &&
        c !== 'FMCG / Farm & Natural Products' &&
        c !== 'FMCG / Natural Products'
      );
    });
    return Array.from(new Set(rawSubs));
  }, [categories]);

  // Sync with URL query parameters when navigation occurs
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category') || '';
    const yld = params.get('yieldType') || '';
    const kw = params.get('keyword') || '';
    const main = mapToMainCategory(cat, yld);
    const sub = yld || (cat && cat !== main && cat !== 'Eco-Products' && cat !== 'Eco Products' ? cat : '');

    setSelectedMainCategory(main);
    setSelectedSubcategory(sub);
    setCategory(cat);
    setYieldType(yld);
    setKeyword(kw);
  }, [location.search]);

  // Fetch dynamic categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await axios.get('/api/products/categories');
        if (data.success && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch (e) {
        // Fallback already in place
      }
    };
    loadCategories();
  }, []);

  const handleMainCategoryChange = (newMain) => {
    setSelectedMainCategory(newMain);
    setSelectedSubcategory('');
    if (!newMain) {
      setCategory('');
      setYieldType('');
    } else if (newMain === 'Plants') {
      setCategory('Plants');
      setYieldType('');
    } else if (newMain === 'Seeds') {
      setCategory('Seeds');
      setYieldType('');
    } else if (newMain === 'Fertilizers') {
      setCategory('Fertilizers');
      setYieldType('');
    } else if (newMain === 'Eco Products') {
      setCategory('Eco Products');
      setYieldType('');
    } else if (newMain === 'FMCG / Natural Products') {
      setCategory('FMCG / Natural Products');
      setYieldType('');
    }
  };

  const handleSubcategoryChange = (newSub) => {
    setSelectedSubcategory(newSub);
    if (selectedMainCategory === 'Plants') {
      setCategory('Plants');
      setYieldType(newSub);
    } else if (selectedMainCategory === 'Eco Products') {
      setCategory(newSub || 'Eco Products');
      setYieldType('');
    } else if (selectedMainCategory === 'FMCG / Natural Products') {
      setCategory(newSub || 'FMCG / Natural Products');
      setYieldType('');
    } else if (selectedMainCategory === 'Fertilizers') {
      setCategory(newSub || 'Fertilizers');
      setYieldType('');
    } else if (selectedMainCategory === 'Seeds') {
      setCategory(newSub || 'Seeds');
      setYieldType('');
    }
  };

  const handleResetAll = () => {
    setSelectedMainCategory('');
    setSelectedSubcategory('');
    setKeyword('');
    setCategory('');
    setYieldType('');
    setDifficulty('');
    setIndoorOutdoor('');
    setOnlySHG(false);
    setOnlyWomen(false);
    setOnlyEco(false);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Detect location
  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setCoordsDetected(true);
        },
        (error) => {
          console.error(error);
          alert('Could not detect location. Using default center.');
        }
      );
    }
  };

  // In-memory query caching
  const productsCache = useRef({});

  // Debounced search and distance values for responsive, low-latency filtering
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  const [debouncedDistance, setDebouncedDistance] = useState(distance);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 200);
    return () => clearTimeout(handler);
  }, [keyword]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDistance(distance);
    }, 150);
    return () => clearTimeout(handler);
  }, [distance]);

  // Fetch Products with client-side cache and race-condition protection
  useEffect(() => {
    let isCurrent = true;

    const fetchFilteredProducts = async () => {
      try {
        let queryParams = [];

        if (debouncedKeyword) queryParams.push(`keyword=${encodeURIComponent(debouncedKeyword)}`);
        if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
        if (yieldType) queryParams.push(`yieldType=${encodeURIComponent(yieldType)}`);
        if (difficulty) queryParams.push(`difficulty=${difficulty}`);
        if (indoorOutdoor) queryParams.push(`indoorOutdoor=${indoorOutdoor}`);

        if (coordsDetected) {
          queryParams.push(`latitude=${lat}`);
          queryParams.push(`longitude=${lng}`);
          queryParams.push(`maxDistance=${debouncedDistance}`);
        }

        const cacheKey = queryParams.sort().join('&');

        // Instant Cache Lookup: Render immediately if previously fetched
        if (productsCache.current[cacheKey]) {
          let cachedData = [...productsCache.current[cacheKey]];
          if (onlySHG) cachedData = cachedData.filter((p) => p.seller?.sellerProfile?.isSHG);
          if (onlyWomen) cachedData = cachedData.filter((p) => p.seller?.sellerProfile?.isWomenEntrepreneur);
          if (onlyEco) cachedData = cachedData.filter((p) => p.isEcoFriendly);
          setProducts(cachedData);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const url = `/api/products?${queryParams.join('&')}`;
        const { data } = await axios.get(url);

        // If another filter change was triggered while this request was flying, ignore this stale result
        if (!isCurrent) return;

        if (data.success) {
          // Store raw fetched list in cache
          productsCache.current[cacheKey] = data.products;

          let filteredProducts = data.products;

          // In-memory filters for badges
          if (onlySHG) {
            filteredProducts = filteredProducts.filter((p) => p.seller?.sellerProfile?.isSHG);
          }
          if (onlyWomen) {
            filteredProducts = filteredProducts.filter((p) => p.seller?.sellerProfile?.isWomenEntrepreneur);
          }
          if (onlyEco) {
            filteredProducts = filteredProducts.filter((p) => p.isEcoFriendly);
          }

          // Dynamic distance sorting (nearest first)
          filteredProducts.sort((a, b) => {
            const coordsA = a.seller?.location?.coordinates;
            const coordsB = b.seller?.location?.coordinates;
            if (!coordsA && !coordsB) return 0;
            if (!coordsA) return 1;
            if (!coordsB) return -1;
            const distA = calculateDistance(lat, lng, coordsA[1], coordsA[0]);
            const distB = calculateDistance(lat, lng, coordsB[1], coordsB[0]);
            return distA - distB;
          });

          setProducts(filteredProducts);
        }
      } catch (error) {
        if (!isCurrent) return;
        console.error('Error loading products:', error);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchFilteredProducts();

    return () => {
      isCurrent = false; // Mark previous request as cancelled/stale
    };
  }, [debouncedKeyword, category, yieldType, difficulty, indoorOutdoor, lat, lng, debouncedDistance, coordsDetected, onlySHG, onlyWomen, onlyEco]);

  // Leaflet Map logic
  useEffect(() => {
    if (viewMode === 'map' && mapContainerRef.current) {
      // Clear previous map if exists
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      // Initialize map
      mapInstance.current = L.map(mapContainerRef.current).setView([lat, lng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current);

      // Add center marker
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="bg-primary-600 w-3 h-3 rounded-full border-2 border-white ring-4 ring-primary-600/30"></div>`,
          iconSize: [12, 12],
        }),
      })
        .addTo(mapInstance.current)
        .bindPopup('<b>Your Location</b>');

      markerGroup.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [viewMode]);

  // Intercept map popup links for SPA navigation without page refresh
  useEffect(() => {
    const handlePopupClick = (e) => {
      const target = e.target.closest('a[href^="/meet/"]');
      if (target) {
        e.preventDefault();
        const path = target.getAttribute('href');
        if (path) {
          navigate(path);
        }
      }
    };

    const container = mapContainerRef.current;
    if (container) {
      container.addEventListener('click', handlePopupClick);
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handlePopupClick);
      }
    };
  }, [navigate, viewMode]);

  // Update map markers when products change
  useEffect(() => {
    if (viewMode === 'map' && mapInstance.current && markerGroup.current) {
      markerGroup.current.clearLayers();

      // Track unique sellers to avoid overlapping markers
      const uniqueSellers = {};
      products.forEach((p) => {
        if (p.seller && p.seller.location?.coordinates) {
          const sellerId = p.seller._id;
          if (!uniqueSellers[sellerId]) {
            uniqueSellers[sellerId] = {
              name: p.seller.name,
              businessName: p.seller.sellerProfile?.businessName || p.seller.name,
              coords: [p.seller.location.coordinates[1], p.seller.location.coordinates[0]],
              products: [],
            };
          }
          uniqueSellers[sellerId].products.push(p);
        }
      });

      // Plot markers
      Object.keys(uniqueSellers).forEach((sellerId) => {
        const s = uniqueSellers[sellerId];
        const markerIcon = L.divIcon({
          className: 'custom-seller-icon',
          html: `<div class="bg-emerald-800 text-white p-2 rounded-xl border border-white font-bold text-xs shadow flex items-center justify-center space-x-1"><span class="w-2 h-2 rounded-full bg-emerald-300"></span><span>GROWER</span></div>`,
          iconSize: [75, 30],
        });

        const popupContent = `
          <div class="p-2 space-y-1">
            <h4 class="font-bold text-slate-900 leading-tight text-sm">${s.businessName}</h4>
            <p class="text-xxs text-slate-500">By ${s.name}</p>
            <div class="h-px bg-slate-200 my-1.5"></div>
            <p class="text-xs font-semibold text-slate-700">Products Nearby:</p>
            <ul class="text-xs text-slate-600 list-disc list-inside">
              ${s.products.slice(0, 3).map((prod) => `<li>${prod.name} - ₹${prod.price}</li>`).join('')}
            </ul>
            <a href="/meet/${sellerId}" class="block text-center bg-emerald-800 text-white font-bold text-xxs py-1.5 rounded-lg mt-2 hover:bg-emerald-950 transition-colors">Meet the Maker</a>
          </div>
        `;

        L.marker(s.coords, { icon: markerIcon })
          .addTo(markerGroup.current)
          .bindPopup(popupContent);
      });
    }
  }, [products, viewMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-primary-950">{t('marketplace.title')}</h1>
          <p className="text-slate-500 text-sm">{t('marketplace.subtitle')}</p>
        </div>
        <div className="flex items-center bg-organic-100 rounded-xl border border-organic-200 p-1 space-x-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-white text-primary-900 shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>{t('marketplace.gridView')}</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'map' ? 'bg-white text-primary-900 shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapIcon className="h-4 w-4" />
            <span>{t('marketplace.mapView')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Sidebar Filters */}
        <div className="bg-white border border-organic-200 rounded-2xl p-6 shadow-sm self-start space-y-6">
          <div className="flex justify-between items-center border-b border-organic-100 pb-3">
            <span className="font-display font-bold text-slate-900 flex items-center space-x-1.5">
              <SlidersHorizontal className="h-4.5 w-4.5 text-slate-500" />
              <span>{t('common.filter')}</span>
            </span>
            <button
              onClick={handleResetAll}
              className="text-xxs text-primary-700 hover:underline font-semibold"
            >
              {t('common.resetAll')}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              id="marketplaceSearch"
              name="keyword"
              type="text"
              placeholder={`${t('common.search')}...`}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {/* Hyperlocal distance slider */}
          <div className="space-y-2 border-t border-organic-100 pt-4">
            <div className="flex justify-between items-center">
              <label htmlFor="distanceRange" className="text-xs font-semibold text-slate-800">{t('marketplace.distance')}</label>
              <button
                onClick={detectUserLocation}
                className="text-[10px] text-emerald-700 hover:underline font-bold flex items-center space-x-0.5"
              >
                <Navigation className="h-2.5 w-2.5" />
                <span>{t('marketplace.locateMe')}</span>
              </button>
            </div>
            <div className="space-y-1">
              <input
                id="distanceRange"
                name="distance"
                type="range"
                min="2"
                max="50"
                className="w-full accent-primary-600 cursor-pointer"
                value={distance}
                onChange={(e) => {
                  setDistance(Number(e.target.value));
                  setCoordsDetected(true);
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Nearby ({distance} km)</span>
                <span>Active coordinates: {lat.toString().substring(0, 5)}, {lng.toString().substring(0, 5)}</span>
              </div>
            </div>
          </div>

          {/* Badges Filters */}
          <div className="space-y-2.5 border-t border-organic-100 pt-4">
            <span className="text-xs font-semibold text-slate-800 block">Maker Certifications</span>
            <div className="space-y-2">
              <label htmlFor="filterOnlySHG" className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  id="filterOnlySHG"
                  name="onlySHG"
                  type="checkbox"
                  className="rounded border-organic-300 text-primary-600 focus:ring-primary-500"
                  checked={onlySHG}
                  onChange={(e) => setOnlySHG(e.target.checked)}
                />
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Self Help Group (SHG)</span>
                </span>
              </label>
              <label htmlFor="filterOnlyWomen" className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  id="filterOnlyWomen"
                  name="onlyWomen"
                  type="checkbox"
                  className="rounded border-organic-300 text-primary-600 focus:ring-primary-500"
                  checked={onlyWomen}
                  onChange={(e) => setOnlyWomen(e.target.checked)}
                />
                <span className="flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-pink-500" />
                  <span>Women Entrepreneur</span>
                </span>
              </label>
              <label htmlFor="filterOnlyEco" className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  id="filterOnlyEco"
                  name="onlyEco"
                  type="checkbox"
                  className="rounded border-organic-300 text-primary-600 focus:ring-primary-500"
                  checked={onlyEco}
                  onChange={(e) => setOnlyEco(e.target.checked)}
                />
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Eco-Friendly Badge</span>
                </span>
              </label>
            </div>
          </div>

          {/* Main Category Filter */}
          <div className="space-y-2 border-t border-organic-100 pt-4">
            <label htmlFor="productCategory" className="text-xs font-semibold text-slate-800 block">
              Product Category
            </label>
            <select
              id="productCategory"
              name="category"
              className="w-full p-2 text-xs rounded-lg border border-organic-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer shadow-2xs"
              value={selectedMainCategory}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
            >
              {MAIN_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter for Plants */}
          {selectedMainCategory === 'Plants' && (
            <div className="space-y-2 border-t border-organic-100 pt-3">
              <div className="flex justify-between items-center">
                <label htmlFor="plantSubcategorySelect" className="text-xs font-semibold text-slate-800">
                  Plant Subcategory
                </label>
                {selectedSubcategory && (
                  <button
                    type="button"
                    onClick={() => handleSubcategoryChange('')}
                    className="text-[10px] text-primary-700 hover:underline font-semibold"
                  >
                    All Plants
                  </button>
                )}
              </div>
              <select
                id="plantSubcategorySelect"
                name="plantSubcategory"
                className="w-full p-2 text-xs rounded-lg border border-organic-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer shadow-2xs"
                value={selectedSubcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
              >
                {PLANT_SUBCATEGORIES.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subcategory Filter for Eco Products */}
          {selectedMainCategory === 'Eco Products' && ecoSubcategories.length > 0 && (
            <div className="space-y-2 border-t border-organic-100 pt-3">
              <div className="flex justify-between items-center">
                <label htmlFor="ecoSubcategorySelect" className="text-xs font-semibold text-slate-800">
                  Eco Subcategory
                </label>
                {selectedSubcategory && (
                  <button
                    type="button"
                    onClick={() => handleSubcategoryChange('')}
                    className="text-[10px] text-primary-700 hover:underline font-semibold"
                  >
                    All Eco Products
                  </button>
                )}
              </div>
              <select
                id="ecoSubcategorySelect"
                name="ecoSubcategory"
                className="w-full p-2 text-xs rounded-lg border border-organic-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer shadow-2xs"
                value={selectedSubcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
              >
                <option value="">All Eco Products</option>
                {ecoSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subcategory Filter for FMCG / Natural Products */}
          {selectedMainCategory === 'FMCG / Natural Products' && fmcgSubcategories.length > 0 && (
            <div className="space-y-2 border-t border-organic-100 pt-3">
              <div className="flex justify-between items-center">
                <label htmlFor="fmcgSubcategorySelect" className="text-xs font-semibold text-slate-800">
                  Subcategory
                </label>
                {selectedSubcategory && (
                  <button
                    type="button"
                    onClick={() => handleSubcategoryChange('')}
                    className="text-[10px] text-primary-700 hover:underline font-semibold"
                  >
                    All FMCG / Natural
                  </button>
                )}
              </div>
              <select
                id="fmcgSubcategorySelect"
                name="fmcgSubcategory"
                className="w-full p-2 text-xs rounded-lg border border-organic-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer shadow-2xs"
                value={selectedSubcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
              >
                <option value="">All FMCG / Natural Products</option>
                {fmcgSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plant Care options */}
          <div className="space-y-3 border-t border-organic-100 pt-4">
            <span className="text-xs font-semibold text-slate-800 block font-display">Plant care filters</span>
            
            <div className="space-y-1">
              <label htmlFor="difficultyLevel" className="text-[10px] text-slate-400 block uppercase font-medium">Difficulty</label>
              <select
                id="difficultyLevel"
                name="difficulty"
                className="w-full p-1.5 text-xs rounded border border-organic-200 bg-white"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Any Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="indoorOutdoorSetting" className="text-[10px] text-slate-400 block uppercase font-medium">Setting</label>
              <select
                id="indoorOutdoorSetting"
                name="indoorOutdoor"
                className="w-full p-1.5 text-xs rounded border border-organic-200 bg-white"
                value={indoorOutdoor}
                onChange={(e) => setIndoorOutdoor(e.target.value)}
              >
                <option value="">Indoor / Outdoor</option>
                <option value="Indoor">Indoor Only</option>
                <option value="Outdoor">Outdoor Only</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center/Right Section: Listings */}
        <div className="lg:col-span-3">
          {viewMode === 'map' ? (
            <div className="h-[65vh] relative rounded-3xl border border-organic-200 overflow-hidden shadow-inner bg-organic-100">
              <div ref={mapContainerRef} className="absolute inset-0"></div>
            </div>
          ) : loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-organic-100 h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-organic-200 rounded-3xl space-y-3">
              <span className="block text-slate-400 font-bold">No Products Found</span>
              <span className="block text-xs text-slate-500">Try adjusting your filters or expansion range.</span>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {products.map((p, index) => (
                <div
                  key={p._id}
                  className="bg-white border border-organic-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all flex flex-col justify-between group"
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}
                >
                  <div className="relative bg-organic-100">
                    <img
                      src={getProductImage(p)}
                      onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }}
                      alt={p.name}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={index < 3 ? 'high' : 'low'}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {p.seller?.sellerProfile?.isSHG && (
                        <span className="bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-0.5 shadow-sm">
                          <ShieldCheck className="h-3 w-3" />
                          <span>SHG</span>
                        </span>
                      )}
                      {p.seller?.sellerProfile?.isWomenEntrepreneur && (
                        <span className="bg-pink-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-0.5 shadow-sm">
                          <Sparkles className="h-3 w-3" />
                          <span>Women Owned</span>
                        </span>
                      )}
                      {p.seller?.sellerProfile?.isVerified && (
                        <span className="bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-0.5 shadow-sm">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified Seller</span>
                        </span>
                      )}
                      {p.sourceVerification?.isSourceVerified && (
                        <span className="bg-teal-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-0.5 shadow-sm">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Source Verified</span>
                        </span>
                      )}
                    </div>
                    {p.isEcoFriendly && (
                      <span className="absolute bottom-3 right-3 bg-emerald-800 text-emerald-100 font-semibold text-[10px] px-2 py-0.5 rounded-lg border border-emerald-600">
                        Eco Friendly
                      </span>
                    )}
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(p._id);
                        }}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow hover:bg-white transition-all text-slate-500 hover:text-red-500 z-10"
                        title={wishlistIds.includes(p._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`h-4 w-4 ${wishlistIds.includes(p._id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    )}
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{p.category}</span>
                        {p.seller && (
                          <span className="font-semibold text-emerald-800">
                            By: {p.seller.sellerProfile?.businessName || p.seller.name}
                          </span>
                        )}
                      </div>
                      {p.seller?.location?.coordinates && (
                        <div className="flex items-center text-[10px] text-slate-500 font-semibold mt-0.5">
                          <MapPin className="h-3 w-3 text-emerald-700 mr-0.5" />
                          <span>
                            {p.seller.sellerProfile?.businessName || p.seller.name} &bull; {calculateDistance(lat, lng, p.seller.location.coordinates[1], p.seller.location.coordinates[0]).toFixed(0)} km
                          </span>
                        </div>
                      )}
                      <Link to={`/products/${p._id}`} className="block font-display font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-organic-100 gap-2">
                      <div>
                        <span className="text-xxs text-slate-400 uppercase font-medium">Price</span>
                        <span className="block font-bold text-slate-900 text-base">₹{p.price}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/products/${p._id}`}
                          className="bg-primary-50 text-primary-800 border border-primary-100 hover:bg-primary-600 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          Details
                        </Link>
                        {p.stock > 0 ? (
                          addToCart && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await addToCart(p, 1);
                                if (res && res.success) {
                                  // Added to cart cleanly without intrusive popup
                                }
                              }}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              + Cart
                            </button>
                          )
                        ) : (
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
